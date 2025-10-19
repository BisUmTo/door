import { ALL_DOOR_TYPES } from "@/game/pool";
import {
  AmmoKind,
  ChestRarity,
  DoorType,
  MedalStatus,
  SaveGame,
  WeaponState
} from "@/game/types";
import { CURRENT_VERSION, STORAGE_KEYS, buildSaveKey } from "./keys";

export interface SaveSlotMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavesExportPayload {
  version: string;
  generatedAt: string;
  activeSlotId: string | null;
  slots: SaveSlotMeta[];
  saves: Record<string, SaveGame | null>;
}

interface SlotsPayload {
  slots: SaveSlotMeta[];
}

const readJSON = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const listSlots = (): SaveSlotMeta[] => {
  const payload = readJSON<SlotsPayload>(STORAGE_KEYS.slots, { slots: [] });
  return payload.slots;
};

export const saveSlots = (slots: SaveSlotMeta[]) => {
  writeJSON(STORAGE_KEYS.slots, { slots });
};

export const getActiveSlot = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.activeSlot);
};

export const setActiveSlot = (slotId: string) => {
  localStorage.setItem(STORAGE_KEYS.activeSlot, slotId);
};

const defaultAmmoState = (): Record<AmmoKind, number> => ({
  bullets: 0,
  shells: 0,
  arrows: 0,
  darts: 8, // Provide starting darts so the blowgun can be used immediately
  grenades: 0
});

const CHEST_RARITIES: ChestRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

const defaultChestInventory = (): Record<ChestRarity, number> => {
  return CHEST_RARITIES.reduce<Record<ChestRarity, number>>((acc, rarity) => {
    acc[rarity] = 0;
    return acc;
  }, {} as Record<ChestRarity, number>);
};

const defaultMedalEntries = (): Record<DoorType, MedalStatus> => {
  return ALL_DOOR_TYPES.reduce<Record<DoorType, MedalStatus>>((acc, type) => {
    acc[type] = {
      unlocked: false,
      unlockedAt: null,
      highlightUntil: null
    };
    return acc;
  }, {} as Record<DoorType, MedalStatus>);
};

const nowIso = () => new Date().toISOString();

export const createSaveTemplate = (
  slotId: string,
  weapons: WeaponState[],
  houseObjects: SaveGame["house"]["objects"]
): SaveGame => {
  const timestamp = nowIso();
  return {
    meta: {
      slotId,
      createdAt: timestamp,
      updatedAt: timestamp,
      gameVersion: CURRENT_VERSION,
      rngSeed: Math.floor(Math.random() * 0xffffffff)
    },
    progress: {
      doorsOpened: 0,
      blockedDoors: [],
      availablePool: ALL_DOOR_TYPES,
      lastLobbyDraw: [],
      turn: 0
    },
    inventory: {
      coins: 0,
      food: 0,
      ammo: defaultAmmoState(),
      armors: [],
      specialItems: []
    },
    weapons,
    animals: {
      owned: [],
      bestiarySeen: []
    },
    house: {
      objects: houseObjects
    },
    chests: {
      unlockedHistory: [],
      inventory: defaultChestInventory()
    },
    doorHistory: [],
    battleState: {
      active: false,
      door: null,
      usedWeapons: [],
      fallenAnimals: [],
      weaponsLocked: false
    },
    medals: {
      entries: defaultMedalEntries(),
      dropRate: 0.002,
      highlighted: null
    }
  };
};

export const loadSave = (slotId: string): SaveGame | null => {
  const raw = localStorage.getItem(buildSaveKey(slotId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaveGame;
  } catch (error) {
    console.error("Invalid save data", error);
    return null;
  }
};

export const persistSave = (save: SaveGame) => {
  const timestamp = nowIso();
  const updated: SaveGame = {
    ...save,
    meta: {
      ...save.meta,
      updatedAt: timestamp,
      gameVersion: CURRENT_VERSION
    }
  };

  localStorage.setItem(buildSaveKey(save.meta.slotId), JSON.stringify(updated));

  const slots = listSlots();
  const nextSlots = slots.map((slot) =>
    slot.id === save.meta.slotId ? { ...slot, updatedAt: timestamp } : slot
  );
  saveSlots(nextSlots);
};

export const deleteSlot = (slotId: string) => {
  localStorage.removeItem(buildSaveKey(slotId));
  const slots = listSlots().filter((slot) => slot.id !== slotId);
  saveSlots(slots);
  const active = getActiveSlot();
  if (active === slotId) {
    localStorage.removeItem(STORAGE_KEYS.activeSlot);
  }
};

export const renameSlot = (slotId: string, name: string) => {
  const slots = listSlots().map((slot) =>
    slot.id === slotId ? { ...slot, name } : slot
  );
  saveSlots(slots);
};

export const ensureVersion = () => {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.version);
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEYS.version, CURRENT_VERSION);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isSaveSlotMeta = (value: unknown): value is SaveSlotMeta => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
};

const normalizeSavesMap = (
  slots: SaveSlotMeta[],
  value: unknown
): Record<string, SaveGame | null> => {
  if (!isRecord(value)) {
    throw new Error("Invalid saves map");
  }
  const result: Record<string, SaveGame | null> = {};
  for (const slot of slots) {
    const entry = value[slot.id];
    if (entry === undefined || entry === null) {
      result[slot.id] = null;
      continue;
    }
    if (!isRecord(entry)) {
      throw new Error(`Invalid save payload for slot ${slot.id}`);
    }
    if (!isRecord(entry.meta) || entry.meta.slotId !== slot.id) {
      throw new Error(`Mismatched slot id for save ${slot.id}`);
    }
    result[slot.id] = entry as SaveGame;
  }
  return result;
};

export const buildSavesExport = (): SavesExportPayload => {
  const slots = listSlots();
  const activeSlotId = getActiveSlot();
  const saves = slots.reduce<Record<string, SaveGame | null>>((acc, slot) => {
    acc[slot.id] = loadSave(slot.id);
    return acc;
  }, {});

  return {
    version: CURRENT_VERSION,
    generatedAt: nowIso(),
    activeSlotId,
    slots,
    saves
  };
};

export const parseSavesExportJson = (json: string): SavesExportPayload => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON");
  }
  if (!isRecord(parsed)) {
    throw new Error("Invalid export payload");
  }

  const slotsRaw = parsed.slots;
  if (!Array.isArray(slotsRaw)) {
    throw new Error("Slots list missing");
  }
  const slots = slotsRaw.map((slot) => {
    if (!isSaveSlotMeta(slot)) {
      throw new Error("Invalid slot metadata");
    }
    return slot;
  });
  const seenSlotIds = new Set<string>();
  for (const slot of slots) {
    if (seenSlotIds.has(slot.id)) {
      throw new Error(`Duplicate slot id "${slot.id}" in export`);
    }
    seenSlotIds.add(slot.id);
  }

  const saves = normalizeSavesMap(slots, parsed.saves);

  const activeSlotId =
    typeof parsed.activeSlotId === "string" && slots.some((slot) => slot.id === parsed.activeSlotId)
      ? parsed.activeSlotId
      : null;

  const version = typeof parsed.version === "string" && parsed.version.trim()
    ? parsed.version
    : CURRENT_VERSION;

  const generatedAt =
    typeof parsed.generatedAt === "string" && parsed.generatedAt.trim()
      ? parsed.generatedAt
      : nowIso();

  return {
    version,
    generatedAt,
    activeSlotId,
    slots,
    saves
  };
};

export const importSavesSnapshot = (payload: SavesExportPayload) => {
  const existingSlots = listSlots();
  for (const slot of existingSlots) {
    localStorage.removeItem(buildSaveKey(slot.id));
  }

  saveSlots(payload.slots);

  for (const slot of payload.slots) {
    const data = payload.saves[slot.id];
    if (data) {
      localStorage.setItem(buildSaveKey(slot.id), JSON.stringify(data));
    } else {
      localStorage.removeItem(buildSaveKey(slot.id));
    }
  }

  if (payload.activeSlotId && payload.slots.some((slot) => slot.id === payload.activeSlotId)) {
    setActiveSlot(payload.activeSlotId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeSlot);
  }

  const version = payload.version.trim() ? payload.version : CURRENT_VERSION;
  localStorage.setItem(STORAGE_KEYS.version, version);
};
