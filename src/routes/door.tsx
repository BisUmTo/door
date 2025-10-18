import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AmmoKind, WeaponName } from "@/game/types";
import WeaponsPanel from "@/components/WeaponsPanel";
import AnimalsPanel from "@/components/AnimalsPanel";
import VictoryModal from "@/components/VictoryModal";
import DefeatModal from "@/components/DefeatModal";
const EMPTY_AMMO: Record<AmmoKind, number> = {
  bullets: 0,
  shells: 0,
  arrows: 0,
  darts: 0,
  grenades: 0
};
import { useGameStore } from "@/state/store";

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
  const upcomingEnemies = doorBattle
    ? doorBattle.enemies.slice(doorBattle.index + 1)
    : [];

  const animalConfigs = configs?.animals ?? [];
  const weaponConfigs = configs?.weapons ?? [];

  const currentEnemyConfig = useMemo(() => {
    if (!activeEnemy) return null;
    return animalConfigs.find((animal) => animal.id === activeEnemy.configId) ?? null;
  }, [animalConfigs, activeEnemy]);

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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-background to-black px-6 py-10 text-white">
      {battleResult === "victory" && pendingReward ? (
        <VictoryModal
          open
          loot={pendingReward.loot}
          weaponsUsed={pendingReward.weaponsUsed}
          fallenAnimals={pendingReward.fallenAnimals}
          animalConfigs={animalConfigs}
          weaponConfigs={weaponConfigs}
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

      <header className="flex items-center justify-between uppercase tracking-[0.4em] text-white/60">
        <span>Porta</span>
        <button
          type="button"
          onClick={() => navigate("/lobby")}
          className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest hover:border-accent hover:text-accent"
        >
          Torna alla lobby
        </button>
      </header>

      <main className="mt-10 flex flex-col gap-8">
        {doorBattle && activeEnemy && currentEnemyConfig ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-display uppercase tracking-[0.3em] text-accent">
                  {currentEnemyConfig.kind}
                </h2>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl bg-black/50 p-3">
                    <dt className="text-xs uppercase text-white/50">Vita</dt>
                    <dd className="text-lg font-semibold text-white">{activeEnemy.life}</dd>
                  </div>
                  <div className="rounded-xl bg-black/50 p-3">
                    <dt className="text-xs uppercase text-white/50">Danno</dt>
                    <dd className="text-lg font-semibold text-white">{currentEnemyConfig.damage}</dd>
                  </div>
                  <div className="rounded-xl bg-black/50 p-3">
                    <dt className="text-xs uppercase text-white/50">Velocita</dt>
                    <dd className="text-lg font-semibold text-white">
                      {currentEnemyConfig.attackSpeed}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-black/50 p-3">
                    <dt className="text-xs uppercase text-white/50">Taglia</dt>
                    <dd className="text-lg font-semibold text-white">{activeEnemy.size}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col items-end gap-3 text-sm text-white/70">
                <span className="uppercase text-white/50">Prossimi</span>
                <div className="flex gap-2">
                  {upcomingEnemies.length ? (
                    upcomingEnemies.map((enemy, index) => {
                      const config = animalConfigs.find((item) => item.id === enemy.configId);
                      return (
                        <span
                          key={`${enemy.configId}-${index}`}
                          className="rounded-lg bg-black/40 px-3 py-2 text-xs text-white/60"
                        >
                          {config?.kind ?? `#${enemy.configId}`}
                        </span>
                      );
                    })
                  ) : (
                    <span className="rounded-lg bg-black/40 px-3 py-2 text-xs text-white/60">
                      Ultimo
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setWeaponsOpen(true)}
                disabled={weaponsPhaseLocked}
                className="rounded-full border border-white/30 px-6 py-3 text-sm uppercase tracking-[0.3em] hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Armi
              </button>
              <button
                type="button"
                onClick={() => setAnimalsOpen(true)}
                className="rounded-full border border-white/30 px-6 py-3 text-sm uppercase tracking-[0.3em] hover:border-emerald-400 hover:text-emerald-300"
              >
                Animali
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
            {pendingReward ? "Ricompensa pronta da raccogliere." : "Nessun combattimento attivo."}
          </section>
        )}

        {save ? (
          <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm">
            <div className="flex justify-between">
              <span>Monete</span>
              <span className="font-semibold">{save.inventory.coins}</span>
            </div>
            <div className="flex justify-between">
              <span>Cibo</span>
              <span className="font-semibold">{save.inventory.food}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(save.inventory.ammo).map(([kind, qty]) => (
                <div
                  key={kind}
                  className="flex justify-between rounded bg-black/40 px-3 py-2 uppercase text-white/70"
                >
                  <span>{kind}</span>
                  <span className="font-semibold text-white">{qty}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
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
