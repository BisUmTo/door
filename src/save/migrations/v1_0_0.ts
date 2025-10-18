import { SaveGame } from "@/game/types";

export const migrateToV1_0_0 = (save: SaveGame): SaveGame => {
  return {
    ...save,
    meta: {
      ...save.meta,
      gameVersion: "1.0.0"
    }
  };
};
