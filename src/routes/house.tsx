import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DoorHitbox from "@/components/DoorHitbox";
import Tooltip from "@/components/Tooltip";
import { useGameStore } from "@/state/store";

const HOUSE_IMAGE_WIDTH = 1785;
const HOUSE_IMAGE_HEIGHT = 1004;

const houseAreas = [
  {
    id: "bacheca",
    label: "Bacheca",
    hitboxPath: "/assets/casa/pulsanti/bacheca.json",
    imageSrc: "/assets/casa/pulsanti/bacheca.png",
    selectedImageSrc: "/assets/casa/pulsanti/bacheca_selected.png",
    x: 106,
    y: 175,
    width: 472,
    height: 300
  },
  {
    id: "incubatrice",
    label: "Incubatrice",
    hitboxPath: "/assets/casa/pulsanti/incubatrice.json",
    imageSrc: "/assets/casa/pulsanti/incubatrice.png",
    selectedImageSrc: "/assets/casa/pulsanti/incubatrice_selected.png",
    x: 320,
    y: 426,
    width: 138,
    height: 194
  },
  {
    id: "porta",
    label: "Porta",
    hitboxPath: "/assets/casa/pulsanti/porta.json",
    imageSrc: "/assets/casa/pulsanti/porta.png",
    selectedImageSrc: "/assets/casa/pulsanti/porta_selected.png",
    x: 790,
    y: 277,
    width: 271,
    height: 494
  }
] as const;

const HouseRoute = () => {
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"none" | "bacheca" | "incubatrice">("none");

  const visibleObjects = useMemo(() => {
    if (!save) return [];
    return save.house.objects.filter((object) => object.piecesOwned > 0 || object.unlocked);
  }, [save]);

  const selectedObject = visibleObjects.find((object) => object.id === selectedId) ?? null;

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
            className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] shadow-lg"
            style={{ aspectRatio: `${HOUSE_IMAGE_WIDTH} / ${HOUSE_IMAGE_HEIGHT}` }}
          >
            <img
              src="/assets/casa/sfondo_casa.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />

            {houseAreas.map((area) => (
              <div
                key={area.id}
                className="absolute"
                style={{
                  left: toPercent(area.x, HOUSE_IMAGE_WIDTH),
                  top: toPercent(area.y, HOUSE_IMAGE_HEIGHT),
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
                  onClick={() => handleAreaClick(area.id)}
                  childrenWrapperClassName="flex items-end justify-center pb-4"
                >
                  <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.35em]">
                    {area.label}
                  </span>
                </DoorHitbox>
              </div>
            ))}
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
