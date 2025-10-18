import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import P5Scene, { type SceneConfig, type SceneElementConfig } from "@/components/P5Scene";
import Tooltip from "@/components/Tooltip";
import { useGameStore } from "@/state/store";

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
    labelPosition: {
      x: 342,
      y: 520
    },
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
    labelPosition: {
      x: 389,
      y: 650
    },
    zIndex: 12
  },
  {
    id: "porta",
    label: "Porta",
    hitboxPath: "/assets/casa/pulsanti/porta.json",
    image: "/assets/casa/pulsanti/porta.png",
    selectedImage: "/assets/casa/pulsanti/porta_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: HOUSE_IMAGE_WIDTH,
      height: HOUSE_IMAGE_HEIGHT
    },
    labelPosition: {
      x: 925,
      y: 820
    },
    zIndex: 8
  }
];

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
    return save.house.objects.filter((object) => object.piecesOwned > 0 || object.unlocked);
  }, [save]);

  const selectedObject = visibleObjects.find((object) => object.id === selectedId) ?? null;

  const handleHoverChange = useCallback((areaId: HouseAreaId, hovered: boolean) => {
    setHoveredAreas((previous) => {
      if ((previous[areaId] ?? false) === hovered) {
        return previous;
      }
      return {
        ...previous,
        [areaId]: hovered
      };
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
        setActivePanel("bacheca");
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
      setHoveredAreas({
        bacheca: false,
        incubatrice: false,
        porta: false
      });
    }
  }, [activePanel]);

  const sceneConfig = useMemo<SceneConfig>(() => {
    const elements: SceneElementConfig[] = houseAreas.map((area) => ({
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
      elements
    };
  }, [handleAreaClick, handleHoverChange]);

  return (
    <div className="relative min-h-screen bg-[#080910] text-white">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-6 py-8">
        <header className="flex items-center justify-between uppercase tracking-[0.4em] text-white/70">
          <span>Casa</span>
          <Link
            to="/lobby"
            className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest transition hover:border-accent hover:text-accent"
          >
            Lobby
          </Link>
        </header>

        <main className="mt-8 flex-1">
          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] shadow-lg">
            <P5Scene config={sceneConfig} className="w-full" />

            <div className="pointer-events-none absolute inset-0">
              {houseAreas.map((area) => {
                const hovered = hoveredAreas[area.id];
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
                        hovered
                          ? "border-accent bg-black/70 text-accent"
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
        </main>
      </div>

      {activePanel === "bacheca" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="relative w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#111522]/95 p-6 shadow-xl">
            <button
              type="button"
              onClick={closePanel}
              className="absolute right-6 top-6 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.4em] text-white/80 hover:border-accent hover:text-accent"
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
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-accent hover:text-accent"
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

      {activePanel === "incubatrice" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#111522]/95 p-6 text-center shadow-xl">
            <button
              type="button"
              onClick={closePanel}
              className="absolute right-6 top-6 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.4em] text-white/80 hover:border-accent hover:text-accent"
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
