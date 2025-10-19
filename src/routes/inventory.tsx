import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGameStore } from "@/state/store";
import {
  AnimalBattleStats,
  AnimalReadiness,
  getAnimalReadiness,
  getDisplayBattleStats,
  getMissingStamina
} from "@/game/animals";
import type { AmmoKind, AnimalConfig, AnimalInstance, WeaponConfig } from "@/game/types";
import { resolveAnimalIconImage, handleImageError } from "@/utils/animalImages";
// Icona arma in base al displayName (i file stanno in /assets/armi e hanno il nome in minuscolo)
const resolveWeaponIcon = (displayName: string) => {
  // es: "Fucile a pompa" -> "/assets/armi/fucile%20a%20pompa.png"
  const file = `${encodeURIComponent(displayName.toLowerCase())}.png`;
  return `/assets/armi/${file}`;
};

// opzionale: fallback generico se l’immagine non esiste
const WEAPON_FALLBACK_ICON = "/assets/armi/placeholder.png"; // metti un placeholder in /public o assets

type InventoryTab = "animals" | "weapons";

const AMMO_ORDER: AmmoKind[] = ["bullets", "shells", "arrows", "darts", "grenades"];

const AMMO_LABELS: Record<AmmoKind, string> = {
  bullets: "Proiettili",
  shells: "Cartucce",
  arrows: "Frecce",
  darts: "Dardi",
  grenades: "Granate"
};

const EMPTY_AMMO: Record<AmmoKind, number> = {
  bullets: 0,
  shells: 0,
  arrows: 0,
  darts: 0,
  grenades: 0
};

const formatSize = (size: AnimalInstance["size"]) => (size === "Small" ? "Piccolo" : "Grande");

interface DecoratedAnimal {
  index: number;
  instance: AnimalInstance;
  config: AnimalConfig | null;
  name: string;
  stats: AnimalBattleStats;
  readiness: AnimalReadiness;
  missingStamina: number;
  staminaPercent: number;
  lifePercent: number;
}

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

  useEffect(() => {
    console.debug("[InventoryRoute] Game state snapshot:", useGameStore.getState());
  }, []);

  const animals = save?.animals.owned ?? [];
  const weapons = save?.weapons ?? [];
  const foodAvailable = save?.inventory.food ?? 0;
  const ammoInventory = save?.inventory.ammo ?? EMPTY_AMMO;

  const decoratedAnimals = useMemo(() => {
    const entries: DecoratedAnimal[] = [];
    animals.forEach((instance, index) => {
      const config = animalConfigs.find((entry) => entry.id === instance.configId) ?? null;
      const stats = getDisplayBattleStats(config, instance);
      const readiness = getAnimalReadiness(config, instance);
      const missingStamina = getMissingStamina(config, instance);
      const staminaPercent =
        stats.staminaCap > 0
          ? Math.round((Math.max(0, instance.stamina) / stats.staminaCap) * 100)
          : 0;
      const lifePercent =
        stats.lifeCap > 0 ? Math.round((Math.max(0, instance.life) / stats.lifeCap) * 100) : 0;
      entries.push({
        index,
        instance,
        config,
        name: config?.kind ?? `#${instance.configId}`,
        stats,
        readiness,
        missingStamina,
        staminaPercent,
        lifePercent
      });
    });
    return entries;
  }, [animals, animalConfigs]);

  const groupedAnimals = useMemo(() => {
    return decoratedAnimals.reduce(
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
  }, [decoratedAnimals]);

  const selectedAnimalData = useMemo(() => {
    if (selectedAnimal === null) return null;
    return decoratedAnimals.find((entry) => entry.index === selectedAnimal) ?? null;
  }, [selectedAnimal, decoratedAnimals]);

  const selectedGrowthPreview = useMemo(() => {
    if (!selectedAnimalData) return null;
    if (!selectedAnimalData.config || selectedAnimalData.instance.size !== "Small") return null;
    const grownInstance: AnimalInstance = {
      ...selectedAnimalData.instance,
      size: "Adult",
      life: selectedAnimalData.config.life,
      stamina: selectedAnimalData.config.staminaMax
    };
    return getDisplayBattleStats(selectedAnimalData.config, grownInstance);
  }, [selectedAnimalData]);

  const ammoSummary = useMemo(
    () =>
      AMMO_ORDER.map((kind) => ({
        kind,
        amount: ammoInventory[kind] ?? 0
      })),
    [ammoInventory]
  );

  const selectedWeaponData = useMemo(() => {
    if (selectedWeapon === null) return null;
    const weapon = weapons[selectedWeapon];
    if (!weapon) return null;
    const config = weaponConfigs.find((entry) => entry.name === weapon.name);
    if (!config) return null;
    const ammoAvailable = ammoInventory[config.ammoType] ?? 0;
    return { weapon, config, ammoAvailable };
  }, [selectedWeapon, weapons, weaponConfigs, ammoInventory]);

  const handleFeed = (index: number) => {
    feedAnimal(index);
  };

  const handleGrow = (index: number) => {
    growAnimal(index);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* SFONDO: stessa immagine + blur + overlay scuro */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/assets/lobby/sfondo_lobby.png')] bg-cover bg-center blur" />
        <div className="absolute inset-0 bg-black/70" />
      </div>

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
            className="rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            Torna alla lobby
          </Link>
        </header>

        <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 text-sm uppercase text-white/70">
            <div className="rounded-full border border-white/15 bg-black/40 px-4 py-2">
              <span className="text-white/50">Monete</span>
              <span className="ml-3 font-semibold text-white">{save?.inventory.coins ?? 0}</span>
            </div>
            <div className="rounded-full border border-white/15 bg-black/40 px-4 py-2">
              <span className="text-white/50">Cibo</span>
              <span className="ml-3 font-semibold text-white">{save?.inventory.food ?? 0}</span>
            </div>
            {/*ammoSummary.map(({ kind, amount }) => (
              <div
                key={kind}
                className="rounded-full border border-white/15 bg-black/40 px-4 py-2"
              >
                <span className="text-white/50">{AMMO_LABELS[kind]}</span>
                <span className="ml-3 font-semibold text-white">{amount}</span>
              </div>
            ))*/}
          </div>

          {/* TAB: sostituito accent viola con marrone */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("weapons");
                setSelectedWeapon(0);
              }}
              className={`rounded-full px-6 py-2 text-sm uppercase tracking-[0.3em] transition ${
                activeTab === "weapons"
                  ? "border border-[#a67c52] bg-[#a67c52]/20 text-[#a67c52]"
                  : "border border-white/20 bg-black/40 text-white/60 hover:border-[#a67c52] hover:text-[#a67c52]"
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
                  ? "border border-[#a67c52] bg-[#a67c52]/20 text-[#a67c52]"
                  : "border border-white/20 bg-black/40 text-white/60 hover:border-[#a67c52] hover:text-[#a67c52]"
              }`}
            >
              Animali
            </button>
          </div>

          {activeTab === "animals" ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4 max-h-[420px]">
                {decoratedAnimals.length === 0 ? (
                  <p className="text-sm text-white/60">
                    Non hai ancora trovato animali. Esplora nuove porte per ampliare la squadra.
                  </p>
                ) : (
                  <>
                    {(
                      [
                        { key: "ready", title: "Pronti a combattere" },
                        { key: "recovering", title: "In recupero" },
                        { key: "fallen", title: "Ko" }
                      ] as const
                    ).map(({ key, title }) => {
                      const list = groupedAnimals[key];
                      if (!list.length) {
                        if (key === "ready") return null;
                        return (
                          <div key={key}>
                            <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">{title}</h3>
                            <p className="mt-1 text-xs text-white/50">
                              {key === "recovering"
                                ? "Nessun animale sta recuperando stamina."
                                : "Nessun animale è caduto."}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div key={key}>
                          <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">{title}</h3>
                          <div className="mt-2 space-y-3">
                            {list.map((entry) => {
                              const selected = selectedAnimal === entry.index;
                              const readinessLabel =
                                entry.readiness === "ready"
                                  ? "Pronto"
                                  : entry.readiness === "recovering"
                                    ? "In recupero"
                                    : "Ko";
                              const readinessTone =
                                entry.readiness === "ready"
                                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                  : entry.readiness === "recovering"
                                    ? "border-amber-300/40 bg-amber-400/10 text-amber-200"
                                    : "border-rose-400/40 bg-rose-500/10 text-rose-200";
                              const helperText =
                                entry.readiness === "ready"
                                  ? "Stamina al massimo."
                                  : entry.readiness === "recovering"
                                    ? `Mancano ${entry.missingStamina} stamina - costo cibo ${entry.missingStamina}`
                                    : "Rientrerà disponibile dopo il prossimo riposo.";
                              const iconSrc = resolveAnimalIconImage(entry.config);
                              return (
                                <button
                                  key={`${entry.config?.id ?? "cfg"}-${entry.index}`}
                                  type="button"
                                  onClick={() => setSelectedAnimal(entry.index)}
                                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                    selected
                                      ? "border-[#a67c52] bg-[#a67c52]/10"
                                      : "border-white/10 bg-white/5 hover:border-[#a67c52]/60"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Icona animale piccola */}
                                    <div className="flex-shrink-0">
                                      <img
                                        src={iconSrc}
                                        alt={entry.name}
                                        className="h-14 w-14 rounded-lg object-contain bg-black/20 p-1"
                                        draggable={false}
                                        onError={handleImageError}
                                      />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between text-sm text-white/80">
                                        <div>
                                          <span className="font-semibold text-white">{entry.name}</span>
                                          <span className="ml-3 text-xs uppercase text-white/50">
                                            {formatSize(entry.instance.size)}
                                          </span>
                                        </div>
                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${readinessTone}`}
                                        >
                                          {readinessLabel}
                                        </span>
                                      </div>
                                      <div className="mt-3 h-2 w-full overflow-hidden rounded bg-white/10">
                                        <div
                                          className="h-full bg-emerald-400"
                                          style={{
                                            width: `${Math.min(100, Math.max(0, entry.staminaPercent))}%`
                                          }}
                                        />
                                      </div>
                                      <p className="mt-2 text-xs text-white/60">{helperText}</p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                {selectedAnimalData ? (
                  <div className="space-y-4 text-sm text-white/80">
                    {/* Icona e header */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={resolveAnimalIconImage(selectedAnimalData.config)}
                          alt={selectedAnimalData.name}
                          className="h-24 w-24 rounded-xl object-contain bg-black/30 p-2"
                          draggable={false}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white">
                          {selectedAnimalData.name}
                        </h2>
                        <p className="text-xs uppercase text-white/50">
                          {formatSize(selectedAnimalData.instance.size)} -{" "}
                          {selectedAnimalData.readiness === "ready"
                            ? "Pronto"
                            : selectedAnimalData.readiness === "recovering"
                              ? "In recupero"
                              : "Ko"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 text-xs uppercase text-white/60">
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
                                    (selectedAnimalData.instance.stamina /
                                      selectedAnimalData.stats.staminaCap) *
                                      100
                                  )
                                )
                              )}%`
                            }}
                          />
                        </div>
                        <span className="mt-1 block text-white/50">
                          {selectedAnimalData.instance.stamina}/{selectedAnimalData.stats.staminaCap}
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
                                    (selectedAnimalData.instance.life /
                                      selectedAnimalData.stats.lifeCap) *
                                      100
                                  )
                                )
                              )}%`
                            }}
                          />
                        </div>
                        <span className="mt-1 block text-white/50">
                          {selectedAnimalData.instance.life}/{selectedAnimalData.stats.lifeCap}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Danno</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedAnimalData.stats.damage}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Velocità</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedAnimalData.stats.attackSpeed}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Armatura</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedAnimalData.instance.armor ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                      <p className="uppercase text-white/40">Recupero</p>
                      {selectedAnimalData.readiness === "recovering" ? (
                        <p className="mt-1">
                          Mancano{" "}
                          <span className="font-semibold text-white">
                            {selectedAnimalData.missingStamina}
                          </span>{" "}
                          stamina - costo cibo{" "}
                          <span className="font-semibold text-white">
                            {selectedAnimalData.missingStamina}
                          </span>
                        </p>
                      ) : selectedAnimalData.readiness === "ready" ? (
                        <p className="mt-1 text-white/60">Pronto a combattere.</p>
                      ) : (
                        <p className="mt-1 text-white/60">
                          Dibattimento terminato: aspetta la prossima porta per recuperare.
                        </p>
                      )}
                      <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
                        1 cibo = 1 stamina
                      </p>
                    </div>

                    {selectedAnimalData.instance.size === "Small" &&
                    selectedAnimalData.config &&
                    selectedGrowthPreview ? (
                      <div className="space-y-2 text-xs text-white/70">
                        <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">
                          Crescita a adulto
                        </h3>
                        <p className="text-white/60">
                          Costo crescita:{" "}
                          <span className="font-semibold text-white">
                            {selectedAnimalData.config.growthFoodCost} cibo
                          </span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                            <p className="uppercase text-white/40">Statistiche attuali</p>
                            <ul className="mt-1 space-y-1 text-white/70">
                              <li>Vita {selectedAnimalData.stats.lifeCap}</li>
                              <li>Danno {selectedAnimalData.stats.damage}</li>
                              <li>Velocità {selectedAnimalData.stats.attackSpeed}</li>
                              <li>Stamina {selectedAnimalData.stats.staminaCap}</li>
                            </ul>
                          </div>
                          <div className="rounded-lg border border-amber-300/40 bg-amber-400/10 p-3">
                            <p className="uppercase text-amber-200">Forma adulta</p>
                            <ul className="mt-1 space-y-1 text-amber-100">
                              <li>Vita {selectedGrowthPreview.lifeCap}</li>
                              <li>Danno {selectedGrowthPreview.damage}</li>
                              <li>Velocità {selectedGrowthPreview.attackSpeed}</li>
                              <li>Stamina {selectedGrowthPreview.staminaCap}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {selectedAnimalData.config?.upgradableArmor ? (
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/40">
                        Può equipaggiare armature quando disponibili.
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={
                          selectedAnimalData.instance.stamina >= selectedAnimalData.stats.staminaCap ||
                          foodAvailable <= 0
                        }
                        onClick={() => handleFeed(selectedAnimalData.index)}
                        className="rounded-full border border-emerald-400 px-4 py-2 text-xs uppercase tracking-[0.35em] text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:border-emerald-900 disabled:text-emerald-900"
                      >
                        Nutri
                      </button>
                      {selectedAnimalData.instance.size === "Small" && selectedAnimalData.config ? (
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
                    const ammoAvailable = ammoInventory[config.ammoType] ?? 0;
                    const ammoRelative = Math.min(ammoAvailable, config.maxAmmo);
                    const ammoPercent =
                      config.maxAmmo > 0 ? Math.round((ammoRelative / config.maxAmmo) * 100) : 0;
                    const iconSrc = resolveWeaponIcon(config.displayName);

                    return (
                      <button
                        key={weapon.name}
                        type="button"
                        onClick={() => setSelectedWeapon(index)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#a67c52] bg-[#a67c52]/10"
                            : "border-white/10 bg-white/5 hover:border-[#a67c52]/60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icona arma con badge */}
                          <div className="flex-shrink-0 relative">
                            <img
                              src="/assets/armi/badge.png"
                              alt="badge"
                              className="h-14 w-14 object-contain"
                              draggable={false}
                            />
                            <img
                              src={iconSrc}
                              alt={config.displayName}
                              className="absolute inset-0 h-14 w-14 object-contain p-1"
                              draggable={false}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-sm text-white/80">
                              <span className="font-semibold text-white">{config.displayName}</span>
                              <span className="text-xs uppercase text-white/50">
                                {AMMO_LABELS[config.ammoType]}
                              </span>
                            </div>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-white/10">
                              <div
                                className="h-full"
                                style={{ backgroundColor: "#a67c52", width: `${Math.min(100, Math.max(0, ammoPercent))}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs uppercase text-white/60">
                              Disponibili:{" "}
                              <span className="font-semibold text-white">{ammoAvailable}</span>
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                {selectedWeaponData ? (
                  <div className="space-y-4 text-sm text-white/80">
                    {/* Icona e header */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 relative">
                        <img
                          src="/assets/armi/badge.png"
                          alt="badge"
                          className="h-24 w-24 object-contain"
                          draggable={false}
                        />
                        <img
                          src={resolveWeaponIcon(selectedWeaponData.config.displayName)}
                          alt={selectedWeaponData.config.displayName}
                          className="absolute inset-0 h-24 w-24 object-contain p-2"
                          draggable={false}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white">
                          {selectedWeaponData.config.displayName}
                        </h2>
                        <p className="text-xs uppercase text-white/50">
                          {AMMO_LABELS[selectedWeaponData.config.ammoType]}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="uppercase text-white/40">Munizioni disponibili</p>
                        <p className="text-lg font-semibold text-white">
                          {selectedWeaponData.ammoAvailable}
                        </p>
                        <p className="mt-1 text-[10px] uppercase text-white/40">
                          Max per attacco:{" "}
                          <span className="font-semibold text-white/70">
                            {selectedWeaponData.config.maxAmmo}
                          </span>
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
