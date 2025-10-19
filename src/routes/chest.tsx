import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { CHEST_DEFINITIONS } from "@/game/chests";
import type { ChestRarity, LootEntry } from "@/game/types";
import { doorLabels } from "@/components/Door";
import { isMedalResource, medalResourceToDoorType } from "@/game/medals";
import {
  findFurnitureObjectName,
  getFurnitureResourceTargetId,
  isFurnitureResource
} from "@/game/furniture";
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
  const houseObjects = save?.house.objects ?? [];
  const selectedAvailable = selected ? inventory[selected] ?? 0 : 0;

  const resolveResourceLabel = (loot: LootEntry): string => {
    if (isFurnitureResource(loot.type)) {
      const targetId = getFurnitureResourceTargetId(loot.type);
      const targetName = findFurnitureObjectName(houseObjects, targetId);
      return targetName ? `Pezzi arredamento (${targetName})` : "Pezzi arredamento";
    }
    return loot.type;
  };

  const formatLootText = (loot: LootEntry | null): string => {
    if (!loot) {
      return "Nessun bottino";
    }
    if (isMedalResource(loot.type)) {
      const doorType = medalResourceToDoorType(loot.type);
      return `Medaglietta ${doorLabels[doorType]}`;
    }
    return `+${loot.qty} ${resolveResourceLabel(loot)}`;
  };

  const handleChestSelect = (rarity: ChestRarity) => {
    setMessage(null);
    if (selected !== rarity) {
      setSelected(rarity);
      setStage("preview");
      setReward(null);
    }
  };

  const handleOpenChest = () => {
    if (!selected) return;

    const available = inventory[selected] ?? 0;
    if (available <= 0) {
      setMessage("Nessun baule di questa rarità disponibile.");
      return;
    }

    setStage("opening");
    setMessage(null);

    window.setTimeout(() => {
      const result = openChest(selected);
      setReward(result);
      setStage("opened");
    }, 1200);
  };

  const handleOpenAnother = () => {
    setStage("preview");
    setReward(null);
    setMessage(null);
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
                      onClick={() => handleChestSelect(definition.id)}
                      disabled={stage === "opening"}
                      className={clsx(
                        "flex w-full items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-left transition-all duration-300",
                        active
                          ? "border-yellow-400 bg-yellow-400/15 text-yellow-200 shadow-lg shadow-yellow-400/20 scale-[1.02]"
                          : "border-white/10 bg-white/5 text-white/80 hover:border-yellow-300/60 hover:scale-[1.01]",
                        stage === "opening" && "opacity-50 cursor-not-allowed"
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
                    "relative mt-8 flex h-64 w-64 items-center justify-center rounded-full shadow-2xl transition-all duration-500",
                    stage === "preview" && "bg-black/30",
                    stage === "opening" && "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 animate-pulse scale-110",
                    stage === "opened" && "bg-gradient-to-br from-emerald-500/20 to-green-500/10"
                  )}
                  style={{
                    boxShadow: stage === "opening"
                      ? `0 0 60px ${focusedDefinition.accent}40`
                      : stage === "opened"
                      ? "0 0 40px rgba(34, 197, 94, 0.3)"
                      : "none"
                  }}
                >
                  {stage === "opening" && (
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-400/50 animate-ping" />
                  )}

                  {stage !== "opened" ? (
                    <img
                      src={focusedDefinition.image}
                      alt={focusedDefinition.name}
                      className={clsx(
                        "h-48 w-48 object-contain transition-all duration-500",
                        stage === "opening" && "scale-90 blur-sm"
                      )}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-6 animate-fade-in">
                      {reward?.loot ? (
                        <div className="text-center">
                          <div className="text-6xl mb-3">🎁</div>
                          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                            Ricompensa
                          </p>
                          <p className="mt-2 text-2xl font-bold text-emerald-100">
                            {formatLootText(reward.loot)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-5xl mb-3">❌</div>
                          <p className="text-sm text-emerald-100/70">
                            Nessun bottino
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {stage === "preview" ? (
                  <button
                    type="button"
                    onClick={handleOpenChest}
                    disabled={selectedAvailable <= 0}
                    className={clsx(
                      "mt-8 rounded-full px-8 py-3 font-semibold uppercase tracking-[0.35em] transition-all duration-300",
                      selectedAvailable > 0
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/40"
                        : "cursor-not-allowed border border-white/10 bg-white/10 text-white/40"
                    )}
                  >
                    Apri Baule
                  </button>
                ) : null}

                {stage === "opening" ? (
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 animate-bounce rounded-full bg-yellow-400" style={{ animationDelay: "0ms" }} />
                      <div className="h-3 w-3 animate-bounce rounded-full bg-yellow-400" style={{ animationDelay: "150ms" }} />
                      <div className="h-3 w-3 animate-bounce rounded-full bg-yellow-400" style={{ animationDelay: "300ms" }} />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-200">
                      Apertura in corso...
                    </p>
                  </div>
                ) : null}

                {stage === "opened" ? (
                  <div className="mt-6 flex w-full max-w-md flex-col gap-4 animate-fade-in">
                    {reward?.medalUnlocked ? (
                      <div className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-6 py-2 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-300">
                          ✨ Nuova medaglietta ottenuta!
                        </p>
                      </div>
                    ) : null}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleOpenAnother}
                        disabled={(selected && inventory[selected] ? inventory[selected] : 0) <= 0}
                        className={clsx(
                          "flex-1 rounded-full border px-6 py-3 font-semibold uppercase tracking-[0.35em] transition-all duration-300",
                          (selected && inventory[selected] ? inventory[selected] : 0) > 0
                            ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-200 hover:scale-105 hover:bg-yellow-400/20 hover:shadow-lg hover:shadow-yellow-400/30"
                            : "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                        )}
                      >
                        Apri Altro ({selected && inventory[selected] ? inventory[selected] : 0})
                      </button>
                      
                    </div>
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
                      {formatLootText(entry.loot ?? null)}
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
