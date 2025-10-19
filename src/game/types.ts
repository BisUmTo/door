export type DoorType =
  | "white"
  | "black"
  | "red"
  | "orange"
  | "yellow"
  | "purple"
  | "blue"
  | "lightBlue"
  | "brown"
  | "lime"
  | "green"
  | "neutral";

export type AmmoKind = "bullets" | "shells" | "arrows" | "darts" | "grenades";

export type MedalResource = `medal_${DoorType}`;

export type FurniturePieceResource = "housePiece:any" | `housePiece:${number}`;

export type Resource =
  | "coins"
  | "food"
  | "armor"
  | AmmoKind
  | "specialItem"
  | MedalResource
  | FurniturePieceResource
  | "none";

export type ChestRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface MedalStatus {
  unlocked: boolean;
  unlockedAt: string | null;
  highlightUntil?: string | null;
}

export type WeaponName =
  | "shotgun"
  | "blowgun"
  | "grenadeLauncher"
  | "simpleBow"
  | "pistol";

export interface AnimalConfig {
  id: number;
  kind: string;
  life: number;
  damage: number;
  attackSpeed: number;
  size: "Smmlll" | "Large";
  staminaMax: number;
  upgradableArmor: boolean;
  growthFoodCost: number;
}

export interface AnimalInstance {
  configId: number;
  life: number;
  stamina: number;
  size: "Smmlll" | "Large";
  armor: number | null;
  alive: boolean;
}

export interface WeaponConfig {
  name: WeaponName;
  displayName: string;
  ammoType: AmmoKind;
  damagePerShot: number;
  maxAmmo: number;
}

export interface WeaponState {
  name: WeaponName;
  ammo: number;
  unlocked: boolean;
}

export interface LootEntry {
  type: Resource;
  qty: number;
}

export interface BlockedDoor {
  type: DoorType;
  turnsLeft: number;
}

export interface EnemyInstance {
  configId: number;
  life: number;
  damage: number;
  attackSpeed: number;
  size: "Smmlll" | "Large";
}

export interface SaveGame {
  meta: {
    slotId: string;
    createdAt: string;
    updatedAt: string;
    gameVersion: string;
    rngSeed: number;
  };
  progress: {
    doorsOpened: number;
    blockedDoors: BlockedDoor[];
    availablePool: DoorType[];
    lastLobbyDraw: DoorType[];
    turn: number;
  };
  inventory: {
    coins: number;
    food: number;
    ammo: Record<AmmoKind, number>;
    armors: { id: string; tier: number; durability: number }[];
    specialItems: string[];
  };
  weapons: WeaponState[];
  animals: {
    owned: AnimalInstance[];
    bestiarySeen: number[];
  };
  house: {
    objects: {
      id: number;
      name: string;
      piecesNeeded: number;
      piecesOwned: number;
      unlocked: boolean;
      bonus: {
        type: "Coins" | "Food" | "Ammo" | "Mixed" | "Monete" | "Cibo" | "Munizioni";
        amount: number | number[];
        turnsCooldown: number;
      };
      turnsToNextBonus: number | null;
    }[];
  };
  chests: {
    unlockedHistory: {
      rarity: string;
      time: string;
      loot: LootEntry | null;
    }[];
    inventory: Record<ChestRarity, number>;
  };
  doorHistory: {
    type: DoorType;
    result: "victory" | "defeat" | "reward";
    loot?: LootEntry | null;
    timestamp: string;
  }[];
  battleState: {
    active: boolean;
    door: null | {
      type: DoorType;
      enemies: EnemyInstance[];
      index: number;
    };
    usedWeapons: { name: WeaponName; shots: number }[];
    fallenAnimals: { configId: number }[];
    weaponsLocked: boolean;
  };
  medals: {
    entries: Record<DoorType, MedalStatus>;
    dropRate: number;
    highlighted: DoorType | null;
  };
}

export interface LootTableEntryRaw {
  loot: string | null;
  peso: number;
  quantita?: string;
}

export interface DoorLootTableRaw {
  porta: string;
  ricompense: LootTableEntryRaw[];
}

export interface DoorLootTable {
  type: DoorType;
  rewards: LootTableEntryRaw[];
}
