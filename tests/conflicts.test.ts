import { describe, expect, it } from "vitest";
import { applyConflicts, decrementBlocks } from "@/game/pool";
import type { BlockedDoor } from "@/game/types";
import { RNG } from "@/game/rng";

describe("applyConflicts", () => {
  it("applies configured conflicts without duplicates", () => {
    const rng = new RNG(123);
    const blocked = applyConflicts("black", [], rng);
    const types = blocked.map((entry) => entry.type);
    expect(new Set(types).size).toBe(types.length);
    blocked.forEach((entry) => {
      expect(entry.turnsLeft).toBeGreaterThanOrEqual(1);
      expect(entry.turnsLeft).toBeLessThanOrEqual(5);
      expect(entry.type).not.toBe("neutral");
    });
  });

  it("decrements and removes expired blocks", () => {
    const entries: BlockedDoor[] = [
      { type: "red", turnsLeft: 1 },
      { type: "blue", turnsLeft: 2 }
    ];
    const decremented = decrementBlocks(entries);
    expect(decremented).toHaveLength(1);
    expect(decremented[0].type).toBe("blue");
    expect(decremented[0].turnsLeft).toBe(1);
  });
});
