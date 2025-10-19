import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AmmoKind, WeaponName, DoorType, SaveGame, AnimalConfig } from "@/game/types";
import WeaponsPanel from "@/components/WeaponsPanel";
import AnimalsPanel from "@/components/AnimalsPanel";
import VictoryModal from "@/components/VictoryModal";
import DefeatModal from "@/components/DefeatModal";
import { useGameStore, type CurrentDuelSummary } from "@/state/store";
import {
  getAnimalReadiness,
  getDisplayBattleStats,
  getMissingStamina,
  type AnimalReadiness
} from "@/game/animals";

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

interface DecoratedAnimalEntry {
  index: number;
  name: string;
  readiness: AnimalReadiness;
  missingStamina: number;
  life: number;
  lifeCap: number;
  damage: number;
  attackSpeed: number;
  armor: number;
  staminaPercent: number;
  lifePercent: number;
  config: AnimalConfig | null;
  instance: SaveGame["animals"]["owned"][number];
}

const READINESS_META: Record<AnimalReadiness, { label: string; description: string; tone: string }> = {
  ready: {
    label: "Pronto",
    description: "Stamina al massimo.",
    tone: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
  },
  recovering: {
    label: "In recupero",
    description: "L'animale sta recuperando stamina.",
    tone: "border-amber-300/40 bg-amber-400/10 text-amber-200"
  },
  fallen: {
    label: "Ko",
    description: "Questo animale è fuori combattimento.",
    tone: "border-rose-400/40 bg-rose-500/10 text-rose-200"
  }
};

const READINESS_ORDER: Record<AnimalReadiness, number> = {
  ready: 0,
  recovering: 1,
  fallen: 2
};

const DamageBubble = ({
  side,
  amount
}: {
  side: "player" | "enemy";
  amount: number;
}) => {
  const [stage, setStage] = useState<"idle" | "show" | "hide">("idle");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setStage("show"));
    const hideTimer = setTimeout(() => setStage("hide"), 450);
    const cleanup = setTimeout(() => setStage("idle"), 650);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(hideTimer);
      clearTimeout(cleanup);
    };
  }, []);

  const base = "pointer-events-none absolute transition-all duration-300 text-sm font-semibold px-3 py-1 rounded-full shadow-lg";
  const palette =
    side === "enemy"
      ? "bg-emerald-500/90 text-black border border-emerald-300/80"
      : "bg-rose-500/90 text-white border border-rose-300/80";
  const alignment = side === "enemy" ? "right-6" : "left-6";

  const motion =
    stage === "show"
      ? "-translate-y-6 opacity-100 scale-105"
      : stage === "hide"
        ? "-translate-y-8 opacity-0 scale-95"
        : "opacity-0 translate-y-0 scale-90";

  return (
    <div className={`${base} ${palette} ${alignment} ${motion}`}>
      -{amount}
    </div>
  );
};

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
    resetBattleResult,
    currentDuel,
    clearCurrentDuel
  } = useGameStore((state) => ({
    save: state.save,
    configs: state.configs,
    pendingReward: state.pendingReward,
    battleResult: state.battleResult,
    weaponsPhaseLocked: state.weaponsPhaseLocked,
    resolveWeaponAttack: state.resolveWeaponAttack,
    resolveAnimalDuel: state.resolveAnimalDuel,
    collectReward: state.collectReward,
    resetBattleResult: state.resetBattleResult,
    currentDuel: state.currentDuel,
    clearCurrentDuel: state.clearCurrentDuel
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

  /* ======= Tipo porta corrente + scenario ======= */
  const doorType: DoorType = (battle?.door?.type ?? "neutral") as DoorType;
  const scenarioUrl = SCENARIO_BY_DOOR[doorType] ?? FALLBACK_SCENARIO;

  const [lastDeployedAnimalIndex, setLastDeployedAnimalIndex] = useState<number | null>(null);
  const [eventIndex, setEventIndex] = useState<number>(-1);
  const [eventsComplete, setEventsComplete] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [shouldAutoOpenAnimals, setShouldAutoOpenAnimals] = useState(false);
  const [enemyEntering, setEnemyEntering] = useState(false);
  const enemyIndexRef = useRef<number | null>(battle?.door?.index ?? null);

  useEffect(() => {
    if (!currentDuel) {
      setEventIndex(-1);
      setEventsComplete(false);
      setShowResultModal(false);
      return;
    }
    setLastDeployedAnimalIndex(currentDuel.playerAnimalIndex);
    setShouldAutoOpenAnimals(currentDuel.playerLifeEnd <= 0);
    setEventIndex(-1);
    setEventsComplete(false);
    setShowResultModal(false);
  }, [currentDuel]);

  useEffect(() => {
    if (!currentDuel) return;
    if (!currentDuel.log.length) {
      setEventsComplete(true);
      return;
    }
    if (eventIndex === -1) {
      const kickoff = setTimeout(() => setEventIndex(0), 250);
      return () => clearTimeout(kickoff);
    }
    if (eventIndex >= currentDuel.log.length - 1) {
      const finishTimer = setTimeout(() => setEventsComplete(true), 450);
      return () => clearTimeout(finishTimer);
    }
    const timer = setTimeout(() => setEventIndex((prev) => prev + 1), 650);
    return () => clearTimeout(timer);
  }, [currentDuel, eventIndex]);

  useEffect(() => {
    if (!eventsComplete || !currentDuel) return;
    const timer = setTimeout(() => setShowResultModal(true), 300);
    return () => clearTimeout(timer);
  }, [eventsComplete, currentDuel]);

  useEffect(() => {
    if (!battle?.active) {
      setLastDeployedAnimalIndex(null);
    }
  }, [battle?.active]);

  useEffect(() => {
    if (currentDuel) {
      return;
    }
    const currentIndex = doorBattle?.index ?? null;
    let frame: number | null = null;
    let finishFrame: number | null = null;
    if (
      enemyIndexRef.current !== null &&
      currentIndex !== null &&
      currentIndex !== enemyIndexRef.current
    ) {
      setEnemyEntering(true);
      frame = requestAnimationFrame(() => {
        finishFrame = requestAnimationFrame(() => setEnemyEntering(false));
      });
    }
    enemyIndexRef.current = currentIndex;
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (finishFrame) cancelAnimationFrame(finishFrame);
    };
  }, [doorBattle?.index, currentDuel]);

  const handleWeaponConfirm = (weaponName: WeaponName, ammoToSpend: number) => {
    resolveWeaponAttack(weaponName as any, ammoToSpend);
    setWeaponsOpen(false);
  };

  const handleAnimalDeploy = (index: number) => {
    resolveAnimalDuel(index);
    setAnimalsOpen(false);
  };

  const handleDuelOutcomeAcknowledge = () => {
    setShowResultModal(false);
    setEventsComplete(false);
    setEventIndex(-1);
    const shouldOpen = shouldAutoOpenAnimals;
    setShouldAutoOpenAnimals(false);
    clearCurrentDuel();
    if (shouldOpen) {
      setAnimalsOpen(true);
    }
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

  const getAnimalConfig = useCallback(
    (id: number) => animalConfigs.find((animal) => animal.id === id) ?? null,
    [animalConfigs]
  );

  const decoratedAnimals = useMemo<DecoratedAnimalEntry[]>(() => {
    return animalsList.map((instance, index) => {
      const config = getAnimalConfig(instance.configId);
      const stats = getDisplayBattleStats(config, instance);
      const readiness = getAnimalReadiness(config, instance);
      const staminaPercent =
        stats.staminaCap > 0
          ? Math.round((Math.max(0, instance.stamina) / stats.staminaCap) * 100)
          : 0;
      const lifePercent =
        stats.lifeCap > 0 ? Math.round((Math.max(0, instance.life) / stats.lifeCap) * 100) : 0;
      return {
        index,
        name: config?.kind ?? `#${instance.configId}`,
        readiness,
        missingStamina: getMissingStamina(config, instance),
        life: instance.life,
        lifeCap: stats.lifeCap,
        damage: stats.damage,
        attackSpeed: stats.attackSpeed,
        armor: instance.armor ?? 0,
        staminaPercent,
        lifePercent,
        config,
        instance
      };
    });
  }, [animalsList, getAnimalConfig]);

  const sortedAnimalsList = useMemo(() => {
    return [...decoratedAnimals].sort((a, b) => {
      const order = READINESS_ORDER[a.readiness] - READINESS_ORDER[b.readiness];
      if (order !== 0) return order;
      return b.lifePercent - a.lifePercent;
    });
  }, [decoratedAnimals]);

  const renderAnimalItem = (entry: DecoratedAnimalEntry) => {
    const { config, instance, readiness } = entry;
    const img = resolveEnemyImage(config) ?? FALLBACK_ANIMAL_IMG;
    const isKO = readiness === "fallen" || !instance.alive;
    const cannotDeploy = readiness !== "ready";
    const meta = READINESS_META[readiness];

    return (
      <div
        key={`${instance.configId}-${entry.index}`}
        className={`w-full flex gap-4 rounded-lg border ${
          isKO ? "border-red-900/30 bg-black/50" : "border-white/10 bg-black/30"
        } p-4`}
      >
        <div className="relative">
          <img
            src={img}
            alt={entry.name}
            className={`h-20 w-20 rounded-lg object-contain bg-black/20 p-1 ${
              isKO ? "opacity-50" : ""
            }`}
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_ANIMAL_IMG;
            }}
          />
          {isKO && (
            <div className="absolute top-1 right-1 bg-red-500/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
              KO
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`font-semibold text-lg truncate ${
              isKO ? "text-white/50" : "text-white"
            }`}>
              {entry.name}
            </span>
            <span className="text-sm uppercase text-white/50">
              {instance.size === "Small" ? "Baby" : "Adulto"}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md bg-black/30 px-3 py-1.5">
              <div className="text-white/60">Vita</div>
              <div className={`font-medium ${
                isKO ? "text-red-500" : "text-white"
              }`}>
                {instance.life}/{entry.lifeCap}
              </div>
            </div>
            <div className="rounded-md bg-black/30 px-3 py-1.5">
              <div className="text-white/60">Danno</div>
              <div className="font-medium text-white">{entry.damage}</div>
            </div>
            <div className="rounded-md bg-black/30 px-3 py-1.5">
              <div className="text-white/60">Velocità</div>
              <div className="font-medium text-white">{entry.attackSpeed}</div>
            </div>
          </div>

          {!isKO && (
            <button
              type="button"
              onClick={() => handleAnimalDeploy(entry.index)}
              disabled={cannotDeploy}
              className={`mt-3 w-full rounded-md border px-4 py-1.5 text-sm font-medium transition ${
                cannotDeploy
                  ? "border-white/20 text-white/40 cursor-not-allowed"
                  : "border-[#a67c52] text-[#a67c52] hover:bg-[#a67c52]/10"
              }`}
            >
              {cannotDeploy ? meta.label : "Schiera"}
            </button>
          )}

          {cannotDeploy && (
            <p className="mt-2 text-xs text-white/60">
              {readiness === "recovering"
                ? `Mancano ${entry.missingStamina} stamina per combattere.`
                : "Questo animale è fuori combattimento."}
            </p>
          )}
        </div>
      </div>
    );
  };

  const activePlayerIndex = currentDuel
    ? currentDuel.playerAnimalIndex
    : lastDeployedAnimalIndex;
  const activePlayerInstance =
    activePlayerIndex !== null ? animalsList[activePlayerIndex] ?? null : null;
  const activePlayerConfig = currentDuel
    ? getAnimalConfig(currentDuel.playerConfigId)
    : activePlayerInstance
      ? getAnimalConfig(activePlayerInstance.configId)
      : null;
  const activePlayerStats =
    activePlayerInstance && activePlayerConfig
      ? getDisplayBattleStats(activePlayerConfig, activePlayerInstance)
      : null;

  const duelEnemyConfig = currentDuel ? getAnimalConfig(currentDuel.enemyConfigId) : null;
  const duelEnemyInstance =
    currentDuel && battle?.door
      ? battle.door.enemies[currentDuel.enemyIndex] ?? null
      : null;
  const displayedEnemy = currentDuel ? duelEnemyInstance ?? null : activeEnemy;
  const displayedEnemyConfig = currentDuel ? duelEnemyConfig : currentEnemyConfig;

  const activeEvent =
    currentDuel && eventIndex >= 0 && currentDuel.log.length
      ? currentDuel.log[Math.min(eventIndex, currentDuel.log.length - 1)]
      : null;

  const playerLifeDisplay = currentDuel
    ? Math.max(
        0,
        eventIndex >= 0 && currentDuel.log.length
          ? currentDuel.log[Math.min(eventIndex, currentDuel.log.length - 1)].playerLifeAfter
          : currentDuel.playerLifeStart
      )
    : Math.max(0, activePlayerInstance?.life ?? 0);

  const playerLifeCap =
    activePlayerStats?.lifeCap ??
    (currentDuel
      ? Math.max(
          currentDuel.playerLifeStart,
          activePlayerConfig?.life ?? currentDuel.playerLifeStart
        )
      : playerLifeDisplay);

  const enemyLifeDisplay = currentDuel
    ? Math.max(
        0,
        eventIndex >= 0 && currentDuel.log.length
          ? currentDuel.log[Math.min(eventIndex, currentDuel.log.length - 1)].enemyLifeAfter
          : currentDuel.enemyLifeStart
      )
    : Math.max(0, activeEnemy?.life ?? 0);

  const enemyLifeCap =
    currentDuel
      ? Math.max(currentDuel.enemyLifeStart, displayedEnemyConfig?.life ?? currentDuel.enemyLifeStart)
      : Math.max(0, displayedEnemyConfig?.life ?? activeEnemy?.life ?? 0);

  const defenderSide = activeEvent
    ? activeEvent.attacker === "player"
      ? "enemy"
      : "player"
    : null;

  const playerLifePercent =
    playerLifeCap > 0 ? Math.round((playerLifeDisplay / playerLifeCap) * 100) : 0;
  const enemyLifePercent =
    enemyLifeCap > 0 ? Math.round((enemyLifeDisplay / enemyLifeCap) * 100) : 0;
  const currentRound = activeEvent?.round ?? null;
  const enemyCardEntering = enemyEntering && !currentDuel;
  const playerImageSrc = resolveEnemyImage(activePlayerConfig) ?? FALLBACK_ANIMAL_IMG;
  const enemyImageForCard = resolveEnemyImage(displayedEnemyConfig) ?? FALLBACK_ANIMAL_IMG;
  const playerName =
    activePlayerConfig?.kind ?? (activePlayerInstance ? `#${activePlayerInstance.configId}` : "Nessun animale");
  const enemyName =
    displayedEnemyConfig?.kind ?? (displayedEnemy ? `#${displayedEnemy.configId}` : "Nessun avversario");
  const playerSizeLabel = activePlayerInstance
    ? activePlayerInstance.size === "Small"
      ? "Baby"
      : "Adulto"
    : "—";
  const enemySizeLabel = currentDuel
    ? currentDuel.enemySize === "Small"
      ? "Baby"
      : "Adulto"
    : displayedEnemy
      ? displayedEnemy.size === "Small"
        ? "Baby"
        : "Adulto"
      : "—";
  const playerDamage = activePlayerStats?.damage ?? activePlayerConfig?.damage ?? 0;
  const playerSpeed = activePlayerStats?.attackSpeed ?? activePlayerConfig?.attackSpeed ?? 0;
  const playerArmorValue = activePlayerInstance?.armor ?? 0;
  const enemyDamage = displayedEnemyConfig?.damage ?? 0;
  const enemySpeed = displayedEnemyConfig?.attackSpeed ?? 0;

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
        {doorBattle ? (
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Scontro</p>
                <h2 className="text-3xl font-display uppercase tracking-[0.35em] text-[#a67c52]">
                  {enemyName}
                </h2>
              </div>
              {currentDuel ? (
                <div className="flex flex-col items-start gap-1 text-[10px] uppercase tracking-[0.35em] text-white/50 md:items-end">
                  <span>Round {currentRound ?? currentDuel.log.length}</span>
                  <span>
                    {activeEvent
                      ? activeEvent.attacker === "player"
                        ? "Turno del giocatore"
                        : "Turno dell'avversario"
                      : "Risoluzione"}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 transition-all duration-300 ${
                  defenderSide === "player" ? "ring-2 ring-rose-400/70 shadow-lg shadow-rose-500/30" : ""
                }`}
              >
                {defenderSide === "player" && activeEvent && activeEvent.damage > 0 ? (
                  <DamageBubble key={`player-${eventIndex}`} side="player" amount={activeEvent.damage} />
                ) : null}
                {activePlayerInstance && activePlayerConfig ? (
                  <>
                    <div className="flex items-center gap-4">
                      <img
                        src={playerImageSrc}
                        alt={playerName}
                        className="h-24 w-24 rounded-lg object-contain bg-black/20 p-2"
                        draggable={false}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_ANIMAL_IMG;
                        }}
                      />
                      <div>
                        <p className="text-xs uppercase text-white/50">Il tuo animale</p>
                        <h3 className="text-xl font-semibold text-white">{playerName}</h3>
                        <span className="text-xs uppercase text-white/40">{playerSizeLabel}</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4 text-sm">
                      <div>
                        <div className="flex items-center justify-between text-xs uppercase text-white/50">
                          <span>Vita</span>
                          <span>
                            {playerLifeDisplay}/{playerLifeCap}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded bg-white/10">
                          <div
                            className="h-full rounded bg-emerald-400"
                            style={{ width: `${Math.min(100, Math.max(0, playerLifePercent))}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs uppercase text-white/60">
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                          <span>Danno</span>
                          <p className="mt-1 text-lg font-semibold text-white">{playerDamage}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                          <span>Velocità</span>
                          <p className="mt-1 text-lg font-semibold text-white">{playerSpeed}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                          <span>Armatura</span>
                          <p className="mt-1 text-lg font-semibold text-white">{playerArmorValue}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-white/60">
                    <p>Nessun animale schierato.</p>
                    <p className="text-xs">Apri il pannello animali per scegliere un combattente.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center gap-2 text-xs uppercase tracking-[0.4em] text-white/60">
                <span>Vs</span>
                {currentDuel ? (
                  <span className="text-[10px] text-white/40">
                    {activeEvent
                      ? activeEvent.attacker === "player"
                        ? "Attacco del giocatore"
                        : "Attacco dell'avversario"
                      : "Simulazione"}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/40">In attesa</span>
                )}
              </div>

              <div
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 transition-opacity duration-500 ${
                  defenderSide === "enemy" ? "ring-2 ring-emerald-400/70 shadow-lg shadow-emerald-500/30" : ""
                } ${enemyCardEntering ? "opacity-0" : "opacity-100"}`}
              >
                {defenderSide === "enemy" && activeEvent && activeEvent.damage > 0 ? (
                  <DamageBubble key={`enemy-${eventIndex}`} side="enemy" amount={activeEvent.damage} />
                ) : null}
                <div className="flex items-center gap-4">
                  <img
                    src={enemyImageForCard}
                    alt={enemyName}
                    className="h-24 w-24 rounded-lg object-contain bg-black/20 p-2"
                    draggable={false}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_ANIMAL_IMG;
                    }}
                  />
                  <div>
                    <p className="text-xs uppercase text-white/50">Avversario</p>
                    <h3 className="text-xl font-semibold text-white">{enemyName}</h3>
                    <span className="text-xs uppercase text-white/40">{enemySizeLabel}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <div className="flex items-center justify-between text-xs uppercase text-white/50">
                      <span>Vita</span>
                      <span>
                        {enemyLifeDisplay}/{enemyLifeCap}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded bg-white/10">
                      <div
                        className="h-full rounded bg-rose-400"
                        style={{ width: `${Math.min(100, Math.max(0, enemyLifePercent))}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs uppercase text-white/60">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                      <span>Danno</span>
                      <p className="mt-1 text-lg font-semibold text-white">{enemyDamage}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                      <span>Velocità</span>
                      <p className="mt-1 text-lg font-semibold text-white">{enemySpeed}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                      <span>Armatura</span>
                      <p className="mt-1 text-lg font-semibold text-white">0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-[0.35em] text-white/50">Prossimi nemici</h3>
                <div className="mt-3 flex flex-wrap gap-2">
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
                      Ultimo avversario
                    </span>
                  )}
                </div>
              </div>
              {currentDuel ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70 md:max-w-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Esito parziale</p>
                  <p className="mt-2">
                    {activeEvent
                      ? activeEvent.attacker === "player"
                        ? `Il tuo animale infligge ${activeEvent.damage} danni.`
                        : `L'avversario infligge ${activeEvent.damage} danni.`
                      : currentDuel.winner === "player"
                        ? "Scontro vinto."
                        : "Scontro in corso."}
                  </p>
                </div>
              ) : null}
            </div>

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

      {showResultModal && currentDuel ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/80 p-6 text-center">
            <h3 className="text-xl font-semibold text-white">Scontro concluso</h3>
            <p className="mt-3 text-sm text-white/70">
              {currentDuel.winner === "player"
                ? "Il tuo animale ha vinto lo scontro."
                : "L'avversario ha vinto questo scontro."}
            </p>
            {currentDuel.playerLifeEnd <= 0 ? (
              <p className="mt-2 text-sm text-rose-300">
                Il tuo animale è stato sconfitto. Scegline un altro per continuare.
              </p>
            ) : null}
            {currentDuel.enemyLifeEnd <= 0 ? (
              <p className="mt-2 text-sm text-emerald-300">
                L'avversario è stato battuto!
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleDuelOutcomeAcknowledge}
              className="mt-5 inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm uppercase tracking-[0.3em] text-white transition hover:border-[#a67c52] hover:text-[#a67c52]"
            >
              Continua
            </button>
          </div>
        </div>
      ) : null}

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
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setAnimalsOpen(false)}
            />
            <div className="relative z-10 w-[min(800px,90%)] max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">I tuoi animali</h3>
                <button
                  type="button"
                  onClick={() => setAnimalsOpen(false)}
                  className="text-sm text-white/50 hover:text-white"
                >
                  Chiudi
                </button>
              </div>
              <div className="space-y-3 overflow-auto pr-2" style={{ maxHeight: "calc(85vh - 100px)" }}>
                {sortedAnimalsList.length === 0 ? (
                  <p className="text-sm text-white/60">Nessun animale disponibile.</p>
                ) : (
                  sortedAnimalsList.map((entry) => renderAnimalItem(entry))
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
