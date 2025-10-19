import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AmmoKind, WeaponName, DoorType } from "@/game/types";
import WeaponsPanel from "@/components/WeaponsPanel";
import AnimalsPanel from "@/components/AnimalsPanel";
import VictoryModal from "@/components/VictoryModal";
import DefeatModal from "@/components/DefeatModal";
import { useGameStore } from "@/state/store";

/* ========= AMMO ========= */
const EMPTY_AMMO: Record<AmmoKind, number> = {
  bullets: 0,
  shells: 0,
  arrows: 0,
  darts: 0,
  grenades: 0
};

/* ========= SCENARI PER PORTA =========
   Assicurati che i file esistano in /assets/scenari/
   e che i nomi coincidano. */
const SCENARIO_BY_DOOR: Record<DoorType, string> = {
  white: "/assets/scenari/Stanza_bianca.png",
  black: "/assets/scenari/Stanza_nera.png",
  red: "/assets/scenari/Stanza_rossa.png",
  orange: "/assets/scenari/Stanza_arancione.png",
  yellow: "/assets/scenari/Stanza_gialla.png",
  purple: "/assets/scenari/Stanza_rosa.png",     // usa "viola.png" o il nome reale del file
  blue: "/assets/scenari/Stanza_blu.png",
  lightBlue: "/assets/scenari/Stanza_azzurra.png",
  brown: "/assets/scenari/Stanza_marrone.png",
  lime: "/assets/scenari/Stanza_lime.png",
  green: "/assets/scenari/Stanza_verde.png",
  neutral: "/assets/scenari/Stanza_neutrale.png"
};
const FALLBACK_SCENARIO = "/assets/scenari/Stanza_neutrale.png";

/* ========= Helpers immagine nemico ========= */
const ENEMY_IMG_BASE = "/assets/animali/icona";
const FALLBACK_ANIMAL_IMG = "/assets/ui/animal_placeholder.png"; // aggiungi in /public

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const resolveEnemyImage = (cfg: any): string | null => {
  if (!cfg) return null;
  if (cfg.image) return cfg.image;
  if (cfg.kind) return `${ENEMY_IMG_BASE}/${toSlug(cfg.kind)}.png`;
  if (cfg.id) return `${ENEMY_IMG_BASE}/${toSlug(String(cfg.id))}.png`;
  return null;
};
/* ========================================== */

const DoorRoute = () => {
  const navigate = useNavigate();
  const [weaponsOpen, setWeaponsOpen] = useState(false);
  const [animalsOpen, setAnimalsOpen] = useState(false);

  const {
    save,
    configs,
    pendingReward,
    battleResult,
    weaponsPhaseLocked,
    resolveWeaponAttack,
    resolveAnimalDuel,
    collectReward,
    resetBattleResult
  } = useGameStore((state) => ({
    save: state.save,
    configs: state.configs,
    pendingReward: state.pendingReward,
    battleResult: state.battleResult,
    weaponsPhaseLocked: state.weaponsPhaseLocked,
    resolveWeaponAttack: state.resolveWeaponAttack,
    resolveAnimalDuel: state.resolveAnimalDuel,
    collectReward: state.collectReward,
    resetBattleResult: state.resetBattleResult
  }));

  useEffect(() => {
    if (save === null) {
      navigate("/lobby", { replace: true });
    }
  }, [save, navigate]);

  const battle = save?.battleState;
  const doorBattle = battle?.door;
  const activeEnemy = doorBattle ? doorBattle.enemies[doorBattle.index] : null;
  const upcomingEnemies = doorBattle ? doorBattle.enemies.slice(doorBattle.index + 1) : [];

  const animalConfigs = configs?.animals ?? [];
  const weaponConfigs = configs?.weapons ?? [];

  const currentEnemyConfig = useMemo(() => {
    if (!activeEnemy) return null;
    return animalConfigs.find((animal) => animal.id === activeEnemy.configId) ?? null;
  }, [animalConfigs, activeEnemy]);

  const enemyImageSrc = useMemo(
    () => resolveEnemyImage(currentEnemyConfig),
    [currentEnemyConfig]
  );

  /* ======= Tipo porta corrente + scenario ======= */
  const doorType: DoorType = (battle?.door?.type ?? "neutral") as DoorType;
  const scenarioUrl = SCENARIO_BY_DOOR[doorType] ?? FALLBACK_SCENARIO;

  const handleWeaponConfirm = (weaponName: WeaponName, ammoToSpend: number) => {
    resolveWeaponAttack(weaponName as any, ammoToSpend);
    setWeaponsOpen(false);
  };

  const handleAnimalDeploy = (index: number) => {
    resolveAnimalDuel(index);
    setAnimalsOpen(false);
  };

  // Permetti di chiudere i menu con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (weaponsOpen) setWeaponsOpen(false);
        if (animalsOpen) setAnimalsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [weaponsOpen, animalsOpen]);
  
  // Helper per il custom overlay Animali (usato durante la battaglia)
  const animalsList = save?.animals.owned ?? [];
  const renderAnimalItem = (instance: any, idx: number) => {
    const cfg = animalConfigs.find((a) => a.id === instance.configId) ?? null;
    const name = cfg?.kind ?? `#${instance.configId}`;
    const img = resolveEnemyImage(cfg) ?? FALLBACK_ANIMAL_IMG;
    return (
      <button
        key={`${instance.configId}-${idx}`}
        type="button"
        onClick={() => handleAnimalDeploy(idx)}
        className="w-full flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left hover:border-[#a67c52]/60"
      >
        <img
          src={img}
          alt={name}
          className="h-12 w-12 rounded-md object-contain bg-black/20 p-1"
          draggable={false}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_ANIMAL_IMG;
          }}
        />
        <div className="flex-1 min-w-0 text-sm text-white/80">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white truncate">{name}</span>
            <span className="text-xs uppercase text-white/50">{instance.size === "Small" ? "Baby" : "Adulto"}</span>
          </div>
        </div>
      </button>
    );
  };

  const handleVictoryContinue = () => {
    collectReward();
    resetBattleResult();
    navigate("/lobby");
  };

  const handleDefeat = () => {
    resetBattleResult();
    navigate("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* 🔳 SFONDO SCENARIO in base al tipo di porta */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${scenarioUrl})` }}
        />
        {/* overlay scuro per leggibilità */}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {battleResult === "victory" && pendingReward && save ? (
        <VictoryModal
          open
          loot={pendingReward.loot}
          weaponsUsed={pendingReward.weaponsUsed}
          fallenAnimals={pendingReward.fallenAnimals}
          animalConfigs={animalConfigs}
          weaponConfigs={weaponConfigs}
          medalUnlocked={pendingReward.medalUnlocked ?? null}
          houseObjects={save.house.objects}
          onContinue={handleVictoryContinue}
        />
      ) : null}

      {battleResult === "defeat" && save ? (
        <DefeatModal
          open
          doorsOpened={save.progress.doorsOpened}
          onReturn={handleDefeat}
        />
      ) : null}

      <header className="flex items-center justify-between uppercase tracking-[0.4em] text-white/60 px-6 pt-10">
        <span>Porta</span>
        <button
          type="button"
          onClick={() => navigate("/lobby")}
          className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest transition hover:border-[#a67c52] hover:text-[#a67c52]"
        >
          Fuga (Torna alla lobby)
        </button>
      </header>

      <main className="mt-8 flex flex-col gap-8 px-6 pb-10">
        {doorBattle && activeEnemy && currentEnemyConfig ? (
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur">
            {/* Nome nemico */}
            <h2 className="text-3xl font-display uppercase tracking-[0.35em] text-[#a67c52]">
              {currentEnemyConfig.kind}
            </h2>

            {/* Icona + Prossimi a destra */}
            <div className="mt-9 flex flex-col items-center justify-center md:flex-row md:items-center md:justify-center gap-1">
              {/* ICONA GRANDE */}
              <div className="flex justify-center md:justify-start">
                <img
                  src={enemyImageSrc ?? FALLBACK_ANIMAL_IMG}
                  alt={currentEnemyConfig.kind}
                  className="h-64 w-64 md:h-72 md:w-72 object-contain drop-shadow"
                  draggable={false}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_ANIMAL_IMG;
                  }}
                />
              </div>

              {/* PROSSIMI NEMICI */}
              <div className="flex flex-col items-center md:items-end gap-3 text-sm text-white/70">
                <span className="uppercase text-white/50">Prossimi</span>
                <div className="flex flex-wrap justify-center md:justify-end gap-2">
                  {upcomingEnemies.length ? (
                    upcomingEnemies.map((enemy, index) => {
                      const cfg = animalConfigs.find((item) => item.id === enemy.configId);
                      return (
                        <span
                          key={`${enemy.configId}-${index}`}
                          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70"
                        >
                          {cfg?.kind ?? `#${enemy.configId}`}
                        </span>
                      );
                    })
                  ) : (
                    <span className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70">
                      Ultimo
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Statistiche 2x2 centrate */}
            <div className="mt-8 flex justify-center">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div className="w-40 rounded-xl border border-white/10 bg-black/50 p-3 text-center">
                  <dt className="text-sm uppercase text-white/60">Vita</dt>
                  <dd className="text-xl font-semibold text-white leading-tight">
                    {activeEnemy.life}
                  </dd>
                </div>
                <div className="w-40 rounded-xl border border-white/10 bg-black/50 p-3 text-center">
                  <dt className="text-sm uppercase text-white/60">Danno</dt>
                  <dd className="text-xl font-semibold text-white leading-tight">
                    {currentEnemyConfig.damage}
                  </dd>
                </div>
                <div className="w-40 rounded-xl border border-white/10 bg-black/50 p-3 text-center">
                  <dt className="text-sm uppercase text-white/60">Velocità</dt>
                  <dd className="text-xl font-semibold text-white leading-tight">
                    {currentEnemyConfig.attackSpeed}
                  </dd>
                </div>
                <div className="w-40 rounded-xl border border-white/10 bg-black/50 p-3 text-center">
                  <dt className="text-sm uppercase text-white/60">Età</dt>
                  <dd className="text-xl font-semibold text-white leading-tight">
                    {activeEnemy.size === "Small" ? "Baby" : "Adulto"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Pulsanti */}
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setWeaponsOpen(true)}
                disabled={weaponsPhaseLocked}
                className="rounded-full border border-[#a67c52] px-6 py-3 text-sm uppercase tracking-[0.3em] text-[#a67c52] transition hover:bg-[#a67c52]/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Armi
              </button>
              <button
                type="button"
                onClick={() => setAnimalsOpen(true)}
                className="rounded-full border border-[#a67c52] px-6 py-3 text-sm uppercase tracking-[0.3em] text-[#a67c52] transition hover:bg-[#a67c52]/10"
              >
                Animali
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 text-center text-sm text-white/70 shadow-xl backdrop-blur">
            {pendingReward ? "Ricompensa pronta da raccogliere." : "Nessun combattimento attivo."}
          </section>
        )}
      </main>

      {configs && battle?.active ? (
        <WeaponsPanel
          open={weaponsOpen}
          locked={weaponsPhaseLocked}
          weapons={save?.weapons ?? []}
          weaponConfigs={weaponConfigs}
          ammoInventory={save?.inventory.ammo ?? EMPTY_AMMO}
          onClose={() => setWeaponsOpen(false)}
          onConfirm={handleWeaponConfirm}
        />
      ) : null}

      {configs && battle?.active ? (
        // Se siamo in battaglia e il pannello Animali è aperto, usa un overlay custom
        animalsOpen && battle?.active ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setAnimalsOpen(false)}
            />
            {/* modal */}
            <div className="relative z-10 w-[min(720px,90%)] max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-sm uppercase text-white/60">Scegli un animale</h3>
                <button
                  type="button"
                  onClick={() => setAnimalsOpen(false)}
                  className="text-sm text-white/50 hover:text-white"
                >
                  Chiudi
                </button>
              </div>
              <div className="space-y-2 overflow-auto pr-2" style={{ maxHeight: "calc(80vh - 64px)" }}>
                {animalsList.length === 0 ? (
                  <p className="text-sm text-white/60">Nessun animale disponibile.</p>
                ) : (
                  animalsList.map((a, i) => renderAnimalItem(a, i))
                )}
              </div>
            </div>
          </div>
        ) : (
          <AnimalsPanel
            open={animalsOpen}
            animals={save?.animals.owned ?? []}
            configs={animalConfigs}
            onClose={() => setAnimalsOpen(false)}
            onDeploy={handleAnimalDeploy}
          />
        )
      ) : null}
    </div>
  );
};

export default DoorRoute;
