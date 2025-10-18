import type { BlockedDoor, DoorType } from "@/game/types";

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
    <aside className="rounded-xl bg-black/60 p-4 text-sm text-white backdrop-blur">
      <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-white/10">
        <span className="font-semibold uppercase tracking-wide">Progressi</span>
        <span>Turno {turn}</span>
      </div>
      <dl className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <dt>Porte aperte</dt>
          <dd className="font-semibold text-accent">{doorsOpened}</dd>
        </div>
        <div>
          <dt className="uppercase text-xs text-white/60">Conflitti attivi</dt>
          {blockedDoors.length === 0 ? (
            <p className="text-white/70">Nessuna porta bloccata.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {blockedDoors.map((door) => (
                <li
                  key={`${door.type}-${door.turnsLeft}`}
                  className="flex items-center justify-between rounded bg-white/10 px-2 py-1 text-xs"
                >
                  <span>{doorShortLabel[door.type]}</span>
                  <span>{door.turnsLeft} turni</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dl>
    </aside>
  );
};

export default InfoPanel;
