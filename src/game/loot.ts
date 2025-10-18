import { normalizeLootKey } from "@/data/normalize";
import { RNG } from "./rng";
import { DoorLootTable, DoorType, LootEntry, LootTableEntryRaw, Resource } from "./types";

export type DoorLootTablesRegistry = Record<DoorType, LootTableEntryRaw[]>;

const parseQuantity = (input: string | undefined, rng: RNG): number => {
  if (!input) return 1;
  const trimmed = input.trim();
  if (trimmed.includes("-")) {
    const [low, high] = trimmed.split("-").map((segment) => Number(segment));
    if (!Number.isFinite(low) || !Number.isFinite(high)) {
      return 1;
    }
    const min = Math.min(low, high);
    const max = Math.max(low, high);
    return rng.nextInt(min, max);
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 1;
};

const toLootEntry = (raw: LootTableEntryRaw, rng: RNG): LootEntry | null => {
  if (!raw.loot) {
    return null;
  }

  const resource = normalizeLootKey(raw.loot);
  if (resource === "none") {
    return null;
  }

  return {
    type: resource,
    qty: parseQuantity(raw.quantita, rng)
  };
};

export const normalizeDoorLootTableRecords = (
  tables: DoorLootTable[]
): DoorLootTablesRegistry => {
  return tables.reduce<Record<DoorType, LootTableEntryRaw[]>>((acc, entry) => {
    acc[entry.type] = entry.rewards;
    return acc;
  }, {} as Record<DoorType, LootTableEntryRaw[]>);
};

const computeTotalWeight = (entries: LootTableEntryRaw[]) =>
  entries.reduce((sum, entry) => sum + (entry.peso ?? 0), 0);

const selectEntry = (
  entries: LootTableEntryRaw[],
  rng: RNG
): LootTableEntryRaw | null => {
  const totalWeight = computeTotalWeight(entries);
  if (totalWeight <= 0) {
    return null;
  }

  const roll = rng.nextFloat() * totalWeight;
  let cumulative = 0;

  for (const entry of entries) {
    cumulative += entry.peso ?? 0;
    if (roll <= cumulative) {
      return entry;
    }
  }

  return entries.at(-1) ?? null;
};

export const rollLoot = (
  doorType: DoorType,
  tables: DoorLootTablesRegistry,
  rng: RNG
): LootEntry | null => {
  const entries = tables[doorType];
  if (!entries || entries.length === 0) {
    return null;
  }

  const selected = selectEntry(entries, rng);
  if (!selected) {
    return null;
  }

  return toLootEntry(selected, rng);
};

export const addLootToInventory = (
  current: Record<Resource, number>,
  loot: LootEntry | null
): Record<Resource, number> => {
  if (!loot) return current;
  const next = { ...current };
  next[loot.type] = (next[loot.type] ?? 0) + loot.qty;
  return next;
};
