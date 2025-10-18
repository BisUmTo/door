export const STORAGE_KEYS = {
  version: "gc:version",
  activeSlot: "gc:activeSlot",
  slots: "gc:slots",
  savePrefix: "gc:save:",
  settings: "gc:settings",
  migratorLastRun: "gc:migrator:lastRun"
} as const;

export const CURRENT_VERSION = "1.0.0";

export const buildSaveKey = (slotId: string) => `${STORAGE_KEYS.savePrefix}${slotId}`;
