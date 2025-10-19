import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import P5Scene, { type SceneConfig, type SceneElementConfig } from "@/components/P5Scene";
import InfoPanel from "@/components/InfoPanel";
import { useGameStore } from "@/state/store";

const LOBBY_IMAGE_WIDTH = 1785;
const LOBBY_IMAGE_HEIGHT = 1004;

type LobbyAreaId = "casa" | "baule" | "zaino";

interface LobbyAreaConfig {
  id: LobbyAreaId;
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
  route?: string;
}

const lobbyAreas: LobbyAreaConfig[] = [
  {
    id: "casa",
    label: "Casa",
    hitboxPath: "/assets/lobby/pulsanti/casa.json",
    image: "/assets/lobby/pulsanti/casa.png",
    selectedImage: "/assets/lobby/pulsanti/casa_selected.png",
    layout: { x: 0, y: 0, width: LOBBY_IMAGE_WIDTH, height: LOBBY_IMAGE_HEIGHT },
    // Punto di ancoraggio: vicino alla porta di casa
    labelPosition: { x: 120, y: 300 },
    zIndex: 10,
    route: "/house"
  },
  {
    id: "baule",
    label: "Baule",
    hitboxPath: "/assets/lobby/pulsanti/baule.json",
    image: "/assets/lobby/pulsanti/baule.png",
    selectedImage: "/assets/lobby/pulsanti/baule_selected.png",
    layout: { x: 0, y: 0, width: LOBBY_IMAGE_WIDTH, height: LOBBY_IMAGE_HEIGHT },
    // Punto di ancoraggio: centro del baule
    labelPosition: { x: 760, y: 630 },
    zIndex: 12,
    route: "/chest"
  },
  {
    id: "zaino",
    label: "Zaino",
    hitboxPath: "/assets/lobby/pulsanti/zaino.json",
    image: "/assets/lobby/pulsanti/zaino.png",
    selectedImage: "/assets/lobby/pulsanti/zaino_selected.png",
    layout: { x: 0, y: 0, width: LOBBY_IMAGE_WIDTH, height: LOBBY_IMAGE_HEIGHT },
    // Punto di ancoraggio: sopra lo zaino a destra
    labelPosition: { x: 1650, y: 260 },
    zIndex: 14,
    route: "/inventory"
  }
];

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const Lobby2Route = () => {
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);

  const [hoveredAreas, setHoveredAreas] = useState<Record<LobbyAreaId, boolean>>({
    casa: false,
    baule: false,
    zaino: false
  });

  const handleHoverChange = useCallback((areaId: LobbyAreaId, hovered: boolean) => {
    setHoveredAreas((previous) => {
      if ((previous[areaId] ?? false) === hovered) return previous;
      return { ...previous, [areaId]: hovered };
    });
  }, []);

  const areaCallbacks = useMemo(() => {
    return lobbyAreas.reduce(
      (callbacks, area) => {
        callbacks[area.id] = {
          onClick: () => {
            if (area.route) navigate(area.route);
          },
          onHoverChange: (hovered: boolean) => handleHoverChange(area.id, hovered)
        };
        return callbacks;
      },
      {} as Record<LobbyAreaId, { onClick: () => void; onHoverChange: (hovered: boolean) => void }>
    );
  }, [handleHoverChange, navigate]);

  const sceneConfig = useMemo<SceneConfig>(() => {
    const elements: SceneElementConfig[] = lobbyAreas.map((area) => ({
      id: area.id,
      image: area.image,
      selectedImage: area.selectedImage,
      hitboxPath: area.hitboxPath,
      layout: area.layout,
      zIndex: area.zIndex,
      onClick: areaCallbacks[area.id].onClick,
      onHoverChange: areaCallbacks[area.id].onHoverChange
    }));

    return {
      baseWidth: LOBBY_IMAGE_WIDTH,
      baseHeight: LOBBY_IMAGE_HEIGHT,
      backgroundImage: "/assets/lobby/sfondo_lobby.png",
      elements
    };
  }, [areaCallbacks]);

  return (
    <div className="relative min-h-screen bg-[#080910] text-white">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-8 py-10">
        <header className="flex items-center justify-between text-xs uppercase tracking-[0.45em] text-white/70">
          <span>Lobby</span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full border border-white/30 px-4 py-1 transition hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            Esci
          </button>
        </header>

        <main className="mt-8 flex flex-1 flex-col gap-8 xl:flex-row">
          <div className="relative flex-1">
            {/* Contenitore scena con rapporto fisso e centrato */}
            <div
              className="
                relative mx-auto overflow-hidden rounded-[36px] shadow-lg
                flex items-center justify-center
                w-full
              "
              style={{
                aspectRatio: `${LOBBY_IMAGE_WIDTH} / ${LOBBY_IMAGE_HEIGHT}`, // 1785/1004
                maxWidth: "min(100vw, 1280px)"
              }}
            >
              <P5Scene config={sceneConfig} className="absolute inset-0 w-full h-full" />

              {/* Etichette posizionate sopra gli oggetti (centrate) */}
              <div className="pointer-events-none absolute inset-0">
                {lobbyAreas.map((area) => {
                  const hovered = hoveredAreas[area.id];
                  return (
                    <div
                      key={`label-${area.id}`}
                      className="absolute -translate-x-1/2 -translate-y-full -mt-2" // sopra l'ancora, centrata
                      style={{
                        left: toPercent(area.labelPosition.x, LOBBY_IMAGE_WIDTH),
                        top: toPercent(area.labelPosition.y, LOBBY_IMAGE_HEIGHT)
                      }}
                    >
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.35em] ${
                          hovered
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

          <aside className="flex w-full max-w-md flex-col gap-4 self-end">
            {save ? (
              <InfoPanel
                doorsOpened={save.progress.doorsOpened}
                turn={save.progress.turn}
                blockedDoors={save.progress.blockedDoors}
              />
            ) : null}
          </aside>
        </main>
      </div>
    </div>
  );
};

export default Lobby2Route;
