import type {
  AnimalConfig,
  DoorType,
  LootEntry,
  SaveGame,
  WeaponConfig,
  WeaponName
} from "@/game/types";
import { doorLabels } from "@/components/Door";
import { isMedalResource, medalResourceToDoorType } from "@/game/medals";
import {
  findFurnitureObjectName,
  getFurnitureResourceTargetId,
  isFurnitureResource
} from "@/game/furniture";

interface VictoryModalProps {
  open: boolean;
  loot: LootEntry | null;
  weaponsUsed: { name: WeaponName; shots: number }[];
  fallenAnimals: { configId: number }[];
  animalConfigs: AnimalConfig[];
  weaponConfigs: WeaponConfig[];
  medalUnlocked?: DoorType | null;
  houseObjects: SaveGame["house"]["objects"];
  onContinue: () => void;
}

const ACCENT = "#a67c52";

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
  medalUnlocked,
  houseObjects,
  onContinue
}: VictoryModalProps) => {
  if (!open) return null;

  const renderLoot = () => {
    if (!loot) {
      return <p className="mt-2 text-sm text-white/70">Nessun bottino.</p>;
    }

    if (isMedalResource(loot.type)) {
      const doorType = medalResourceToDoorType(loot.type);
      return (
        <p className="mt-2 text-lg font-semibold" style={{ color: ACCENT }}>
          {`Medaglietta ${doorLabels[doorType]}`}
        </p>
      );
    }

    if (isFurnitureResource(loot.type)) {
      const targetId = getFurnitureResourceTargetId(loot.type);
      const targetName = findFurnitureObjectName(houseObjects, targetId);
      const label = targetName ? `Pezzi arredamento (${targetName})` : "Pezzi arredamento";
      return (
        <p className="mt-2 text-lg font-semibold" style={{ color: ACCENT }}>
          +{loot.qty} {label}
        </p>
      );
    }

    return (
      <p className="mt-2 text-lg font-semibold" style={{ color: ACCENT }}>
        +{loot.qty} {loot.type}
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      {/* Card principale: vetroso scuro + bordi chiari */}
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-xl backdrop-blur">
        {/* Titolo */}
        <h2
          className="text-4xl font-display uppercase tracking-[0.4em]"
          style={{ color: ACCENT }}
        >
          Vittoria
        </h2>

        {/* Sezioni info */}
        <section className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">
              Armi utilizzate
            </h3>
            {weaponsUsed.length === 0 ? (
              <p className="text-sm text-white/70">Nessun colpo sparato.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
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
            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">
              Animali caduti
            </h3>
            {fallenAnimals.length === 0 ? (
              <p className="text-sm text-white/70">Nessuna perdita.</p>
            ) : (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/80">
                {fallenAnimals.map((animal, index) => (
                  <li key={`${animal.configId}-${index}`}>
                    {animalName(animalConfigs, animal.configId)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Ricompensa */}
        <section className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4 text-center">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">Ricompensa</h3>
          {renderLoot()}
        </section>

        {/* Medaglietta sbloccata (se presente) */}
        {medalUnlocked ? (
          <section
            className="mt-3 rounded-xl border p-4 text-center"
            style={{ borderColor: ACCENT, backgroundColor: "rgba(166,124,82,0.12)", color: "#f4e7da" }}
          >
            <h4 className="text-xs uppercase tracking-[0.35em]" style={{ color: "#e7d6c7" }}>
              Nuova medaglietta sbloccata!
            </h4>
            <p className="mt-2 text-lg font-semibold" style={{ color: ACCENT }}>
              {doorLabels[medalUnlocked]}
            </p>
          </section>
        ) : null}

        {/* CTA */}
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest transition"
          style={{
            backgroundColor: ACCENT,
            color: "#0f0f0f"
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8b5e34";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = ACCENT;
          }}
        >
          Procedi
        </button>
      </div>
    </div>
  );
};

export default VictoryModal;
