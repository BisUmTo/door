import clsx from "clsx";
import type { AnimalConfig, SaveGame } from "@/game/types";
import { getLifeCap, getStaminaCap } from "@/game/animals";

interface AnimalsPanelProps {
  open: boolean;
  animals: SaveGame["animals"]["owned"];
  configs: AnimalConfig[];
  onClose: () => void;
  onDeploy: (index: number) => void;
}

const findAnimalConfig = (configs: AnimalConfig[], id: number) =>
  configs.find((animal) => animal.id === id);

export const AnimalsPanel = ({
  open,
  animals,
  configs,
  onClose,
  onDeploy
}: AnimalsPanelProps) => {
  if (!open) return null;

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

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {animals.map((animal, index) => {
            const config = findAnimalConfig(configs, animal.configId);
            if (!config) return null;
            const lifeCap = getLifeCap(config, animal.size);
            const staminaCap = getStaminaCap(config, animal.size);
            const staminaReady = animal.stamina >= staminaCap;
            const lifePercent = lifeCap > 0 ? Math.round((animal.life / lifeCap) * 100) : 0;
            const staminaPercent = staminaCap > 0 ? Math.round((animal.stamina / staminaCap) * 100) : 0;
            return (
              <div
                key={`${animal.configId}-${index}`}
                className={clsx(
                  "rounded-xl border border-white/10 bg-white/5 p-4",
                  !animal.alive && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">{config.kind}</span>
                  <span className="text-xs uppercase text-white/50">{animal.size}</span>
                </div>
                <dl className="mt-3 space-y-1 text-sm text-white/80">
                  <div className="flex justify-between">
                    <dt>Vita</dt>
                    <dd>
                      {animal.life}/{lifeCap}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Danno</dt>
                    <dd>{config.damage}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Velocità</dt>
                    <dd>{config.attackSpeed}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Armatura</dt>
                    <dd>{animal.armor ?? 0}</dd>
                  </div>
                </dl>
                <div className="mt-3 space-y-2 text-xs uppercase text-white/60">
                  <div>
                    <span>Stamina</span>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/10">
                      <div
                        className="h-full rounded bg-emerald-400"
                        style={{ width: `${Math.min(100, Math.max(0, staminaPercent))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <span>Resistenza</span>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/10">
                      <div
                        className="h-full rounded bg-sky-400"
                        style={{ width: `${Math.min(100, Math.max(0, lifePercent))}%` }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!animal.alive || !staminaReady}
                  onClick={() => onDeploy(index)}
                  className="mt-4 w-full rounded bg-emerald-500 px-4 py-2 text-sm uppercase text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900 disabled:text-white/40"
                >
                  {staminaReady ? "Lotta" : "Stamina Bassa"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnimalsPanel;
