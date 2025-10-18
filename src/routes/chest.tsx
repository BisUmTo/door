import { Link } from "react-router-dom";
import { useGameStore } from "@/state/store";

const ChestRoute = () => {
  const save = useGameStore((state) => state.save);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-background to-black px-6 py-10 text-white">
      <header className="flex items-center justify-between uppercase tracking-[0.4em] text-white/60">
        <span>Baule</span>
        <Link
          to="/lobby"
          className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest hover:border-yellow-400 hover:text-yellow-300"
        >
          Lobby
        </Link>
      </header>

      <section className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-6">
        <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-yellow-200">
          Storia ricompense
        </h2>
        {save?.chests.unlockedHistory.length ? (
          <ul className="mt-4 space-y-3 text-sm">
            {save.chests.unlockedHistory.map((entry, index) => (
              <li
                key={`${entry.time}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-white">{entry.rarity}</p>
                  <p className="text-xs text-white/60">{new Date(entry.time).toLocaleString()}</p>
                </div>
                <span className="text-sm text-yellow-200">
                  {entry.loot ? `+${entry.loot.qty} ${entry.loot.type}` : "Nessun bottino"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-white/70">Nessun baule aperto finora.</p>
        )}
      </section>
    </div>
  );
};

export default ChestRoute;
