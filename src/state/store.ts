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
  WeaponState
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
  getWeaponAmmoKind
} from "@/data/normalize";
import { normalizeDoorLootTableRecords, rollLoot } from "@/game/loot";
import { ALL_DOOR_TYPES, applyConflicts, computeAvailable, decrementBlocks } from "@/game/pool";
import { RNG, createTurnSeed } from "@/game/rng";
import { tickHouseBonuses } from "@/game/house";
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
  loadSlot: (slotId: string) => Promise<void>;
  renameSlot: (slotId: string, name: string) => void;
  deleteSlot: (slotId: string) => void;
  drawLobbyDoors: () => DoorType[];
  openDoor: (doorType: DoorType) => DoorEncounter | null;
  resolveWeaponAttack: (weapon: WeaponName, ammoToSpend: number) => void;
  resolveAnimalDuel: (animalIndex: number) => void;
  collectReward: () => void;
  setOnlineStatus: (status: OnlineStatus) => void;
  resetBattleResult: () => void;
}

const defaultBattleState: SaveGame["battleState"] = {
  active: false,
  door: null,
  usedWeapons: [],
  fallenAnimals: [],
  weaponsLocked: false
};

const ammoOrder: AmmoKind[] = ["bullets", "shells", "arrows", "darts", "grenades"];

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
      amount: item.bonus["quantità"],
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
    progress: {
      ...save.progress,
      availablePool: computeAvailable(
        save.progress.availablePool.length ? save.progress.availablePool : ALL_DOOR_TYPES,
        save.progress.blockedDoors
      )
    },
    battleState: save.battleState ?? defaultBattleState
  };
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
          house: buildHouseBlueprints(houseConfig)
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

      let weaponsLocked = save.battleState.weaponsLocked;
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

      const enemy = save.battleState.door.enemies[save.battleState.door.index];
      const duel = simulateAnimalDuel(
        {
          life: instance.life,
          damage: animalConfig.damage,
          attackSpeed: animalConfig.attackSpeed,
          armor: instance.armor
        },
        enemy
      );

      const updatedAnimals = [...save.animals.owned];
      updatedAnimals[animalIndex] = {
        ...instance,
        life: duel.playerLifeLeft,
        alive: duel.playerLifeLeft > 0
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
          const loot = rollLoot(doorType, configs.lootTables, lootRng);
          const inventory = { ...save.inventory, ammo: { ...save.inventory.ammo } };
          if (loot) {
            if (loot.type in inventory.ammo) {
              const ammoKind = loot.type as AmmoKind;
              inventory.ammo[ammoKind] += loot.qty;
            } else if (loot.type === "coins") {
              inventory.coins += loot.qty;
            } else if (loot.type === "food") {
              inventory.food += loot.qty;
            }
          }

          const decremented = decrementBlocks(save.progress.blockedDoors);
          const conflictsRng = randomForDoor(save, doorType, 31);
          const blocked = applyConflicts(doorType, decremented, conflictsRng);
          const available = computeAvailable(ALL_DOOR_TYPES, blocked);
          const { objects, triggers } = tickHouseBonuses(save.house.objects);

          nextSave = applyHouseRewards(
            {
              ...save,
              inventory,
              animals: {
                ...save.animals,
                owned: updatedAnimals
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
            weaponsUsed: save.battleState.usedWeapons,
            fallenAnimals
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
          nextSave = {
            ...save,
            animals: {
              ...save.animals,
              owned: updatedAnimals
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
