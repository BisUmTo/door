import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGameStore } from "@/state/store";
import { getLifeCap, getStaminaCap } from "@/game/animals";
import type { AnimalConfig, AnimalInstance, WeaponConfig } from "@/game/types";

type InventoryTab = "animals" | "weapons";

const formatSize = (size: AnimalInstance["size"]) => (size === "Small" ? "Piccolo" : "Grande");

const InventoryRoute = () => {
  const {
    save,
    configs,
    feedAnimal,
    growAnimal
  } = useGameStore((state) => ({
    save: state.save,
    configs: state.configs,
    feedAnimal: state.feedAnimal,
    growAnimal: state.growAnimal
  }));

  const [activeTab, setActiveTab] = useState<InventoryTab>("animals");
  const [selectedAnimal, setSelectedAnimal] = useState<number | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<number | null>(null);

  const animalConfigs = configs?.animals ?? [];
  const weaponConfigs = configs?.weapons ?? [];

  const animals = save?.animals.owned ?? [];
  const weapons = save?.weapons ?? [];
  const foodAvailable = save?.inventory.food ?? 0;

  const selectedAnimalData = useMemo(() => {
    if (selectedAnimal === null) return null;
    const instance = animals[selectedAnimal];
    if (!instance) return null;
    const config = animalConfigs.find((entry) => entry.id === instance.configId);
    if (!config) return null;
    const lifeCap = getLifeCap(config, instance.size);
    const staminaCap = getStaminaCap(config, instance.size);
    return { instance, config, lifeCap, staminaCap, index: selectedAnimal };
  }, [selectedAnimal, animals, animalConfigs]);

  const selectedWeaponData = useMemo(() => {
    if (selectedWeapon === null) return null;
    const weapon = weapons[selectedWeapon];
    if (!weapon) return null;
    const config = weaponConfigs.find((entry) => entry.name === weapon.name);
    if (!config) return null;
    return { weapon, config };
  }, [selectedWeapon, weapons, weaponConfigs]);

  const handleFeed = (index: number) => {
    feedAnimal(index);
  };

  const handleGrow = (index: number) => {
    growAnimal(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="text-4xl font-display uppercase tracking-[0.5em] text-white/80">
              Inventario
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Gestisci animali e armi disponibili prima di entrare in battaglia.
            </p>
          </div>
          <Link
            to="/lobby"
            className="rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:border-accent hover:text-accent"
          >
            Torna alla lobby
          </Link>
        </header>

        <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 text-sm uppercase text-white/70">
            <div className="rounded-full border border-white/15 bg-black/40 px-4 py-2">
              <span className="text-white/50">Monete</span>
              <span className="ml-3 font-semibold text-white">{save?.inventory.coins ?? 0}</span>
            </div>
            <div className="rounded-full border border-white/15 bg-black/40 px-4 py-2">
              <span className="text-white/50">Cibo</span>
              <span className="ml-3 font-semibold text-white">{save?.inventory.food ?? 0}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("weapons");
                setSelectedWeapon(0);
              }}
              className={`rounded-full px-6 py-2 text-sm uppercase tracking-[0.3em] transition ${
                activeTab === "weapons"
                  ? "border border-accent bg-accent/20 text-accent"
                  : "border border-white/20 bg-black/40 text-white/60 hover:border-accent hover:text-accent"
              }`}
            >
              Armi
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("animals");
                setSelectedAnimal(0);
              }}
              className={`rounded-full px-6 py-2 text-sm uppercase tracking-[0.3em] transition ${
                activeTab === "animals"
                  ? "border border-emerald-400 bg-emerald-400/20 text-emerald-300"
                  : "border border-white/20 bg-black/40 text-white/60 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Animali
            </button>
          </div>

          {activeTab === "animals" ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4 max-h-[420px]">
                {animals.length === 0 ? (
                  <p className="text-sm text-white/60">
                    Non hai ancora trovato animali. Esplora nuove porte per ampliare la squadra.
                  </p>
                ) : (
                  animals.map((animal, index) => {
                    const config = animalConfigs.find((entry) => entry.id === animal.configId);
                    if (!config) return null;
                    const selected = selectedAnimal === index;
                    const staminaCap = getStaminaCap(config, animal.size);
                    const staminaPercent = staminaCap > 0 ? Math.round((animal.stamina / staminaCap) * 100) : 0;
                    return (
                      <button
                        key={`${animal.configId}-${index}`}
                        type="button"
                        onClick={() => setSelectedAnimal(index)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-emerald-400 bg-emerald-400/10"
                            : "border-white/10 bg-white/5 hover:border-emerald-300/60"
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm text-white/80">
                          <span className="font-semibold text-white">{config.kind}</span>
                          <span className="text-xs uppercase text-white/50">{formatSize(animal.size)}</span>
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded bg-white/10">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${Math.min(100, Math.max(0, staminaPercent))}%` }}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                {selectedAnimalData ? (
                  <div className="space-y-4 text-sm text-white/80">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {selectedAnimalData.config.kind}
                      </h2>
                      <p className="text-xs uppercase text-white/50">
                        {formatSize(selectedAnimalData.instance.size)}
                      </p>
                    </div>
                    <div className="space-y-2 text-xs uppercase text-white/60">
                      <div>
                        <span>Stamina</span>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/10">
                          <div
                            className="h-full bg-emerald-400"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Math.round(
                                    (selectedAnimalData.instance.stamina / selectedAnimalData.staminaCap) * 100
                                  )
                                )
                              )}%`
                            }}
                          />
                        </div>
                        <span className="mt-1 block text-white/50">
                          {selectedAnimalData.instance.stamina}/{selectedAnimalData.staminaCap}
                        </span>
                      </div>
                      <div>
                        <span>Vita</span>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/10">
                          <div
                            className="h-full bg-sky-400"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Math.round(
                                    (selectedAnimalData.instance.life / selectedAnimalData.lifeCap) * 100
                                  )
                                )
                              )}%`
                            }}
                          />
                        </div>
                        <span className="mt-1 block text-white/50">
                          {selectedAnimalData.instance.life}/{selectedAnimalData.lifeCap}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Danno</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedAnimalData.config.damage}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Velocità</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedAnimalData.config.attackSpeed}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Armatura</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedAnimalData.instance.armor ?? 0}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Stato</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedAnimalData.instance.alive ? "Disponibile" : "Ko"}
                        </p>
                      </div>
                    </div>

                    {selectedAnimalData.instance.size === "Small" ? (
                      <p className="text-xs uppercase text-white/50">
                        Costo crescita: {selectedAnimalData.config.growthFoodCost} cibo
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={
                          selectedAnimalData.instance.stamina >= selectedAnimalData.staminaCap ||
                          foodAvailable <= 0
                        }
                        onClick={() => handleFeed(selectedAnimalData.index)}
                        className="rounded-full border border-emerald-400 px-4 py-2 text-xs uppercase tracking-[0.35em] text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:border-emerald-900 disabled:text-emerald-900"
                      >
                        Nutri
                      </button>
                      {selectedAnimalData.instance.size === "Small" ? (
                        <button
                          type="button"
                          disabled={foodAvailable < selectedAnimalData.config.growthFoodCost}
                          onClick={() => handleGrow(selectedAnimalData.index)}
                          className="rounded-full border border-amber-300 px-4 py-2 text-xs uppercase tracking-[0.35em] text-amber-200 transition hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:border-amber-900 disabled:text-amber-900"
                        >
                          Fai crescere
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedAnimal(null)}
                        className="ml-auto rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60 transition hover:border-white/40 hover:text-white"
                      >
                        Indietro
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/60">
                    Seleziona un animale per vedere i dettagli e nutrirlo.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4 max-h-[420px]">
                {weapons.length === 0 ? (
                  <p className="text-sm text-white/60">Nessuna arma disponibile.</p>
                ) : (
                  weapons.map((weapon, index) => {
                    const config = weaponConfigs.find((entry) => entry.name === weapon.name);
                    if (!config) return null;
                    const selected = selectedWeapon === index;
                    const ammoPercent = config.maxAmmo > 0 ? Math.round((weapon.ammo / config.maxAmmo) * 100) : 0;
                    return (
                      <button
                        key={weapon.name}
                        type="button"
                        onClick={() => setSelectedWeapon(index)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-accent bg-accent/10"
                            : "border-white/10 bg-white/5 hover:border-accent/60"
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm text-white/80">
                          <span className="font-semibold text-white">{config.displayName}</span>
                          <span className="text-xs uppercase text-white/50">{config.ammoType}</span>
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded bg-white/10">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${Math.min(100, Math.max(0, ammoPercent))}%` }}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                {selectedWeaponData ? (
                  <div className="space-y-4 text-sm text-white/80">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {selectedWeaponData.config.displayName}
                      </h2>
                      <p className="text-xs uppercase text-white/50">
                        {selectedWeaponData.config.ammoType}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Munizioni</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedWeaponData.weapon.ammo}/{selectedWeaponData.config.maxAmmo}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Danno per colpo</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedWeaponData.config.damagePerShot}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedWeapon(null)}
                      className="ml-auto rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60 transition hover:border-white/40 hover:text-white"
                    >
                      Indietro
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-white/60">
                    Seleziona un'arma per controllare le statistiche.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InventoryRoute;
