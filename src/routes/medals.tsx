import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MEDAL_DEFINITIONS } from "@/game/medals";
import { doorLabels } from "@/components/Door";
import { useGameStore } from "@/state/store";

const MedalsRoute = () => {
  const { save, acknowledgeMedalHighlight } = useGameStore((state) => ({
    save: state.save,
    acknowledgeMedalHighlight: state.acknowledgeMedalHighlight
  }));

  useEffect(() => {
    if (save?.medals.highlighted) {
      acknowledgeMedalHighlight();
    }
  }, [save?.medals.highlighted, acknowledgeMedalHighlight]);

  const totalMedals = MEDAL_DEFINITIONS.length;
  const unlockedCount = MEDAL_DEFINITIONS.reduce((count, definition) => {
    const status = save?.medals.entries[definition.type];
    return status?.unlocked ? count + 1 : count;
  }, 0);

  const completion = totalMedals > 0 ? Math.round((unlockedCount / totalMedals) * 100) : 0;

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-[#1a120b] via-[#0f0a07] to-black">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 py-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="text-3xl font-display uppercase tracking-[0.4em] text-white/80">
              Bacheca Medagliette
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Colleziona le medagliette aprendo le porte corrispondenti.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <span className="font-semibold text-white">{unlockedCount}</span>
              <span className="text-white/60">/{totalMedals}</span>
              <span className="ml-2 text-white/50">{completion}%</span>
            </div>
            <Link
              to="/house"
              className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:border-[#a67c52] hover:text-[#a67c52]"
            >
              Torna alla casa
            </Link>
          </div>
        </header>

        <section className="mt-10 grid flex-1 gap-6 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MEDAL_DEFINITIONS.map((definition) => {
              const status = save?.medals.entries[definition.type];
              const unlocked = status?.unlocked ?? false;
              return (
                <div
                  key={definition.type}
                  className="group relative flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-black/30 p-6 text-center transition-colors hover:border-[#a67c52]/60 hover:bg-black/40"
                >
                  {/* Medaglia */}
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/10 bg-[#2b2118] shadow-inner transition group-hover:shadow-lg">
                    <div
                      className="h-24 w-24 rounded-full transition-all"
                      style={{
                        background: unlocked
                          ? `radial-gradient(circle at 30% 30%, #ffffff, ${definition.color})`
                          : `radial-gradient(circle at 30% 30%, #4a3829, #1a120b)`
                      }}
                    />
                    {!unlocked ? (
                      <span className="absolute inset-0 flex items-center justify-center text-2xl text-white/40">
                        ?
                      </span>
                    ) : null}
                  </div>

                  {/* Testi */}
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70 transition-colors group-hover:text-[#a67c52]">
                      {doorLabels[definition.type]}
                    </p>
                    <p className="mt-2 text-xs text-white/60">{definition.description}</p>
                    <p className="mt-2 text-xs uppercase text-[#a67c52]">
                      Drop: {(definition.dropRate * 100).toFixed(2)}%
                    </p>
                    {status?.unlockedAt ? (
                      <p className="mt-1 text-[11px] text-white/40">
                        Sbloccata il {new Date(status.unlockedAt).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-white/30">Non ancora trovata</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MedalsRoute;
