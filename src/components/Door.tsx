import clsx from "clsx";
import type { DoorType } from "@/game/types";

const doorColors: Record<DoorType, string> = {
  white: "from-neutral-200 to-white text-neutral-900",
  black: "from-neutral-800 to-black text-white",
  red: "from-red-600 to-red-700 text-white",
  orange: "from-orange-500 to-orange-600 text-white",
  yellow: "from-yellow-400 to-yellow-500 text-neutral-900",
  purple: "from-purple-500 to-purple-600 text-white",
  blue: "from-blue-500 to-blue-600 text-white",
  lightBlue: "from-sky-400 to-sky-500 text-neutral-900",
  brown: "from-amber-800 to-yellow-900 text-white",
  lime: "from-lime-400 to-lime-500 text-neutral-900",
  green: "from-emerald-500 to-emerald-600 text-white",
  neutral: "from-slate-500 to-slate-600 text-white"
};

export const doorLabels: Record<DoorType, string> = {
  white: "Porta Bianca",
  black: "Porta Nera",
  red: "Porta Rossa",
  orange: "Porta Arancione",
  yellow: "Porta Gialla",
  purple: "Porta Viola",
  blue: "Porta Blu",
  lightBlue: "Porta Azzurra",
  brown: "Porta Marrone",
  lime: "Porta Lime",
  green: "Porta Verde",
  neutral: "Porta Neutra"
};

interface DoorProps {
  type: DoorType;
  blockedFor?: number | null;
  onOpen?: () => void;
  disabled?: boolean;
}

export const Door = ({ type, blockedFor, onOpen, disabled }: DoorProps) => {
  const isBlocked = typeof blockedFor === "number" && blockedFor > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled || isBlocked}
      className={clsx(
        "relative flex h-64 w-44 flex-col items-center justify-end rounded-2xl border border-white/20 p-4 transition-transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "bg-gradient-to-b",
        doorColors[type],
        (disabled || isBlocked) && "opacity-60 cursor-not-allowed"
      )}
    >
      <span className="text-lg font-semibold drop-shadow">{doorLabels[type]}</span>
      {isBlocked ? (
        <span className="absolute inset-x-4 top-4 rounded bg-black/70 px-3 py-1 text-sm uppercase tracking-wide text-white">
          Bloccata ({blockedFor})
        </span>
      ) : null}
    </button>
  );
};

export default Door;
