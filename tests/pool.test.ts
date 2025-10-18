import { describe, expect, it } from "vitest";
import { computeAvailable, ALL_DOOR_TYPES } from "@/game/pool";
import type { BlockedDoor } from "@/game/types";

describe("computeAvailable", () => {
  it("never removes neutral door", () => {
    const blocked: BlockedDoor[] = [
      { type: "neutral", turnsLeft: 3 },
      { type: "red", turnsLeft: 2 }
    ];
    const available = computeAvailable(ALL_DOOR_TYPES, blocked);
    expect(available).toContain("neutral");
    expect(available).not.toContain("red");
  });
});
