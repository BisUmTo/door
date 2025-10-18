import { SaveGame } from "./types";

export interface HouseBonusTrigger {
  objectId: number;
  bonus:
    SaveGame["house"]["objects"][number]["bonus"];
}

export interface HouseTickResult {
  objects: SaveGame["house"]["objects"];
  triggers: HouseBonusTrigger[];
}

export const tickHouseBonuses = (
  objects: SaveGame["house"]["objects"]
): HouseTickResult => {
  const updated: SaveGame["house"]["objects"] = [];
  const triggers: HouseBonusTrigger[] = [];

  for (const object of objects) {
    const current = { ...object };
    if (current.turnsToNextBonus === null) {
      updated.push(current);
      continue;
    }

    const nextTurns = current.turnsToNextBonus - 1;
    if (nextTurns <= 0) {
      triggers.push({ objectId: current.id, bonus: current.bonus });
      current.turnsToNextBonus =
        current.bonus.turnsCooldown > 0 ? current.bonus.turnsCooldown : null;
    } else {
      current.turnsToNextBonus = nextTurns;
    }

    updated.push(current);
  }

  return { objects: updated, triggers };
};
