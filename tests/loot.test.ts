import { describe, expect, it } from "vitest";
import { rollLoot, normalizeDoorLootTableRecords } from "@/game/loot";
import { RNG } from "@/game/rng";
import type { DoorLootTable } from "@/game/types";

describe("rollLoot", () => {
  const tables: DoorLootTable[] = [
    {
      type: "white",
      rewards: [
        { loot: "monete", peso: 80, quantita: "2-4" },
        { loot: null, peso: 20 }
      ]
    }
  ];
  const registry = normalizeDoorLootTableRecords(tables);

  it("returns loot based on weight", () => {
    const rng = new RNG(1234);
    const loot = rollLoot("white", registry, rng);
    expect(loot).toBeTruthy();
    expect(loot?.type).toBe("coins");
    expect(loot?.qty).toBeGreaterThanOrEqual(2);
  });

  it("handles null loot entries", () => {
    const tableWithNull: DoorLootTable[] = [
      {
        type: "white",
        rewards: [
          { loot: null, peso: 100 }
        ]
      }
    ];
    const registryWithNull = normalizeDoorLootTableRecords(tableWithNull);
    const rng = new RNG(99);
    const loot = rollLoot("white", registryWithNull, rng);
    expect(loot).toBeNull();
  });
});
