import { DoorType } from "@/game/types";

export type ConflictRule =
  | { type: DoorType; count?: undefined; durationRange: [number, number] }
  | { type: "*"; count: number; durationRange: [number, number] };

export const CONFLICTS: Record<DoorType, ConflictRule[]> = {
  white: [{ type: "yellow", durationRange: [1, 2] }],
  black: [
    { type: "orange", durationRange: [3, 5] },
    { type: "*", count: 2, durationRange: [3, 5] }
  ],
  red: [
    { type: "blue", durationRange: [2, 4] },
    { type: "lime", durationRange: [2, 4] }
  ],
  orange: [
    { type: "lime", durationRange: [3, 5] },
    { type: "green", durationRange: [3, 5] }
  ],
  yellow: [
    { type: "white", durationRange: [1, 3] },
    { type: "yellow", durationRange: [1, 1] }
  ],
  purple: [
    { type: "green", durationRange: [2, 3] },
    { type: "brown", durationRange: [2, 3] }
  ],
  blue: [
    { type: "red", durationRange: [3, 4] },
    { type: "orange", durationRange: [3, 4] }
  ],
  lightBlue: [{ type: "green", durationRange: [2, 3] }],
  brown: [
    { type: "orange", durationRange: [3, 4] },
    { type: "lime", durationRange: [3, 4] }
  ],
  lime: [
    { type: "red", durationRange: [2, 4] },
    { type: "blue", durationRange: [2, 4] },
    { type: "lightBlue", durationRange: [2, 4] }
  ],
  green: [
    { type: "lightBlue", durationRange: [2, 3] },
    { type: "red", durationRange: [2, 3] }
  ],
  neutral: [{ type: "black", durationRange: [1, 1] }]
};
