import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AmmoKind, AnimalConfig, WeaponName } from "@/game/types";
import WeaponsPanel from "@/components/WeaponsPanel";
import AnimalsPanel from "@/components/AnimalsPanel";
import VictoryModal from "@/components/VictoryModal";
import DefeatModal from "@/components/DefeatModal";
import { useGameStore } from "@/state/store";
import { computeBattleStats, getAnimalReadiness } from "@/game/animals";

const EMPTY_AMMO: Record<AmmoKind, number> = {
  bullets: 0,
  shells: 0,
  arrows: 0,
  darts: 0,
  grenades: 0
};

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

  const animalConfigMap = useMemo(() => {
    const map = new Map<number, AnimalConfig>();
    for (const config of animalConfigs) {
      map.set(config.id, config);
    }
    return map;
  }, [animalConfigs]);

  const currentEnemyConfig = useMemo(() => {
    if (!activeEnemy) return null;
    return animalConfigMap.get(activeEnemy.configId) ?? null;
  }, [animalConfigMap, activeEnemy]);

  const enemyImageSrc = useMemo(
    () => resolveEnemyImage(currentEnemyConfig),
    [currentEnemyConfig]
  );

  const squadSummary = useMemo(() => {
    if (!save) {
      return { ready: 0, recovering: 0, fallen: 0, totalDamage: 0 };
    }
    return save.animals.owned.reduce(
      (acc, instance) => {
        const config = animalConfigMap.get(instance.configId);
        if (!config) return acc;
        const readiness = getAnimalReadiness(config, instance);
        if (readiness === "ready") {
          acc.ready += 1;
          acc.totalDamage += computeBattleStats(config, instance).damage;
        } else if (readiness === "recovering") {
          acc.recovering += 1;
        } else {
          acc.fallen += 1;
        }
        return acc;
      },
      { ready: 0, recovering: 0, fallen: 0, totalDamage: 0 }
    );
  }, [save, animalConfigMap]);

  const handleWeaponConfirm = (weaponName: WeaponName, ammoToSpend: number) => {
    resolveWeaponAttack(weaponName as any, ammoToSpend);
    setWeaponsOpen(false);
  };

  const handleAnimalDeploy = (index: number) => {
    resolveAnimalDuel(index);
    setAnimalsOpen(false);
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
      {/* SFONDO stile “di sempre” */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/assets/lobby/sfondo_lobby.png')] bg-cover bg-center blur" />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {battleResult === "victory" && pendingReward ? (
        <VictoryModal
          open
          loot={pendingReward.loot}
          weaponsUsed={pendingReward.weaponsUsed}
          fallenAnimals={pendingReward.fallenAnimals}
          animalConfigs={animalConfigs}
          weaponConfigs={weaponConfigs}
          medalUnlocked={pendingReward.medalUnlocked ?? null}
          houseObjects={save?.house.objects ?? []}
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
          Torna alla lobby
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

              {/* PROSSIMI NEMICI (a destra dell'icona su md+, sotto su mobile) */}
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

            {/* Statistiche PIÙ PICCOLE sotto l'icona */}
            {/* Statistiche 2x2 centrate e più compatte */}
{/* Statistiche 2x2 centrate e leggermente più grandi */}
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
        {activeEnemy.size === "Smmlll" ? "Baby" : "Adulto"}
      </dd>
    </div>
  </dl>
</div>
            {/* Pulsanti PIÙ IN BASSO */}
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

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-4">
              <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">Squadra</h3>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-emerald-100">
                  Pronti: {squadSummary.ready}
                </span>
                <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1 text-amber-100">
                  Recupero: {squadSummary.recovering}
                </span>
                <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-1 text-rose-100">
                  Ko: {squadSummary.fallen}
                </span>
                <span className="ml-auto rounded-full border border-white/20 px-4 py-1 text-white/70">
                  Danno combinato pronto: {squadSummary.totalDamage}
                </span>
              </div>
              <p className="mt-2 text-xs text-white/50">
                Gli animali possono essere schierati solo quando la stamina è al massimo.
              </p>
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
        <AnimalsPanel
          open={animalsOpen}
          animals={save?.animals.owned ?? []}
          configs={animalConfigs}
          onClose={() => setAnimalsOpen(false)}
          onDeploy={handleAnimalDeploy}
        />
      ) : null}
    </div>
  );
};

export default DoorRoute;
