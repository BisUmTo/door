import { CONFLICTS } from "@/data/conflicts";
import { DoorType, BlockedDoor } from "./types";
import { RNG } from "./rng";

export const ALL_DOOR_TYPES: DoorType[] = [
  "white",
  "black",
  "red",
  "orange",
  "yellow",
  "purple",
  "blue",
  "lightBlue",
  "brown",
  "lime",
  "green",
  "neutral"
];

const ensureRange = (range: [number, number]): [number, number] => {
  const [min, max] = range;
  if (max < min) {
    return [max, min];
  }
  return [min, max];
};

const blockDoor = (
  target: DoorType,
  durationRange: [number, number],
  rng: RNG,
  blocks: Map<DoorType, number>
) => {
  if (target === "neutral") {
    return;
  }
  const [min, max] = ensureRange(durationRange);
  const duration = rng.nextInt(min, max);
  const existing = blocks.get(target);
  if (existing === undefined || duration > existing) {
    blocks.set(target, duration);
  }
};

export const applyConflicts = (
  opened: DoorType,
  blocked: BlockedDoor[],
  rng: RNG
): BlockedDoor[] => {
  const blocks = new Map<DoorType, number>(
    blocked.map(({ type, turnsLeft }) => [type, Math.max(turnsLeft, 0)])
  );

  const rules = CONFLICTS[opened] ?? [];
  const alreadySelected = new Set<DoorType>();

  for (const rule of rules) {
    if (rule.type === "*") {
      const eligible = ALL_DOOR_TYPES.filter(
        (door) =>
          door !== opened &&
          door !== "neutral" &&
          !alreadySelected.has(door)
      );
      const count = Math.min(rule.count ?? 0, eligible.length);
      for (let i = 0; i < count; i += 1) {
        const choice = rng.pickOne(eligible);
        alreadySelected.add(choice);
        eligible.splice(eligible.indexOf(choice), 1);
        blockDoor(choice, rule.durationRange, rng, blocks);
      }
    } else {
      alreadySelected.add(rule.type);
      blockDoor(rule.type, rule.durationRange, rng, blocks);
    }
  }

  blocks.delete("neutral");

  return Array.from(blocks.entries()).map(([type, turnsLeft]) => ({
    type,
    turnsLeft
  }));
};

export const decrementBlocks = (blocked: BlockedDoor[]): BlockedDoor[] =>
  blocked
    .map(({ type, turnsLeft }) => ({ type, turnsLeft: turnsLeft - 1 }))
    .filter((entry) => entry.turnsLeft > 0);

export const computeAvailable = (
  pool: DoorType[],
  blocked: BlockedDoor[]
): DoorType[] => {
  const blockedSet = new Set(blocked.map((entry) => entry.type));
  return pool.filter((door) => door === "neutral" || !blockedSet.has(door));
};
