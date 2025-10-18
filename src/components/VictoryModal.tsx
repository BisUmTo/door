import type { AnimalConfig, LootEntry, WeaponConfig, WeaponName } from "@/game/types";

interface VictoryModalProps {
  open: boolean;
  loot: LootEntry | null;
  weaponsUsed: { name: WeaponName; shots: number }[];
  fallenAnimals: { configId: number }[];
  animalConfigs: AnimalConfig[];
  weaponConfigs: WeaponConfig[];
  onContinue: () => void;
}

const weaponLabel = (weaponConfigs: WeaponConfig[], name: WeaponName) =>
  weaponConfigs.find((weapon) => weapon.name === name)?.displayName ?? name;

const animalName = (animalConfigs: AnimalConfig[], id: number) =>
  animalConfigs.find((animal) => animal.id === id)?.kind ?? `#${id}`;

export const VictoryModal = ({
  open,
  loot,
  weaponsUsed,
  fallenAnimals,
  animalConfigs,
  weaponConfigs,
  onContinue
}: VictoryModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-emerald-400/30 bg-emerald-950/60 p-6 text-white shadow-glow">
        <h2 className="text-4xl font-display uppercase tracking-[0.4em] text-emerald-300">
          Vittoria
        </h2>

        <section className="mt-4 space-y-3">
          <div>
            <h3 className="text-sm uppercase text-emerald-200/70">Armi utilizzate</h3>
            {weaponsUsed.length === 0 ? (
              <p className="text-sm text-white/70">Nessun colpo sparato.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm">
                {weaponsUsed.map((weapon) => (
                  <li key={weapon.name} className="flex justify-between">
                    <span>{weaponLabel(weaponConfigs, weapon.name)}</span>
                    <span>{weapon.shots} colpi</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm uppercase text-emerald-200/70">Animali caduti</h3>
            {fallenAnimals.length === 0 ? (
              <p className="text-sm text-white/70">Nessuna perdita.</p>
            ) : (
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                {fallenAnimals.map((animal, index) => (
                  <li key={`${animal.configId}-${index}`}>
                    {animalName(animalConfigs, animal.configId)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-900/40 p-4 text-center">
          <h3 className="text-sm uppercase text-emerald-200/70">Ricompensa</h3>
          {loot ? (
            <p className="mt-2 text-lg font-semibold text-emerald-200">
              +{loot.qty} {loot.type}
            </p>
          ) : (
            <p className="mt-2 text-sm text-white/70">Nessun bottino.</p>
          )}
        </section>

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-full bg-emerald-400 py-3 text-sm font-semibold uppercase tracking-widest text-emerald-950 hover:bg-emerald-300"
        >
          Procedi
        </button>
      </div>
    </div>
  );
};

export default VictoryModal;
