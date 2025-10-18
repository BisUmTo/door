import { SaveGame } from "@/game/types";
import { CURRENT_VERSION, STORAGE_KEYS } from "../keys";
import { migrateToV1_0_0 } from "./v1_0_0";

interface Migration {
  version: string;
  migrate: (save: SaveGame) => SaveGame;
}

const migrations: Migration[] = [
  { version: "1.0.0", migrate: migrateToV1_0_0 }
];

const compareVersion = (a: string, b: string) => {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i += 1) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

export const runMigrations = (save: SaveGame): SaveGame => {
  const applied: SaveGame = migrations
    .filter((migration) => compareVersion(migration.version, save.meta.gameVersion) > 0)
    .reduce((current, migration) => migration.migrate(current), save);

  localStorage.setItem(STORAGE_KEYS.migratorLastRun, CURRENT_VERSION);
  return applied;
};
