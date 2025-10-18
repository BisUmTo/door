import { ALL_DOOR_TYPES } from "@/game/pool";
import { AmmoKind, SaveGame, WeaponState } from "@/game/types";
import { CURRENT_VERSION, STORAGE_KEYS, buildSaveKey } from "./keys";

export interface SaveSlotMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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
  darts: 0,
  grenades: 0
});

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
      unlockedHistory: []
    },
    doorHistory: [],
    battleState: {
      active: false,
      door: null,
      usedWeapons: [],
      fallenAnimals: [],
      weaponsLocked: false
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
