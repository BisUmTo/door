import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DoorHitbox from "@/components/DoorHitbox";
import Tooltip from "@/components/Tooltip";
import { loadHitbox, type HitboxDefinition } from "@/data/loaders";
import { useGameStore } from "@/state/store";

const HOUSE_IMAGE_WIDTH = 1785;
const HOUSE_IMAGE_HEIGHT = 1004;

const houseAreas = [
  {
    id: "bacheca",
    label: "",
    hitboxPath: "/assets/casa/pulsanti/bacheca.json",
    imageSrc: "/assets/casa/pulsanti/bacheca.png",
    selectedImageSrc: "/assets/casa/pulsanti/bacheca_selected.png",
    x: 0,
    y: 0,
    width: HOUSE_IMAGE_WIDTH,
    height: HOUSE_IMAGE_WIDTH,
  },
  {
    id: "incubatrice",
    label: "",
    hitboxPath: "/assets/casa/pulsanti/incubatrice.json",
    imageSrc: "/assets/casa/pulsanti/incubatrice.png",
    selectedImageSrc: "/assets/casa/pulsanti/incubatrice_selected.png",
    x: 0,
    y: 0,
    width: HOUSE_IMAGE_WIDTH,
    height: HOUSE_IMAGE_WIDTH
  },
  {
    id: "porta",
    label: "",
    hitboxPath: "/assets/casa/pulsanti/porta.json",
    imageSrc: "/assets/casa/pulsanti/porta.png",
    selectedImageSrc: "/assets/casa/pulsanti/porta_selected.png",
    x: 0,
    y: 0,
    width: HOUSE_IMAGE_WIDTH,
    height: HOUSE_IMAGE_WIDTH
  }
] as const;

const isPointInPolygon = (points: [number, number][], x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const isPointWithinHitbox = (
  definition: HitboxDefinition | null | undefined,
  x: number,
  y: number
) => {
  if (!definition || !definition.polygons?.length) return false;
  return definition.polygons.some((polygon) => isPointInPolygon(polygon.points, x, y));
};

const HouseRoute = () => {
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"none" | "bacheca" | "incubatrice">("none");
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [areaHitboxes, setAreaHitboxes] = useState<Record<string, HitboxDefinition | null>>({});

  const visibleObjects = useMemo(() => {
    if (!save) return [];
    return save.house.objects.filter((object) => object.piecesOwned > 0 || object.unlocked);
  }, [save]);

  const selectedObject = visibleObjects.find((object) => object.id === selectedId) ?? null;

  useEffect(() => {
    let active = true;
    const loadHitboxes = async () => {
      const entries = await Promise.all(
        houseAreas.map(async (area) => ({
          id: area.id,
          definition: await loadHitbox(area.hitboxPath)
        }))
      );
      if (!active) return;
      setAreaHitboxes(
        entries.reduce<Record<string, HitboxDefinition | null>>((acc, entry) => {
          acc[entry.id] = entry.definition;
          return acc;
        }, {})
      );
    };
    void loadHitboxes();
    return () => {
      active = false;
    };
  }, []);

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

  const closePanel = () => {
    setActivePanel("none");
    setSelectedId(null);
  };

  const handleAreaClick = (areaId: (typeof houseAreas)[number]["id"]) => {
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
  };

  useEffect(() => {
    if (activePanel !== "none") {
      setHoverPoint(null);
    }
  }, [activePanel]);

  const hoverStates = useMemo(() => {
    if (!hoverPoint) return {};
    return houseAreas.reduce<Record<string, boolean>>((acc, area) => {
      const definition = areaHitboxes[area.id];
      if (isPointWithinHitbox(definition, hoverPoint.x, hoverPoint.y)) {
        acc[area.id] = true;
        return acc;
      }
      const withinBounds =
        hoverPoint.x >= area.x &&
        hoverPoint.x <= area.x + area.width &&
        hoverPoint.y >= area.y &&
        hoverPoint.y <= area.y + area.height;
      if (withinBounds) {
        acc[area.id] = true;
      }
      return acc;
    }, {});
  }, [hoverPoint, areaHitboxes]);

  const handleSceneMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds || !bounds.width || !bounds.height) {
      setHoverPoint(null);
      return;
    }
    const ratioX = (event.clientX - bounds.left) / bounds.width;
    const ratioY = (event.clientY - bounds.top) / bounds.height;
    if (ratioX < 0 || ratioX > 1 || ratioY < 0 || ratioY > 1) {
      setHoverPoint(null);
      return;
    }
    setHoverPoint({
      x: ratioX * HOUSE_IMAGE_WIDTH,
      y: ratioY * HOUSE_IMAGE_HEIGHT
    });
  };

  const handleSceneMouseLeave = () => {
    setHoverPoint(null);
  };

  return (
    <div className="relative min-h-screen bg-[#080910] text-white">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-6 py-8">
        <header className="flex items-center justify-between uppercase tracking-[0.4em] text-white/70">
          <span>Casa</span>
          <Link
            to="/lobby"
            className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest hover:border-accent hover:text-accent"
          >
            Lobby
          </Link>
        </header>

        <main className="mt-8 flex-1">
          <div
            ref={canvasRef}
            className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] shadow-lg"
            style={{ aspectRatio: `${HOUSE_IMAGE_WIDTH} / ${HOUSE_IMAGE_HEIGHT}` }}
            onMouseMove={handleSceneMouseMove}
            onMouseLeave={handleSceneMouseLeave}
          >
            <img
              src="/assets/casa/sfondo_casa.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />

            {houseAreas.map((area) => {
              const hoverOverride =
                hoverPoint !== null ? hoverStates[area.id] ?? false : undefined;
              return (
                <div
                  key={area.id}
                  className="absolute"
                  style={{
                    left: toPercent(area.x, HOUSE_IMAGE_WIDTH),
                    top: toPercent(area.y-389, HOUSE_IMAGE_HEIGHT),
                    width: toPercent(area.width, HOUSE_IMAGE_WIDTH),
                    height: toPercent(area.height, HOUSE_IMAGE_HEIGHT)
                  }}
                >
                  <DoorHitbox
                    hitboxPath={area.hitboxPath}
                    width="100%"
                    height="100%"
                    referenceWidth={area.width}
                    referenceHeight={area.height}
                    referenceOffsetX={area.x}
                    referenceOffsetY={area.y}
                    imageSrc={area.imageSrc}
                    selectedImageSrc={area.selectedImageSrc}
                    hoverOverride={hoverOverride}
                    onClick={() => handleAreaClick(area.id)}
                    childrenWrapperClassName="flex items-end justify-center pb-4"
                  >
                    <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.35em]">
                      {area.label}
                    </span>
                  </DoorHitbox>
                </div>
              );
            })}
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
                  <DoorHitbox
                    key={object.id}
                    hitboxPath="/assets/house/object.json"
                    width={200}
                    height={120}
                    referenceWidth={200}
                    referenceHeight={120}
                    onClick={() => setSelectedId(object.id)}
                    className="rounded-3xl border border-white/10 bg-white/5 transition hover:border-accent hover:text-accent"
                  >
                    <div className="flex h-full w-full flex-col justify-between gap-2 p-4 text-left">
                      <span className="text-lg font-semibold text-white">{object.name}</span>
                      <div className="text-xs uppercase text-white/60">
                        <span className="block">
                          {object.piecesOwned}/{object.piecesNeeded} pezzi
                        </span>
                        <span className="block">
                          {object.unlocked ? "Completato" : "Incompleto"}
                        </span>
                      </div>
                    </div>
                  </DoorHitbox>
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
