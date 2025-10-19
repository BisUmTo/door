import { useMemo, useState } from "react";
import clsx from "clsx";
import type { AmmoKind, WeaponConfig, WeaponName, WeaponState } from "@/game/types";
import { getWeaponAmmoKind } from "@/data/normalize";

// Risolvi l'icona dell'arma in base al displayName
const resolveWeaponIcon = (displayName: string) => {
  const file = `${encodeURIComponent(displayName.toLowerCase())}.png`;
  return `/assets/armi/${file}`;
};

interface WeaponsPanelProps {
  open: boolean;
  locked?: boolean;
  weapons: WeaponState[];
  weaponConfigs: WeaponConfig[];
  ammoInventory: Record<AmmoKind, number>;
  onClose: () => void;
  onConfirm: (weapon: WeaponName, ammoToSpend: number) => void;
}

export const WeaponsPanel = ({
  open,
  locked,
  weapons,
  weaponConfigs,
  ammoInventory,
  onClose,
  onConfirm
}: WeaponsPanelProps) => {
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponName | null>(null);
  const [ammoToSpend, setAmmoToSpend] = useState(1);

  const availableWeapons = useMemo(() => {
    return weapons
      .filter((weapon) => weapon.unlocked)
      .map((weapon) => {
        const config = weaponConfigs.find((cfg) => cfg.name === weapon.name);
        const ammoKind = getWeaponAmmoKind(weapon.name);
        const ammoAvailable = ammoInventory[ammoKind] ?? 0;
        return {
          weapon,
          config,
          ammoKind,
          ammoAvailable
        };
      })
      .filter((entry) => entry.config);
  }, [weapons, weaponConfigs, ammoInventory]);

  const handleSelect = (weaponName: WeaponName) => {
    const ammoKind = getWeaponAmmoKind(weaponName);
    const available = ammoInventory[ammoKind] ?? 0;
    // Imposta la selezione e normalizza ammoToSpend in base alla disponibilità
    setSelectedWeapon(weaponName);
    setAmmoToSpend(Math.max(1, Math.min(ammoToSpend, Math.max(1, available))));
  };

  const handleConfirm = () => {
    if (!selectedWeapon) return;
    if (locked) return;
    onConfirm(selectedWeapon, ammoToSpend);
    setSelectedWeapon(null);
    setAmmoToSpend(1);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-background/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display uppercase tracking-widest">Armi</h2>
          <button
            type="button"
            onClick={() => {
              setSelectedWeapon(null);
              onClose();
            }}
            className="rounded border border-white/20 px-3 py-1 text-sm uppercase tracking-wide text-white/80 hover:bg-white/10"
          >
            Indietro
          </button>
        </div>

        {locked ? (
          <p className="mt-4 rounded bg-red-500/20 px-4 py-3 text-center text-sm text-red-200">
            Le armi non possono pi\u00f9 essere usate in questo contrasto.
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {availableWeapons.map(({ weapon, config, ammoKind, ammoAvailable }) => {
            const iconSrc = config?.displayName ? resolveWeaponIcon(config.displayName) : null;
            const isSelected = selectedWeapon === weapon.name;
            return (
              <button
                key={weapon.name}
                type="button"
                disabled={locked || ammoAvailable <= 0}
                onClick={() => handleSelect(weapon.name)}
                // aggiunta di aria-pressed, tabIndex e classe ring per evidenziare la casella selezionata
                aria-pressed={isSelected}
                tabIndex={0}
                className={clsx(
                  "rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-accent hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  isSelected && "border-accent bg-white/10 ring-2 ring-accent",
                  (locked || ammoAvailable <= 0) && "cursor-not-allowed opacity-50"
                )}
                data-selected={isSelected ? "true" : "false"}
              >
                <div className="flex items-start gap-3">
                  {/* Icona arma con badge */}
                  {iconSrc && (
                    <div className="flex-shrink-0 relative">
                      <img
                        src="/assets/armi/badge.png"
                        alt="badge"
                        className="h-16 w-16 object-contain"
                        draggable={false}
                      />
                      <img
                        src={iconSrc}
                        alt={config?.displayName}
                        className="absolute inset-0 h-16 w-16 object-contain p-1"
                        draggable={false}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">{config?.displayName}</h3>
                    <p className="text-xs uppercase text-white/50">Munizioni {ammoKind}</p>
                    <p className="mt-2 text-sm text-white/80">Danno colpo: {config?.damagePerShot}</p>
                    <p className="text-sm text-white/80">Disponibili: {ammoAvailable}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedWeapon ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold uppercase tracking-wide text-accent">
                Ammo:{ammoToSpend}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={Math.max(
                    1,
                    ammoInventory[getWeaponAmmoKind(selectedWeapon)] ?? 1
                  )}
                  value={ammoToSpend}
                  onChange={(event) => setAmmoToSpend(Number(event.target.value))}
                  className="w-40 accent-accent"
                />
                <input
                  type="number"
                  value={ammoToSpend}
                  min={1}
                  max={Math.max(
                    1,
                    ammoInventory[getWeaponAmmoKind(selectedWeapon)] ?? 1
                  )}
                  onChange={(event) =>
                    setAmmoToSpend(Math.max(1, Number(event.target.value) || 1))
                  }
                  className="w-16 rounded border border-white/10 bg-black/60 px-2 py-1 text-center text-white"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedWeapon(null);
                  setAmmoToSpend(1);
                }}
                className="rounded border border-white/20 px-4 py-2 text-sm uppercase text-white/70 hover:bg-white/10"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={locked}
                className="rounded bg-accent px-4 py-2 text-sm uppercase text-black hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-accent/40"
              >
                Spara
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WeaponsPanel;
