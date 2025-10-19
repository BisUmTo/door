import { Link } from "react-router-dom";
import type { BlockedDoor, DoorType } from "@/game/types";
import { getDoorBadgeStyles } from "@/theme/doorColors";

const doorShortLabel: Record<DoorType, string> = {
  white: "Bianca",
  black: "Nera",
  red: "Rossa",
  orange: "Arancione",
  yellow: "Gialla",
  purple: "Viola",
  blue: "Blu",
  lightBlue: "Azzurra",
  brown: "Marrone",
  lime: "Lime",
  green: "Verde",
  neutral: "Neutra"
};

interface InfoPanelProps {
  doorsOpened: number;
  turn: number;
  blockedDoors: BlockedDoor[];
}

export const InfoPanel = ({ doorsOpened, turn, blockedDoors }: InfoPanelProps) => {
  return (
    <aside className="w-60 rounded-lg bg-black/50 p-3 text-xs text-white backdrop-blur-sm shadow-lg">
      {/* Titolo */}
      <div className="flex items-baseline justify-between gap-3 pb-1 border-b border-white/10">
        <span className="font-semibold uppercase tracking-wider text-[11px]">Progressi</span>
        <span className="text-[11px] text-white/70">Turno {turn}</span>
      </div>

      {/* Dati */}
      <dl className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <dt className="text-[11px]">Porte aperte</dt>
          <dd className="font-semibold text-[#a67c52]">{doorsOpened}</dd>
        </div>
        <div>
          <dt className="uppercase text-[10px] text-white/50">In contrasto con le tue scelte:</dt>
          {blockedDoors.length === 0 ? (
            <p className="text-[11px] text-white/60">Nessuna porta in contrasto.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {blockedDoors.map((door) => (
                <li
                  key={`${door.type}-${door.turnsLeft}`}
                  className="flex items-center justify-between rounded border px-2 py-1 text-[10px] uppercase tracking-[0.25em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-105"
                  style={getDoorBadgeStyles(door.type, {
                    backgroundShift: 0.18,
                    borderShift: -0.4,
                    includeShadow: false
                  })}
                >
                  <span>{doorShortLabel[door.type]}</span>
                  <span>{door.turnsLeft} turni</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dl>

      {/* Link finale */}
      <Link
        to="/door-types"
        className="mt-3 inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-[#a67c52] hover:text-[#a67c52]"
      >
        Tipologia porte
      </Link>
    </aside>
  );
};

export default InfoPanel;
