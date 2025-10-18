import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SaveGame,
  EnemyInstance,
  DoorType,
  LootEntry,
  AnimalConfig,
  AmmoKind,
  WeaponConfig,
  WeaponName,
  WeaponState,
  ChestRarity,
  MedalResource,
  MedalStatus,
  Resource
} from "@/game/types";
import {
  loadAnimalsConfig,
  loadChestsConfig,
  loadDoorLootTables,
  loadHouseConfig,
  loadWeaponsConfig,
  ChestsConfig,
  HouseConfig
} from "@/data/loaders";
import {
  normalizeBonusType,
  getWeaponAmmoKind,
  normalizeLootKey
} from "@/data/normalize";
import { normalizeDoorLootTableRecords, rollLoot } from "@/game/loot";
import { ALL_DOOR_TYPES, applyConflicts, computeAvailable, decrementBlocks } from "@/game/pool";
import { RNG, createTurnSeed } from "@/game/rng";
import { tickHouseBonuses } from "@/game/house";
import {
  MEDAL_DEFINITIONS,
  isMedalResource,
  medalResourceToDoorType
} from "@/game/medals";
import { getChestDefinition } from "@/game/chests";
import {
  applyGrowthToInstance,
  computeBattleStats,
  getLifeCap,
  getStaminaCap
} from "@/game/animals";
import {
  createSaveTemplate,
  deleteSlot,
  ensureVersion,
  getActiveSlot,
  listSlots,
  loadSave,
  persistSave,
  renameSlot,
  saveSlots,
  SaveSlotMeta,
  setActiveSlot
} from "@/save/saves";
import { runMigrations } from "@/save/migrations";
import { simulateAnimalDuel, simulateWeaponAttack } from "@/game/battle";
import type { DoorLootTablesRegistry } from "@/game/loot";

type Status = "idle" | "loading" | "ready" | "error";
type OnlineStatus = "unknown" | "checking" | "online" | "offline";

interface HouseBlueprint {
  id: number;
  name: string;
  piecesNeeded: number;
  bonus: {
    type: "Coins" | "Food" | "Ammo" | "Mixed";
    amount: number | number[];
    turnsCooldown: number;
  };
}

interface GameConfigs {
  animals: AnimalConfig[];
  weapons: WeaponConfig[];
  lootTables: DoorLootTablesRegistry;
  chests: ChestsConfig;
  house: HouseBlueprint[];
  medals: typeof MEDAL_DEFINITIONS;
}

interface DoorEncounter {
  enemies: EnemyInstance[];
  type: DoorType;
}

interface PendingReward {
  doorType: DoorType;
  loot: LootEntry | null;
  weaponsUsed: { name: WeaponName; shots: number }[];
  fallenAnimals: { configId: number }[];
  medalUnlocked?: DoorType | null;
}

interface ChestOpenResult {
  loot: LootEntry | null;
  medalUnlocked: DoorType | null;
}

interface GameStoreState {
  status: Status;
  onlineStatus: OnlineStatus;
  error: string | null;
  configs: GameConfigs | null;
  slots: SaveSlotMeta[];
  activeSlotId: string | null;
  save: SaveGame | null;
  pendingReward: PendingReward | null;
  battleResult: "victory" | "defeat" | null;
  weaponsPhaseLocked: boolean;
  bootstrap: () => Promise<void>;
  refreshSlots: () => void;
  createSlot: (name?: string) => Promise<void>;
  duplicateSlot: (slotId: string) => void;
  loadSlot: (slotId: string) => Promise<void>;
  renameSlot: (slotId: string, name: string) => void;
  deleteSlot: (slotId: string) => void;
  drawLobbyDoors: () => DoorType[];
  openDoor: (doorType: DoorType) => DoorEncounter | null;
  resolveWeaponAttack: (weapon: WeaponName, ammoToSpend: number) => void;
  resolveAnimalDuel: (animalIndex: number) => void;
  feedAnimal: (animalIndex: number) => void;
  growAnimal: (animalIndex: number) => void;
  openChest: (rarity: ChestRarity) => ChestOpenResult | null;
  collectReward: () => void;
  setOnlineStatus: (status: OnlineStatus) => void;
  resetBattleResult: () => void;
  acknowledgeMedalHighlight: () => void;
}

const defaultBattleState: SaveGame["battleState"] = {
  active: false,
  door: null,
  usedWeapons: [],
  fallenAnimals: [],
  weaponsLocked: false
};

const ammoOrder: AmmoKind[] = ["bullets", "shells", "arrows", "darts", "grenades"];

const CHEST_RARITIES: ChestRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

const ensureChestInventory = (
  inventory?: Partial<Record<ChestRarity, number>>
): Record<ChestRarity, number> => {
  return CHEST_RARITIES.reduce<Record<ChestRarity, number>>((acc, rarity) => {
    const value = inventory?.[rarity];
    acc[rarity] = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
    return acc;
  }, {} as Record<ChestRarity, number>);
};

const ensureMedalEntries = (
  entries?: Partial<Record<DoorType, MedalStatus>>
): Record<DoorType, MedalStatus> => {
  return ALL_DOOR_TYPES.reduce<Record<DoorType, MedalStatus>>((acc, doorType) => {
    const current = entries?.[doorType];
    acc[doorType] = {
      unlocked: current?.unlocked ?? false,
      unlockedAt: current?.unlockedAt ?? null,
      highlightUntil: current?.highlightUntil ?? null
    };
    return acc;
  }, {} as Record<DoorType, MedalStatus>);
};

const chestIdMap: Record<ChestRarity, string> = {
  common: "common",
  uncommon: "common",
  rare: "rare",
  epic: "epic",
  legendary: "epic"
};

const parseChestQuantity = (raw: string | undefined, rng: RNG): number => {
  if (!raw) return 1;
  const trimmed = raw.trim();
  if (trimmed.includes("-")) {
    const [low, high] = trimmed.split("-").map((value) => Number(value));
    if (!Number.isFinite(low) || !Number.isFinite(high)) {
      return 1;
    }
    const min = Math.min(low, high);
    const max = Math.max(low, high);
    return rng.nextInt(min, max);
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 1;
};

const selectChestReward = (
  entries: ChestsConfig["bauli"][number]["loot"],
  rng: RNG
) => {
  const total = entries.reduce((sum, entry) => sum + (entry.peso ?? 0), 0);
  if (total <= 0) return null;
  const roll = rng.nextFloat() * total;
  let cumulative = 0;
  for (const entry of entries) {
    cumulative += entry.peso ?? 0;
    if (roll <= cumulative) {
      return entry;
    }
  }
  return entries.at(-1) ?? null;
};

const rollChestLoot = (
  configs: ChestsConfig,
  rarity: ChestRarity,
  rng: RNG
): LootEntry | null => {
  const targetId = chestIdMap[rarity] ?? rarity;
  const chest = configs.bauli.find((entry) => entry.id === targetId);
  if (!chest) return null;
  const selected = selectChestReward(chest.loot, rng);
  if (!selected || !selected.loot) {
    return null;
  }
  const resource = normalizeLootKey(selected.loot);
  if (resource === "none") {
    return null;
  }
  const quantity = parseChestQuantity(selected.quantita, rng);
  return {
    type: resource,
    qty: quantity
  };
};

const ensureInventoryAmmo = (ammo: Partial<Record<AmmoKind, number>>): Record<AmmoKind, number> => {
  const next: Record<AmmoKind, number> = {
    bullets: 0,
    shells: 0,
    arrows: 0,
    darts: 0,
    grenades: 0
  };

  for (const key of ammoOrder) {
    if (typeof ammo[key] === "number" && Number.isFinite(ammo[key])) {
      next[key] = Math.max(0, Math.floor(ammo[key]!));
    }
  }
  return next;
};

const buildWeaponsState = (configs: WeaponConfig[], existing?: WeaponState[]): WeaponState[] => {
  return configs.map((weapon) => {
    const stored = existing?.find((entry) => entry.name === weapon.name);
    if (stored) {
      return {
        name: weapon.name,
        ammo: Math.max(0, stored.ammo ?? 0),
        unlocked: stored.unlocked ?? weapon.name === "pistol"
      };
    }
    return {
      name: weapon.name,
      ammo: 0,
      unlocked: weapon.name === "pistol"
    };
  });
};

const buildHouseBlueprints = (config: HouseConfig): HouseBlueprint[] => {
  return config.arredamento.map((item) => ({
    id: item.id,
    name: item.nome,
    piecesNeeded: item.pezzi,
    bonus: {
      type: normalizeBonusType(item.bonus.tipo),
      amount: item.bonus.quantita,
      turnsCooldown: item.bonus.cooldown
    }
  }));
};

const buildHouseState = (
  blueprints: HouseBlueprint[],
  existing?: SaveGame["house"]["objects"]
): SaveGame["house"]["objects"] => {
  return blueprints.map((blueprint) => {
    const stored = existing?.find((object) => object.id === blueprint.id);
    return {
      id: blueprint.id,
      name: blueprint.name,
      piecesNeeded: blueprint.piecesNeeded,
      piecesOwned: stored?.piecesOwned ?? 0,
      unlocked: stored?.unlocked ?? false,
      bonus: {
        type: blueprint.bonus.type,
        amount: blueprint.bonus.amount,
        turnsCooldown: blueprint.bonus.turnsCooldown
      },
      turnsToNextBonus: stored?.turnsToNextBonus ?? null
    };
  });
};

const syncSaveWithConfigs = (save: SaveGame, configs: GameConfigs): SaveGame => {
  return {
    ...save,
    weapons: buildWeaponsState(configs.weapons, save.weapons),
    house: {
      objects: buildHouseState(configs.house, save.house.objects)
    },
    inventory: {
      ...save.inventory,
      ammo: ensureInventoryAmmo(save.inventory.ammo)
    },
    animals: {
      owned: normalizeOwnedAnimals(save.animals.owned, configs.animals),
      bestiarySeen: save.animals.bestiarySeen
    },
    chests: {
      unlockedHistory: save.chests?.unlockedHistory ?? [],
      inventory: ensureChestInventory(save.chests?.inventory)
    },
    progress: {
      ...save.progress,
      availablePool: computeAvailable(
        save.progress.availablePool.length ? save.progress.availablePool : ALL_DOOR_TYPES,
        save.progress.blockedDoors
      )
    },
    battleState: save.battleState ?? defaultBattleState,
    medals: {
      entries: ensureMedalEntries(save.medals?.entries),
      dropRate: save.medals?.dropRate ?? MEDAL_DEFINITIONS[0]?.dropRate ?? 0.002,
      highlighted: save.medals?.highlighted ?? null
    }
  };
};

const regenerateAnimalStamina = (
  animals: SaveGame["animals"]["owned"],
  configs: AnimalConfig[],
  amount: number
): SaveGame["animals"]["owned"] => {
  if (amount <= 0) return animals;
  return animals.map((animal) => {
    const config = configs.find((entry) => entry.id === animal.configId);
    if (!config) return animal;
    if (!animal.alive) return animal;
    const staminaCap = getStaminaCap(config, animal.size);
    const nextStamina = Math.min(staminaCap, animal.stamina + amount);
    return {
      ...animal,
      stamina: nextStamina
    };
  });
};

const normalizeOwnedAnimals = (
  animals: SaveGame["animals"]["owned"],
  configs: AnimalConfig[]
): SaveGame["animals"]["owned"] => {
  return animals.map((animal) => {
    const config = configs.find((entry) => entry.id === animal.configId);
    if (!config) return animal;
    const lifeCap = getLifeCap(config, animal.size);
    const staminaCap = getStaminaCap(config, animal.size);
    const nextLife = Math.min(Math.max(0, animal.life), lifeCap);
    const nextStamina = Math.min(Math.max(0, animal.stamina), staminaCap);
    return {
      ...animal,
      life: nextLife,
      stamina: nextStamina
    };
  });
};

const applyHouseRewards = (
  save: SaveGame,
  triggers: ReturnType<typeof tickHouseBonuses>["triggers"]
): SaveGame => {
  if (!triggers.length) {
    return save;
  }
  const inventory = { ...save.inventory, ammo: { ...save.inventory.ammo } };

  for (const trigger of triggers) {
    const amount = trigger.bonus.amount;
    switch (trigger.bonus.type) {
      case "Coins":
      case "Monete": {
        const value = Array.isArray(amount)
          ? amount.reduce((sum, current) => sum + (typeof current === "number" ? current : 0), 0)
          : amount;
        inventory.coins += value;
        break;
      }
      case "Food":
      case "Cibo": {
        const value = Array.isArray(amount)
          ? amount.reduce((sum, current) => sum + (typeof current === "number" ? current : 0), 0)
          : amount;
        inventory.food += value;
        break;
      }
      case "Ammo":
      case "Munizioni": {
        if (Array.isArray(amount)) {
          amount.forEach((value, index) => {
            const ammoKind = ammoOrder[index];
            if (!ammoKind) return;
            if (typeof value === "number") {
              inventory.ammo[ammoKind] += value;
            }
          });
        } else {
          ammoOrder.forEach((ammoKind) => {
            inventory.ammo[ammoKind] += amount;
          });
        }
        break;
      }
      case "Mixed": {
        if (Array.isArray(amount)) {
          const [coins = 0, food = 0, ammoValue = 0] = amount;
          inventory.coins += typeof coins === "number" ? coins : 0;
          inventory.food += typeof food === "number" ? food : 0;
          ammoOrder.forEach((ammoKind) => {
            if (typeof ammoValue === "number") {
              inventory.ammo[ammoKind] += ammoValue;
            }
          });
        } else {
          inventory.coins += amount;
          inventory.food += amount;
        }
        break;
      }
      default:
        break;
    }
  }

  return {
    ...save,
    inventory
  };
};

const randomForDoor = (save: SaveGame, door: DoorType, offset = 0) => {
  const typeHash = Array.from(door).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = createTurnSeed(save.meta.rngSeed, save.progress.turn + 1 + offset * 13 + typeHash);
  return new RNG(seed);
};

const generateDoorEncounter = (
  save: SaveGame,
  door: DoorType,
  animals: AnimalConfig[]
): EnemyInstance[] => {
  if (!animals.length) return [];

  const rng = randomForDoor(save, door);
  const enemyChance = rng.nextFloat();
  if (enemyChance < 0.35) {
    return [];
  }

  const count = rng.nextInt(1, Math.min(3, animals.length));
  const picked: EnemyInstance[] = [];
  const pool = [...animals];

  for (let i = 0; i < count; i += 1) {
    const index = rng.nextInt(0, pool.length - 1);
    const config = pool.splice(index, 1)[0];
    picked.push({
      configId: config.id,
      life: config.life,
      damage: config.damage,
      attackSpeed: config.attackSpeed,
      size: config.size
    });
  }

  return picked;
};

const ensureDoorHistoryLimit = (history: SaveGame["doorHistory"], limit = 50) => {
  if (history.length <= limit) return history;
  return history.slice(history.length - limit);
};

export const useGameStore = create<GameStoreState>()(
  immer((set, get) => ({
    status: "idle",
    onlineStatus: "unknown",
    error: null,
    configs: null,
    slots: [],
    activeSlotId: null,
    save: null,
    pendingReward: null,
    battleResult: null,
    weaponsPhaseLocked: false,

    setOnlineStatus: (status) => {
      set({ onlineStatus: status });
    },

    resetBattleResult: () => {
      set({ battleResult: null });
    },

    bootstrap: async () => {
      if (get().status === "loading") {
        return;
      }

      set((state) => {
        state.status = "loading";
        state.error = null;
      });

      try {
        ensureVersion();
        const [animals, weaponsConfig, doorTablesRaw, chests, houseConfig] = await Promise.all([
          loadAnimalsConfig(),
          loadWeaponsConfig(),
          loadDoorLootTables(),
          loadChestsConfig(),
          loadHouseConfig()
        ]);

        const configs: GameConfigs = {
          animals,
          weapons: weaponsConfig,
          lootTables: normalizeDoorLootTableRecords(doorTablesRaw),
          chests,
          house: buildHouseBlueprints(houseConfig),
          medals: MEDAL_DEFINITIONS
        };

        let slots = listSlots();
        let activeSlotId = getActiveSlot();
        let save = activeSlotId ? loadSave(activeSlotId) : null;

        if (!save || !activeSlotId) {
          const slotId = `slot-${Date.now()}`;
          const weapons = buildWeaponsState(configs.weapons);
          const houseObjects = buildHouseState(configs.house);
          save = createSaveTemplate(slotId, weapons, houseObjects);
          save = syncSaveWithConfigs(save, configs);
          const newSlot: SaveSlotMeta = {
            id: slotId,
            name: "Nuovo salvataggio",
            createdAt: save.meta.createdAt,
            updatedAt: save.meta.updatedAt
          };
          slots = [...slots, newSlot];
          saveSlots(slots);
          setActiveSlot(slotId);
          persistSave(save);
          activeSlotId = slotId;
        } else {
          const migrated = runMigrations(save);
          save = syncSaveWithConfigs(migrated, configs);
        }

        set({
          status: "ready",
          configs,
          slots,
          activeSlotId,
          save,
          pendingReward: null,
          battleResult: null,
          weaponsPhaseLocked: false
        });
      } catch (error) {
        set({
          status: "error",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    },

    refreshSlots: () => {
      set({ slots: listSlots() });
    },

    createSlot: async (name) => {
      const { configs } = get();
      if (!configs) return;

      const slotId = `slot-${Date.now()}`;
      const weapons = buildWeaponsState(configs.weapons);
      const houseObjects = buildHouseState(configs.house);
      let save = createSaveTemplate(slotId, weapons, houseObjects);
      save = syncSaveWithConfigs(save, configs);
      persistSave(save);

      const slots = [...listSlots(), {
        id: slotId,
        name: name ?? "Salvataggio",
        createdAt: save.meta.createdAt,
        updatedAt: save.meta.updatedAt
      }];
      saveSlots(slots);
      setActiveSlot(slotId);

      set({
        slots,
        activeSlotId: slotId,
        save
      });
    },

    duplicateSlot: (slotId) => {
      const { configs } = get();
      if (!configs) return;

      const source = loadSave(slotId);
      if (!source) return;

      const migrated = runMigrations(source);
      const synced = syncSaveWithConfigs(migrated, configs);
      const newSlotId = `slot-${Date.now()}`;
      const baseTimestamp = new Date().toISOString();
      const slots = listSlots();
      const originalMeta = slots.find((slot) => slot.id === slotId);
      const baseName = originalMeta ? `${originalMeta.name} (Copia)` : "Salvataggio (Copia)";
      let candidateName = baseName;
      let suffix = 2;
      while (slots.some((slot) => slot.name.toLowerCase() === candidateName.toLowerCase())) {
        candidateName = `${baseName} ${suffix}`;
        suffix += 1;
      }

      const duplicatedSave: SaveGame = {
        ...synced,
        meta: {
          ...synced.meta,
          slotId: newSlotId,
          createdAt: baseTimestamp,
          updatedAt: baseTimestamp,
          rngSeed: Math.floor(Math.random() * 0xffffffff)
        }
      };

      const nextSlots = [
        ...slots,
        {
          id: newSlotId,
          name: candidateName,
          createdAt: baseTimestamp,
          updatedAt: baseTimestamp
        }
      ];
      saveSlots(nextSlots);
      persistSave(duplicatedSave);

      set({
        slots: listSlots()
      });
    },

    loadSlot: async (slotId: string) => {
      const { configs } = get();
      if (!configs) return;

      const save = loadSave(slotId);
      if (!save) {
        return;
      }
      const migrated = runMigrations(save);
      const synced = syncSaveWithConfigs(migrated, configs);
      setActiveSlot(slotId);
      set({
        activeSlotId: slotId,
        save: synced,
        pendingReward: null,
        weaponsPhaseLocked: false,
        battleResult: null
      });
    },

    renameSlot: (slotId, name) => {
      renameSlot(slotId, name);
      set({
        slots: listSlots()
      });
    },

    deleteSlot: (slotId) => {
      deleteSlot(slotId);
      const activeSlotId = getActiveSlot();
      set({
        slots: listSlots(),
        activeSlotId,
        save: activeSlotId ? loadSave(activeSlotId) : null
      });
    },

    drawLobbyDoors: () => {
      const { save } = get();
      if (!save) return [];

      const blocked = decrementBlocks(save.progress.blockedDoors);
      const available = computeAvailable(ALL_DOOR_TYPES, blocked);
      const rng = new RNG(createTurnSeed(save.meta.rngSeed, save.progress.turn + 1));
      const pool = [...available];
      const drawn: DoorType[] = [];
      const desiredCount = Math.min(3, pool.length);
      for (let i = 0; i < desiredCount; i += 1) {
        const index = rng.nextInt(0, pool.length - 1);
        drawn.push(pool.splice(index, 1)[0]);
      }

      const updated: SaveGame = {
        ...save,
        progress: {
          ...save.progress,
          blockedDoors: blocked,
          availablePool: available,
          lastLobbyDraw: drawn
        },
        battleState: defaultBattleState
      };

      persistSave(updated);
      set({
        save: updated,
        pendingReward: null,
        weaponsPhaseLocked: false
      });

      return drawn;
    },

    openDoor: (doorType: DoorType) => {
      const { save, configs } = get();
      if (!save || !configs) return null;

      const enemies = generateDoorEncounter(save, doorType, configs.animals);
      const nextBattleState = enemies.length
        ? {
            active: true,
            door: {
              type: doorType,
              enemies,
              index: 0
            },
            usedWeapons: [],
            fallenAnimals: [],
            weaponsLocked: false
          }
        : defaultBattleState;

      let nextSave: SaveGame = {
        ...save,
        battleState: nextBattleState
      };

      let pendingReward: PendingReward | null = null;

      if (!enemies.length) {
        const lootRng = randomForDoor(save, doorType, 7);
        const loot = rollLoot(doorType, configs.lootTables, lootRng);
        const inventory = { ...save.inventory, ammo: { ...save.inventory.ammo } };
        if (loot) {
          if (loot.type in inventory.ammo) {
            const ammoType = loot.type as AmmoKind;
            inventory.ammo[ammoType] += loot.qty;
          } else if (loot.type === "coins") {
            inventory.coins += loot.qty;
          } else if (loot.type === "food") {
            inventory.food += loot.qty;
          } else if (loot.type === "armor") {
            inventory.armors = [
              ...inventory.armors,
              {
                id: `armor-${Date.now()}`,
                tier: 1,
                durability: Math.max(5, loot.qty * 5)
              }
            ];
          } else if (loot.type === "specialItem") {
            inventory.specialItems = [...inventory.specialItems, `item-${Date.now()}`];
          }
        }

        const decremented = decrementBlocks(save.progress.blockedDoors);
        const conflictsRng = randomForDoor(save, doorType, 11);
        const blocked = applyConflicts(doorType, decremented, conflictsRng);
        const available = computeAvailable(ALL_DOOR_TYPES, blocked);
        const { objects, triggers } = tickHouseBonuses(save.house.objects);
        nextSave = applyHouseRewards(
          {
            ...nextSave,
            progress: {
              doorsOpened: save.progress.doorsOpened + 1,
              turn: save.progress.turn + 1,
              blockedDoors: blocked,
              availablePool: available,
              lastLobbyDraw: []
            },
            inventory,
            house: {
              objects
            },
            doorHistory: ensureDoorHistoryLimit([
              ...save.doorHistory,
              {
                type: doorType,
                result: "reward",
                loot,
                timestamp: new Date().toISOString()
              }
            ])
          },
          triggers
        );

        pendingReward = {
          doorType,
          loot,
          weaponsUsed: [],
          fallenAnimals: []
        };

        persistSave(nextSave);
      } else {
        nextSave = {
          ...nextSave,
          animals: {
            ...nextSave.animals,
            bestiarySeen: Array.from(
              new Set([...nextSave.animals.bestiarySeen, ...enemies.map((enemy) => enemy.configId)])
            )
          }
        };
        persistSave(nextSave);
      }

      set({
        save: nextSave,
        pendingReward,
        weaponsPhaseLocked: false,
        battleResult: enemies.length ? null : "victory"
      });

      return enemies.length ? { enemies, type: doorType } : null;
    },

    resolveWeaponAttack: (weaponName, ammoToSpend) => {
      const { save, configs } = get();
      if (!save || !configs) return;
      if (!save.battleState.active || !save.battleState.door) return;
      if (save.battleState.weaponsLocked) return;

      const weaponConfig = configs.weapons.find((weapon) => weapon.name === weaponName);
      if (!weaponConfig) return;
      const ammoKind = getWeaponAmmoKind(weaponName);
      const availableAmmo = save.inventory.ammo[ammoKind];
      const spend = Math.max(0, Math.min(ammoToSpend, availableAmmo, weaponConfig.maxAmmo));
      if (spend <= 0) return;

      const currentEnemy = save.battleState.door.enemies[save.battleState.door.index];
      const result = simulateWeaponAttack(
        currentEnemy,
        { damagePerShot: weaponConfig.damagePerShot },
        spend
      );

      const updatedEnemy: EnemyInstance = {
        ...currentEnemy,
        life: result.enemyLifeLeft
      };

      const updatedEnemies = [...save.battleState.door.enemies];
      updatedEnemies[save.battleState.door.index] = updatedEnemy;

      const inventory = {
        ...save.inventory,
        ammo: {
          ...save.inventory.ammo,
          [ammoKind]: availableAmmo - result.ammoSpent
        }
      };

      let weaponsLocked: boolean = save.battleState.weaponsLocked;
      let battleResult: GameStoreState["battleResult"] = null;
      let newBattleState = save.battleState;
      let nextSave = save;

      if (result.defeated) {
        const nextIndex = save.battleState.door.index + 1;
        if (nextIndex >= updatedEnemies.length) {
          // Victory
          const doorType = save.battleState.door.type;
          const lootRng = randomForDoor(save, doorType, 17);
          const loot = rollLoot(doorType, configs.lootTables, lootRng);
          let inventoryAfterLoot = { ...inventory };
          if (loot) {
            if (loot.type in inventoryAfterLoot.ammo) {
              const ammoType = loot.type as AmmoKind;
              inventoryAfterLoot.ammo[ammoType] += loot.qty;
            } else if (loot.type === "coins") {
              inventoryAfterLoot.coins += loot.qty;
            } else if (loot.type === "food") {
              inventoryAfterLoot.food += loot.qty;
            }
          }

          const decremented = decrementBlocks(save.progress.blockedDoors);
          const conflictsRng = randomForDoor(save, doorType, 23);
          const blocked = applyConflicts(doorType, decremented, conflictsRng);
          const available = computeAvailable(ALL_DOOR_TYPES, blocked);
          const { objects, triggers } = tickHouseBonuses(save.house.objects);

          nextSave = applyHouseRewards(
            {
              ...save,
              inventory: inventoryAfterLoot,
              progress: {
                doorsOpened: save.progress.doorsOpened + 1,
                turn: save.progress.turn + 1,
                blockedDoors: blocked,
                availablePool: available,
                lastLobbyDraw: []
              },
              house: {
                objects
              },
              battleState: defaultBattleState,
              doorHistory: ensureDoorHistoryLimit([
                ...save.doorHistory,
                {
                  type: doorType,
                  result: "victory",
                  loot,
                  timestamp: new Date().toISOString()
                }
              ])
            },
            triggers
          );

          weaponsLocked = false;
          battleResult = "victory";
        } else {
          newBattleState = {
            ...save.battleState,
            door: {
              ...save.battleState.door,
              enemies: updatedEnemies,
              index: nextIndex
            },
            usedWeapons: [
              ...save.battleState.usedWeapons,
              { name: weaponName, shots: result.ammoSpent }
            ]
          };
        }
      } else {
        weaponsLocked = true;
        newBattleState = {
          ...save.battleState,
          door: {
            ...save.battleState.door,
            enemies: updatedEnemies
          },
          usedWeapons: [
            ...save.battleState.usedWeapons,
            { name: weaponName, shots: result.ammoSpent }
          ],
          weaponsLocked: true
        };
        nextSave = {
          ...save,
          inventory
        };
      }

      if (nextSave === save) {
        nextSave = {
          ...save,
          inventory,
          battleState: newBattleState
        };
      } else {
        nextSave = {
          ...nextSave,
          battleState: battleResult ? defaultBattleState : newBattleState
        };
      }

      persistSave(nextSave);
      set({
        save: nextSave,
        weaponsPhaseLocked: weaponsLocked,
        battleResult
      });
    },

    resolveAnimalDuel: (animalIndex) => {
      const { save, configs } = get();
      if (!save || !configs) return;
      if (!save.battleState.active || !save.battleState.door) return;

      const instance = save.animals.owned[animalIndex];
      if (!instance || !instance.alive) return;

      const animalConfig = configs.animals.find((entry) => entry.id === instance.configId);
      if (!animalConfig) return;

      const staminaCap = getStaminaCap(animalConfig, instance.size);
      if (instance.stamina < staminaCap) {
        return;
      }

      const enemy = save.battleState.door.enemies[save.battleState.door.index];
      const stats = computeBattleStats(animalConfig, instance);
      const duel = simulateAnimalDuel(
        {
          life: stats.life,
          damage: stats.damage,
          attackSpeed: stats.attackSpeed,
          armor: instance.armor
        },
        enemy
      );

      const updatedAnimals = [...save.animals.owned];
      updatedAnimals[animalIndex] = {
        ...instance,
        life: Math.min(stats.lifeCap, duel.playerLifeLeft),
        alive: duel.playerLifeLeft > 0,
        stamina: 0
      };

      const updatedEnemies = [...save.battleState.door.enemies];
      updatedEnemies[save.battleState.door.index] = {
        ...enemy,
        life: duel.enemyLifeLeft
      };

      const playerFell = duel.playerLifeLeft <= 0;
      const fallenAnimals = playerFell
        ? [...save.battleState.fallenAnimals, { configId: instance.configId }]
        : save.battleState.fallenAnimals;

      let nextSave = save;
      let battleResult: GameStoreState["battleResult"] = null;
      let pendingReward: PendingReward | null = null;
      let nextBattleState = save.battleState;

      if (duel.enemyLifeLeft <= 0) {
        const nextIndex = save.battleState.door.index + 1;
        if (nextIndex >= updatedEnemies.length) {
          const doorType = save.battleState.door.type;
          const lootRng = randomForDoor(save, doorType, 29);
          const rawLoot = rollLoot(doorType, configs.lootTables, lootRng);
          const inventory = { ...save.inventory, ammo: { ...save.inventory.ammo } };
          let effectiveLoot = rawLoot;
          let medalUnlocked: DoorType | null = null;
          let medalsState = {
            ...save.medals,
            entries: { ...save.medals.entries }
          };

          if (rawLoot && isMedalResource(rawLoot.type)) {
            const medalDoor = medalResourceToDoorType(rawLoot.type as MedalResource);
            const currentMedal = medalsState.entries[medalDoor];
            if (!currentMedal.unlocked) {
              const unlockedAt = new Date().toISOString();
              medalsState = {
                ...medalsState,
                entries: {
                  ...medalsState.entries,
                  [medalDoor]: {
                    unlocked: true,
                    unlockedAt,
                    highlightUntil: unlockedAt
                  }
                },
                highlighted: medalDoor
              };
              medalUnlocked = medalDoor;
            } else {
              effectiveLoot = null;
            }
          } else if (rawLoot) {
            if (rawLoot.type in inventory.ammo) {
              const ammoKind = rawLoot.type as AmmoKind;
              inventory.ammo[ammoKind] += rawLoot.qty;
            } else if (rawLoot.type === "coins") {
              inventory.coins += rawLoot.qty;
            } else if (rawLoot.type === "food") {
              inventory.food += rawLoot.qty;
            }
          }

          const decremented = decrementBlocks(save.progress.blockedDoors);
          const conflictsRng = randomForDoor(save, doorType, 31);
          const blocked = applyConflicts(doorType, decremented, conflictsRng);
          const available = computeAvailable(ALL_DOOR_TYPES, blocked);
          const { objects, triggers } = tickHouseBonuses(save.house.objects);

          const regeneratedAnimals = regenerateAnimalStamina(updatedAnimals, configs.animals, 5);
          const baseSave: SaveGame = {
            ...save,
            inventory,
            animals: {
              ...save.animals,
              owned: regeneratedAnimals
            },
            progress: {
              doorsOpened: save.progress.doorsOpened + 1,
              turn: save.progress.turn + 1,
              blockedDoors: blocked,
              availablePool: available,
              lastLobbyDraw: []
            },
            house: {
              objects
            },
            battleState: defaultBattleState,
            doorHistory: ensureDoorHistoryLimit([
              ...save.doorHistory,
              {
                type: doorType,
                result: "victory",
                loot: effectiveLoot,
                timestamp: new Date().toISOString()
              }
            ]),
            medals: medalsState
          };

          nextSave = applyHouseRewards(baseSave, triggers);

          pendingReward = {
            doorType,
            loot: effectiveLoot,
            weaponsUsed: save.battleState.usedWeapons,
            fallenAnimals,
            medalUnlocked
          };
          battleResult = "victory";
        } else {
          nextBattleState = {
            ...save.battleState,
            door: {
              ...save.battleState.door,
              enemies: updatedEnemies,
              index: nextIndex
            },
            fallenAnimals
          };

          nextSave = {
            ...save,
            animals: {
              ...save.animals,
              owned: updatedAnimals
            },
            battleState: nextBattleState
          };
        }
      } else {
        const aliveAnimals = updatedAnimals.filter((animal) => animal.alive);
        const ammoAvailable = Object.values(save.inventory.ammo).some((qty) => qty > 0);

        if (!aliveAnimals.length && !ammoAvailable) {
          const regeneratedAnimals = regenerateAnimalStamina(updatedAnimals, configs.animals, 5);
          nextSave = {
            ...save,
            animals: {
              ...save.animals,
              owned: regeneratedAnimals
            },
            battleState: defaultBattleState,
            doorHistory: ensureDoorHistoryLimit([
              ...save.doorHistory,
              {
                type: save.battleState.door.type,
                result: "defeat",
                timestamp: new Date().toISOString()
              }
            ])
          };
          battleResult = "defeat";
        } else {
          nextBattleState = {
            ...save.battleState,
            door: {
              ...save.battleState.door,
              enemies: updatedEnemies
            },
            fallenAnimals
          };

          nextSave = {
            ...save,
            animals: {
              ...save.animals,
              owned: updatedAnimals
            },
            battleState: nextBattleState
          };
        }
      }

      persistSave(nextSave);
      set({
        save: nextSave,
        battleResult,
        pendingReward: pendingReward ?? get().pendingReward
      });
    },

    feedAnimal: (animalIndex) => {
      const { save, configs } = get();
      if (!save || !configs) return;
      const instance = save.animals.owned[animalIndex];
      if (!instance || !instance.alive) return;

      const config = configs.animals.find((entry) => entry.id === instance.configId);
      if (!config) return;

      const staminaCap = getStaminaCap(config, instance.size);
      const missing = Math.max(0, staminaCap - instance.stamina);
      if (missing <= 0) return;

      const availableFood = save.inventory.food;
      if (availableFood <= 0) return;

      const toSpend = Math.min(missing, availableFood);
      if (toSpend <= 0) return;

      const animals = [...save.animals.owned];
      animals[animalIndex] = {
        ...instance,
        stamina: Math.min(staminaCap, instance.stamina + toSpend)
      };

      const nextSave: SaveGame = {
        ...save,
        inventory: {
          ...save.inventory,
          food: availableFood - toSpend
        },
        animals: {
          ...save.animals,
          owned: animals
        }
      };

      persistSave(nextSave);
      set({ save: nextSave });
    },

    growAnimal: (animalIndex) => {
      const { save, configs } = get();
      if (!save || !configs) return;
      const instance = save.animals.owned[animalIndex];
      if (!instance || !instance.alive) return;
      if (instance.size === "Large") return;

      const config = configs.animals.find((entry) => entry.id === instance.configId);
      if (!config) return;

      const cost = Math.max(0, Math.round(config.growthFoodCost));
      if (save.inventory.food < cost) return;

      const grown = applyGrowthToInstance(instance, config);

      const animals = [...save.animals.owned];
      animals[animalIndex] = grown;

      const nextSave: SaveGame = {
        ...save,
        inventory: {
          ...save.inventory,
          food: save.inventory.food - cost
        },
        animals: {
          ...save.animals,
          owned: animals
        }
      };

      persistSave(nextSave);
      set({ save: nextSave });
    },

    openChest: (rarity) => {
      const { save, configs } = get();
      if (!save || !configs) return null;

      const owned = save.chests.inventory[rarity] ?? 0;
      if (owned <= 0) return null;

      const rngSeed = createTurnSeed(save.meta.rngSeed, Date.now());
      const rng = new RNG(rngSeed);
      let loot = rollChestLoot(configs.chests, rarity, rng);

      let medalsState = {
        ...save.medals,
        entries: { ...save.medals.entries }
      };
      let medalUnlocked: DoorType | null = null;

      const inventory = {
        ...save.inventory,
        ammo: { ...save.inventory.ammo },
        armors: [...save.inventory.armors],
        specialItems: [...save.inventory.specialItems]
      };

      if (loot && isMedalResource(loot.type)) {
        const medalDoor = medalResourceToDoorType(loot.type as MedalResource);
        const currentMedal = medalsState.entries[medalDoor];
        if (!currentMedal.unlocked) {
          const unlockedAt = new Date().toISOString();
          medalsState = {
            ...medalsState,
            entries: {
              ...medalsState.entries,
              [medalDoor]: {
                unlocked: true,
                unlockedAt,
                highlightUntil: unlockedAt
              }
            },
            highlighted: medalDoor
          };
          medalUnlocked = medalDoor;
        } else {
          loot = null;
        }
      }

      if (loot) {
        if (loot.type in inventory.ammo) {
          const ammoKind = loot.type as AmmoKind;
          inventory.ammo[ammoKind] += loot.qty;
        } else if (loot.type === "coins") {
          inventory.coins += loot.qty;
        } else if (loot.type === "food") {
          inventory.food += loot.qty;
        } else if (loot.type === "armor") {
          inventory.armors = [
            ...inventory.armors,
            { id: `armor-${Date.now()}`, tier: 1, durability: 100 }
          ];
        } else if (loot.type === "specialItem") {
          inventory.specialItems = [...inventory.specialItems, "Ricompensa Baule"];
        }
      }

      const historyEntry = {
        rarity: getChestDefinition(rarity).name,
        time: new Date().toISOString(),
        loot
      };

      const nextSave: SaveGame = {
        ...save,
        inventory,
        chests: {
          unlockedHistory: [...save.chests.unlockedHistory, historyEntry],
          inventory: {
            ...save.chests.inventory,
            [rarity]: Math.max(owned - 1, 0)
          }
        },
        medals: medalsState
      };

      persistSave(nextSave);
      set({ save: nextSave });
      return { loot, medalUnlocked };
    },

    acknowledgeMedalHighlight: () => {
      const { save } = get();
      if (!save) return;
      if (!save.medals.highlighted) return;

      const nextSave: SaveGame = {
        ...save,
        medals: {
          ...save.medals,
          highlighted: null
        }
      };

      persistSave(nextSave);
      set({ save: nextSave });
    },

    collectReward: () => {
      const { pendingReward } = get();
      if (!pendingReward) return;
      set({
        pendingReward: null,
        battleResult: null
      });
    }
  }))
);
