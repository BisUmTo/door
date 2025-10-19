import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import P5Scene, { type SceneConfig, type SceneElementConfig } from "@/components/P5Scene";
import Tooltip from "@/components/Tooltip";
import { useGameStore } from "@/state/store";
import type { SaveGame } from "@/game/types";

const HOUSE_IMAGE_WIDTH = 1785;
const HOUSE_IMAGE_HEIGHT = 1004;

type HouseAreaId = "bacheca" | "incubatrice" | "porta";

interface HouseAreaConfig {
  id: HouseAreaId;
  label: string;
  hitboxPath: string;
  image: string;
  selectedImage: string;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  labelPosition: {
    x: number;
    y: number;
  };
  zIndex: number;
}

const houseAreas: HouseAreaConfig[] = [
  {
    id: "bacheca",
    label: "Bacheca",
    hitboxPath: "/assets/casa/pulsanti/bacheca.json",
    image: "/assets/casa/pulsanti/bacheca.png",
    selectedImage: "/assets/casa/pulsanti/bacheca_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: HOUSE_IMAGE_WIDTH,
      height: HOUSE_IMAGE_HEIGHT
    },
    labelPosition: { x: 342, y: 170 },
    zIndex: 10
  },
  {
    id: "incubatrice",
    label: "Incubatrice",
    hitboxPath: "/assets/casa/pulsanti/incubatrice.json",
    image: "/assets/casa/pulsanti/incubatrice.png",
    selectedImage: "/assets/casa/pulsanti/incubatrice_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: HOUSE_IMAGE_WIDTH,
      height: HOUSE_IMAGE_HEIGHT
    },
    labelPosition: { x: 389, y: 665 },
    zIndex: 12
  },
  {
    id: "porta",
    label: "Lobby",
    hitboxPath: "/assets/casa/pulsanti/porta.json",
    image: "/assets/casa/pulsanti/porta.png",
    selectedImage: "/assets/casa/pulsanti/porta_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: HOUSE_IMAGE_WIDTH,
      height: HOUSE_IMAGE_HEIGHT
    },
    labelPosition: { x: 925, y: 830 },
    zIndex: 8
  }
];

const objectLayouts: Record<number, { x: number; y: number; width: number; height: number }> = {
  1: { x: 1300, y: 400, width: 260, height: 220 },
  2: { x: 1330, y: 50, width: 220, height: 240 },
  3: { x: 1180, y: 680, width: 340, height: 220 },
  4: { x: 400, y: 800, width: 220, height: 210 }
};

const furnitureStageOverrides: Record<string, number> = {
  poltrona: 1,
  mensola: 4,
  tavolino: 3,
  sedie: 2,
  lampada: 1,
  orologio: 1,
  tappeto: 1,
  tavolo: 1
};

const normalizeFurnitureKey = (value: string) => {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return base.length > 0 ? base : "arredamento";
};

const resolveFurnitureAsset = (
  object: SaveGame["house"]["objects"][number]
): { key: string; maxStage: number } => {
  const key = normalizeFurnitureKey(object.name);
  const override = furnitureStageOverrides[key];
  const fallback = Number.isFinite(object.piecesNeeded) ? object.piecesNeeded : 0;
  const maxStage = Math.max(0, override ?? Math.max(0, Math.round(fallback)));
  return { key, maxStage };
};

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const HouseRoute = () => {
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"none" | "bacheca" | "incubatrice">("none");
  const [hoveredAreas, setHoveredAreas] = useState<Record<HouseAreaId, boolean>>({
    bacheca: false,
    incubatrice: false,
    porta: false
  });

  const visibleObjects = useMemo(() => {
    if (!save) return [];
    return save.house.objects;
  }, [save]);

  const selectedObject = visibleObjects.find((object) => object.id === selectedId) ?? null;

  const handleHoverChange = useCallback((areaId: HouseAreaId, hovered: boolean) => {
    setHoveredAreas((previous) => {
      if ((previous[areaId] ?? false) === hovered) return previous;
      return { ...previous, [areaId]: hovered };
    });
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel("none");
    setSelectedId(null);
  }, []);

  const handleAreaClick = useCallback(
    (areaId: HouseAreaId) => {
      if (areaId === "porta") {
        navigate("/lobby");
        return;
      }
      if (areaId === "bacheca") {
        navigate("/medals");
        return;
      }
      if (areaId === "incubatrice") {
        setActivePanel("incubatrice");
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (activePanel !== "none") {
      setHoveredAreas({ bacheca: false, incubatrice: false, porta: false });
    }
  }, [activePanel]);

  const sceneConfig = useMemo<SceneConfig>(() => {
    const furnitureElements: SceneElementConfig[] = visibleObjects.map((object, index) => {
      const { key: assetKey, maxStage } = resolveFurnitureAsset(object);
      const clampedMax = Math.max(0, maxStage);
      const collectedPieces = Math.max(0, object.piecesOwned);
      const stage = object.unlocked ? clampedMax : Math.min(clampedMax, collectedPieces);

      return {
        id: `furniture-${object.id}`,
        image: `/assets/casa/arredamento/${assetKey}_${stage}.png`,
        layout: {
          x: 0,
          y: 0,
          width: HOUSE_IMAGE_WIDTH,
          height: HOUSE_IMAGE_HEIGHT
        },
        zIndex: 2 + index
      };
    });

    const areaElements: SceneElementConfig[] = houseAreas.map((area) => ({
      id: area.id,
      image: area.image,
      selectedImage: area.selectedImage,
      hitboxPath: area.hitboxPath,
      layout: area.layout,
      zIndex: area.zIndex,
      onClick: () => handleAreaClick(area.id),
      onHoverChange: (hovered) => handleHoverChange(area.id, hovered)
    }));

    return {
      baseWidth: HOUSE_IMAGE_WIDTH,
      baseHeight: HOUSE_IMAGE_HEIGHT,
      backgroundImage: "/assets/casa/sfondo_casa.png",
      elements: [...furnitureElements, ...areaElements]
    };
  }, [handleAreaClick, handleHoverChange, visibleObjects]);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#080910] text-white">
      {/* Header overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50">
        <div className="group/header relative h-8 w-full pointer-events-auto">
          <div
            className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-3 bg-[#0b3a6f]/90 text-whit border-b border-white/10 backdrop-blur transition-all duration-300 ease-out  opacity-0 -translate-y-full  group-hover/header:opacity-100 group-hover/header:translate-y-0  pointer-events-auto"
          >
            <span className="text-xs uppercase tracking-[0.4em]">Casa</span>
            <button
              type="button"
              onClick={() => navigate("/lobby")}
              className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest transition hover:border-[#a67c52] hover:text-[#a67c52]"
            >
              Lobby
            </button>
          </div>
        </div>
      </div>

      {/* Scena FULL SCREEN (riempie tutto lo spazio rimanente) */}
      <main className="relative flex-1">
        <div className="absolute inset-0">
          {/* Contenitore a schermo pieno per P5 */}
          <div className="relative w-screen h-full overflow-hidden">
            <P5Scene config={sceneConfig} className="w-full h-full" />

            {/* Overlay oggetti */}
            <div className="absolute inset-0">
              {visibleObjects.map((object) => {
                const layout = objectLayouts[object.id];
                const left = layout ? toPercent(layout.x, HOUSE_IMAGE_WIDTH) : "50%";
                const top = layout ? toPercent(layout.y, HOUSE_IMAGE_HEIGHT) : "85%";
                const progress = object.piecesNeeded
                  ? Math.round((object.piecesOwned / object.piecesNeeded) * 100)
                  : 0;
                const unlocked = object.unlocked;
                const isSelected = selectedId === object.id;

                return (
                  <div key={object.id} className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left,
                        top
                      }}
                    >
                      <button
                        type="button"
                        disabled={activePanel !== "none"}
                        onClick={() => setSelectedId(object.id)}
                        className={`pointer-events-auto flex min-w-[200px] flex-col gap-2 rounded-2xl border px-4 py-3 text-left backdrop-blur-sm transition ${
                          unlocked
                            ? "border-emerald-400/60 bg-emerald-500/20"
                            : "border-white/20 bg-black/60"
                        } ${isSelected ? "ring-2 ring-[#a67c52]" : ""} disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white">
                          {object.name}
                        </span>
                        <span className="text-xs uppercase text-white/70">
                          {object.piecesOwned}/{object.piecesNeeded} pezzi
                        </span>
                        <div className="h-1.5 w-full overflow-hidden rounded bg-white/15">
                          <div
                            className={`h-full ${unlocked ? "bg-emerald-400" : "bg-white/50"}`}
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.3em] text-white/60">
                          {unlocked ? "Bonus attivo" : `${progress}% completato`}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overlay etichette aree */}
            <div className="pointer-events-none absolute inset-0">
              {houseAreas.map((area) => {
                const hovered = hoveredAreas[area.id];
                const highlight = area.id === "bacheca" && save?.medals.highlighted;
                return (
                  <div
                    key={`label-${area.id}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: toPercent(area.labelPosition.x, HOUSE_IMAGE_WIDTH),
                      top: toPercent(area.labelPosition.y, HOUSE_IMAGE_HEIGHT)
                    }}
                  >
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.35em] ${
                        highlight
                          ? "border-yellow-300 bg-yellow-400/20 text-yellow-200"
                          : hovered
                          ? "border-[#a67c52] bg-black/70 text-[#a67c52]"
                          : "border-white/30 bg-black/60 text-white"
                      }`}
                    >
                      {area.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Modale Bacheca */}
      {activePanel === "bacheca" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="relative w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#111522]/95 p-6 shadow-xl">
            <button
              type="button"
              onClick={closePanel}
              className="absolute right-6 top-6 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.4em] text-white/80 transition hover:border-[#a67c52] hover:text-[#a67c52]"
            >
              Chiudi
            </button>
            <h2 className="text-xl font-semibold uppercase tracking-[0.4em] text-white/80">
              Bacheca delle Medaglie
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Esplora la collezione di oggetti sbloccati nella tua casa.
            </p>

            {visibleObjects.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
                Trova pezzi nell&apos;avventura per iniziare ad arredare la casa.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleObjects.map((object) => (
                  <button
                    key={object.id}
                    type="button"
                    onClick={() => setSelectedId(object.id)}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[#a67c52] hover:text-[#a67c52]"
                  >
                    <span className="text-lg font-semibold text-white">{object.name}</span>
                    <div className="mt-2 text-xs uppercase text-white/60">
                      <span className="block">
                        {object.piecesOwned}/{object.piecesNeeded} pezzi
                      </span>
                      <span className="block">
                        {object.unlocked ? "Completato" : "Incompleto"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedObject ? (
              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm">
                <Tooltip
                  title={selectedObject.name}
                  description={
                    selectedObject.unlocked
                      ? `Bonus ogni ${selectedObject.bonus.turnsCooldown} turni`
                      : undefined
                  }
                />
                {selectedObject.unlocked ? (
                  <div className="text-white/80">
                    <p>
                      Bonus:{" "}
                      {Array.isArray(selectedObject.bonus.amount)
                        ? selectedObject.bonus.amount.join(", ")
                        : selectedObject.bonus.amount}
                    </p>
                    <p className="text-white/60">
                      Turni al prossimo bonus: {selectedObject.turnsToNextBonus ?? "-"}
                    </p>
                  </div>
                ) : (
                  <p className="text-white/70">
                    Pezzi mancanti: {selectedObject.piecesNeeded - selectedObject.piecesOwned}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Modale Incubatrice */}
      {activePanel === "incubatrice" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#111522]/95 p-6 text-center shadow-xl">
            <button
              type="button"
              onClick={closePanel}
              className="absolute right-6 top-6 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.4em] text-white/80 transition hover:border-[#a67c52] hover:text-[#a67c52]"
            >
              Chiudi
            </button>
            <h2 className="text-lg font-semibold uppercase tracking-[0.4em] text-white/80">
              Incubatrice
            </h2>
            <p className="mt-4 text-sm text-white/70">
              Questa sezione non è ancora disponibile. Torna più tardi per scoprire novità!
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HouseRoute;
