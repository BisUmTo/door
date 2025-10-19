import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { CHEST_DEFINITIONS } from "@/game/chests";
import type { ChestRarity } from "@/game/types";
import { doorLabels } from "@/components/Door";
import { isMedalResource, medalResourceToDoorType } from "@/game/medals";
import { useGameStore } from "@/state/store";

type OpeningStage = "idle" | "preview" | "opening" | "opened";

const ChestRoute = () => {
  const { save, openChest } = useGameStore((state) => ({
    save: state.save,
    openChest: state.openChest
  }));

  const [selected, setSelected] = useState<ChestRarity | null>(null);
  const [stage, setStage] = useState<OpeningStage>("idle");
  const [reward, setReward] = useState<ReturnType<typeof openChest>>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    console.debug("[ChestRoute] Game state snapshot:", useGameStore.getState());
  }, []);

  const inventory = save?.chests.inventory ?? {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  };

  const history = save?.chests.unlockedHistory ?? [];

  const handleChestClick = (rarity: ChestRarity) => {
    setMessage(null);
    if (selected !== rarity) {
      setSelected(rarity);
      setStage("preview");
      setReward(null);
      return;
    }

    if (stage === "preview") {
      const available = inventory[rarity] ?? 0;
      if (available <= 0) {
        setMessage("Nessun baule di questa rarità disponibile.");
        return;
      }
      setStage("opening");
      window.setTimeout(() => {
        const result = openChest(rarity);
        setReward(result);
        setStage("opened");
      }, 700);
    }
  };

  const focusedDefinition = selected
    ? CHEST_DEFINITIONS.find((entry) => entry.id === selected)
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/assets/lobby/sfondo_lobby.png')] bg-cover bg-center blur-sm opacity-60" />
        <div className="absolute inset-0 bg-black/75" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5 uppercase tracking-[0.4em] text-white/70">
          <span>Bauli</span>
          <Link
            to="/lobby"
            className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest transition hover:border-yellow-400 hover:text-yellow-300"
          >
            Lobby
          </Link>
        </header>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row">
          <aside className="w-full lg:max-w-sm">
            <ul className="space-y-4">
              {CHEST_DEFINITIONS.map((definition) => {
                const count = inventory[definition.id] ?? 0;
                const active = selected === definition.id;
                return (
                  <li key={definition.id}>
                    <button
                      type="button"
                      onClick={() => handleChestClick(definition.id)}
                      className={clsx(
                        "flex w-full items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-left transition",
                        active
                          ? "border-yellow-400 bg-yellow-400/15 text-yellow-200"
                          : "border-white/10 bg-white/5 text-white/80 hover:border-yellow-300/60"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={definition.image}
                          alt={definition.name}
                          className="h-16 w-16 rounded-2xl bg-black/40 object-contain"
                        />
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.35em]">
                            {definition.name}
                          </p>
                          <p className="mt-1 text-xs text-white/60">{definition.description}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
                        x{count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="relative flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/40 p-8 shadow-lg">
            {message ? (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-red-200">
                {message}
              </div>
            ) : null}

            {focusedDefinition ? (
              <div className="flex flex-col items-center text-center">
                <h2 className="text-2xl font-semibold uppercase tracking-[0.35em] text-white/80">
                  {focusedDefinition.name}
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/60">
                  {focusedDefinition.description}
                </p>
                <div
                  className={clsx(
                    "mt-8 flex h-64 w-64 items-center justify-center rounded-full bg-black/30 shadow-2xl",
                    stage === "opening" && "animate-pulse"
                  )}
                >
                  <img
                    src={focusedDefinition.image}
                    alt={focusedDefinition.name}
                    className={clsx(
                      "h-48 w-48 object-contain transition",
                      stage === "opening" && "scale-90",
                      stage === "opened" && "scale-95 opacity-80"
                    )}
                  />
                </div>

                {stage === "preview" ? (
                  <p className="mt-6 text-sm text-white/70">
                    Clicca di nuovo per aprire il baule.
                  </p>
                ) : null}

                {stage === "opening" ? (
                  <p className="mt-6 text-sm text-yellow-200">Apertura in corso...</p>
                ) : null}

                {stage === "opened" ? (
                  <div className="mt-6 w-full max-w-md rounded-3xl border border-yellow-300/40 bg-yellow-300/10 p-5 text-sm text-yellow-100">
                    {reward?.loot ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-yellow-200/70">
                          Ricompensa
                        </p>
                        <p className="mt-2 text-lg font-semibold text-yellow-200">
                          {isMedalResource(reward.loot.type)
                            ? `Medaglietta ${doorLabels[medalResourceToDoorType(reward.loot.type)]}`
                            : `+${reward.loot.qty} ${reward.loot.type}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-100/70">
                        Nessun bottino trovato questa volta.
                      </p>
                    )}

                    {reward?.medalUnlocked ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.35em] text-yellow-200">
                        Nuova medaglietta ottenuta!
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-white/60">
                Scegli un baule per visualizzare i dettagli e aprirlo.
              </p>
            )}
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-white/70">
            Storia ricompense
          </h2>
          {history.length ? (
            <ul className="mt-4 space-y-3 text-sm">
              {history
                .slice()
                .reverse()
                .map((entry, index) => (
                  <li
                    key={`${entry.time}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-white">{entry.rarity}</p>
                      <p className="text-xs text-white/60">
                        {new Date(entry.time).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm text-yellow-200">
                      {entry.loot ? `+${entry.loot.qty} ${entry.loot.type}` : "Nessun bottino"}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-white/60">Nessun baule aperto finora.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChestRoute;
