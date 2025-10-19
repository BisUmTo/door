import clsx from "clsx";
import type { AnimalConfig, SaveGame } from "@/game/types";
import {
  AnimalBattleStats,
  AnimalReadiness,
  getAnimalReadiness,
  getDisplayBattleStats,
  getMissingStamina
} from "@/game/animals";
import { resolveAnimalIconImage, handleImageError } from "@/utils/animalImages";

interface AnimalsPanelProps {
  open: boolean;
  animals: SaveGame["animals"]["owned"];
  configs: AnimalConfig[];
  onClose: () => void;
  onDeploy: (index: number) => void;
}

const findAnimalConfig = (configs: AnimalConfig[], id: number) =>
  configs.find((animal) => animal.id === id);

interface DecoratedAnimal {
  index: number;
  config: AnimalConfig | null;
  name: string;
  instance: SaveGame["animals"]["owned"][number];
  stats: AnimalBattleStats;
  readiness: AnimalReadiness;
  missingStamina: number;
  staminaPercent: number;
  lifePercent: number;
}

export const AnimalsPanel = ({
  open,
  animals,
  configs,
  onClose,
  onDeploy
}: AnimalsPanelProps) => {
  if (!open) return null;

  const decoratedAnimals = animals.reduce<DecoratedAnimal[]>((acc, instance, index) => {
    const config = findAnimalConfig(configs, instance.configId) ?? null;
    const stats = getDisplayBattleStats(config, instance);
    const readiness = getAnimalReadiness(config, instance);
    const missingStamina = getMissingStamina(config, instance);
    const staminaPercent =
      stats.staminaCap > 0
        ? Math.round((Math.max(0, instance.stamina) / stats.staminaCap) * 100)
        : 0;
    const lifePercent =
      stats.lifeCap > 0 ? Math.round((Math.max(0, instance.life) / stats.lifeCap) * 100) : 0;
    acc.push({
      index,
      config,
      name: config?.kind ?? `#${instance.configId}`,
      instance,
      stats,
      readiness,
      missingStamina,
      staminaPercent,
      lifePercent
    });
    return acc;
  }, []);

  const grouped = decoratedAnimals.reduce(
    (acc, entry) => {
      acc[entry.readiness].push(entry);
      return acc;
    },
    {
      ready: [] as DecoratedAnimal[],
      recovering: [] as DecoratedAnimal[],
      fallen: [] as DecoratedAnimal[]
    }
  );

  const readinessMeta: Record<
    AnimalReadiness,
    { label: string; tone: string; helper(entry: DecoratedAnimal): string; action: string; disabled: boolean }
  > = {
    ready: {
      label: "Pronto",
      tone: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
      helper: () => "Stamina al massimo.",
      action: "Schiera",
      disabled: false
    },
    recovering: {
      label: "In recupero",
      tone: "border-amber-300/40 bg-amber-400/10 text-amber-200",
      helper: (entry) =>
        `Mancano ${entry.missingStamina} stamina - costo cibo ${entry.missingStamina}`,
      action: "Non pronto",
      disabled: true
    },
    fallen: {
      label: "Ko",
      tone: "border-rose-400/40 bg-rose-500/10 text-rose-200",
      helper: () => "Torni disponibile dopo il prossimo riposo.",
      action: "Non disponibile",
      disabled: true
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-background/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display uppercase tracking-widest">Animali</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/20 px-3 py-1 text-sm uppercase tracking-wide text-white/80 hover:bg-white/10"
          >
            Indietro
          </button>
        </div>

        <div className="mt-4 space-y-6">
          {(
            [
              { key: "ready", title: "Pronti a combattere" },
              { key: "recovering", title: "In recupero" },
              { key: "fallen", title: "Ko" }
            ] as const
          ).map(({ key, title }) => {
            const list = grouped[key];
            return (
              <div key={key}>
                <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">{title}</h3>
                {list.length === 0 ? (
                  <p className="mt-2 text-xs text-white/50">
                    {key === "ready"
                      ? "Nessun animale pronto."
                      : key === "recovering"
                        ? "Nessun animale sta recuperando stamina."
                        : "Nessun animale è caduto."}
                  </p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {list.map((entry) => {
                      const meta = readinessMeta[entry.readiness];
                      const iconSrc = resolveAnimalIconImage(entry.config);
                      return (
                        <div
                          key={`${entry.config?.id ?? "cfg"}-${entry.index}`}
                          className={clsx(
                            "rounded-xl border border-white/10 bg-white/5 p-4",
                            entry.readiness === "fallen" && "opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icona animale */}
                            <div className="flex-shrink-0">
                              <img
                                src={iconSrc}
                                alt={entry.name}
                                className="h-20 w-20 rounded-lg object-contain bg-black/20 p-1"
                                draggable={false}
                                onError={handleImageError}
                              />
                            </div>

                            {/* Info e stats */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-lg font-semibold text-white">
                                    {entry.name}
                                  </span>
                                  <p className="text-xs uppercase text-white/50">{entry.instance.size}</p>
                                </div>
                                <span
                                  className={clsx(
                                    "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]",
                                    meta.tone
                                  )}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <dl className="mt-3 space-y-1 text-sm text-white/80">
                                <div className="flex justify-between">
                                  <dt>Vita</dt>
                                  <dd>
                                    {entry.instance.life}/{entry.stats.lifeCap}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt>Danno</dt>
                                  <dd>{entry.stats.damage}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt>Velocità</dt>
                                  <dd>{entry.stats.attackSpeed}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt>Armatura</dt>
                                  <dd>{entry.instance.armor ?? 0}</dd>
                                </div>
                              </dl>
                              <div className="mt-3 space-y-2 text-xs uppercase text-white/60">
                                <div>
                                  <span>Stamina</span>
                                  <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/10">
                                    <div
                                      className="h-full rounded bg-emerald-400"
                                      style={{
                                        width: `${Math.min(100, Math.max(0, entry.staminaPercent))}%`
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <span>Resistenza</span>
                                  <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/10">
                                    <div
                                      className="h-full rounded bg-sky-400"
                                      style={{
                                        width: `${Math.min(100, Math.max(0, entry.lifePercent))}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <p className="mt-3 text-xs text-white/60">{meta.helper(entry)}</p>
                              <button
                                type="button"
                                disabled={meta.disabled}
                                onClick={() => onDeploy(entry.index)}
                                className={clsx(
                                  "mt-4 w-full rounded px-4 py-2 text-sm uppercase tracking-[0.3em]",
                                  meta.disabled
                                    ? "border border-white/20 text-white/40"
                                    : "border border-emerald-400 bg-emerald-500 text-black hover:bg-emerald-400"
                                )}
                              >
                                {meta.action}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnimalsPanel;
