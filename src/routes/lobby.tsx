import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import P5Scene, { type SceneConfig, type SceneElementConfig } from "@/components/P5Scene";
import InfoPanel from "@/components/InfoPanel";
import { doorLabels } from "@/components/Door";
import type { DoorType } from "@/game/types";
import { useGameStore } from "@/state/store";
import { useLobbyDoors } from "@/state/selectors";

const LOBBY_IMAGE_WIDTH = 1785;
const LOBBY_IMAGE_HEIGHT = 1004;

type LobbyAreaId = "casa" | "baule" | "zaino" | "porta1" | "porta2" | "porta3";
const doorAreaIds = ["porta1", "porta2", "porta3"] as const;
type LobbyDoorId = (typeof doorAreaIds)[number];
const doorIdToIndex: Record<LobbyDoorId, number> = {
  porta1: 0,
  porta2: 1,
  porta3: 2
};

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
  isDoor?: boolean;
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
    labelPosition: { x: 155, y: 225 },
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
    labelPosition: { x: 1700, y: 675 },
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
    labelPosition: { x: 760, y: 720 },
    zIndex: 14,
    route: "/inventory"
  },
  {
    id: "porta1",
    label: "Porta 1",
    hitboxPath: "/assets/lobby/pulsanti/porta1.json",
    image: "/assets/lobby/pulsanti/porta1.png",
    selectedImage: "/assets/lobby/pulsanti/porta1.png",
    layout: { x: 0, y: 0, width: LOBBY_IMAGE_WIDTH, height: LOBBY_IMAGE_HEIGHT },
    labelPosition: { x: 535, y: 200 },
    zIndex: 20,
    isDoor: true
  },
  {
    id: "porta2",
    label: "Porta 2",
    hitboxPath: "/assets/lobby/pulsanti/porta2.json",
    image: "/assets/lobby/pulsanti/porta2.png",
    selectedImage: "/assets/lobby/pulsanti/porta2.png",
    layout: { x: 0, y: 0, width: LOBBY_IMAGE_WIDTH, height: LOBBY_IMAGE_HEIGHT },
    labelPosition: { x: 986.5, y: 200 },
    zIndex: 22,
    isDoor: true
  },
  {
    id: "porta3",
    label: "Porta 3",
    hitboxPath: "/assets/lobby/pulsanti/porta3.json",
    image: "/assets/lobby/pulsanti/porta3.png",
    selectedImage: "/assets/lobby/pulsanti/porta3.png",
    layout: { x: 0, y: 0, width: LOBBY_IMAGE_WIDTH, height: LOBBY_IMAGE_HEIGHT },
    labelPosition: { x: 1428.5, y: 200 },
    zIndex: 24,
    isDoor: true
  }
];

const doorOverlayLayouts: Record<LobbyDoorId, {
  x: number;
  y: number;
  width: number;
  height: number;
}> = {
  porta1: { x: 392, y: 275, width: 285, height: 520 },
  porta2: { x: 844, y: 275, width: 285, height: 520 },
  porta3: { x: 1286, y: 275, width: 285, height: 520 }
};

const doorColorAssets: Record<DoorType, string | null> = {
  white: "bianco",
  black: "nero",
  red: "rosso",
  orange: "arancione",
  yellow: "giallo",
  purple: "magenta",
  blue: "blu",
  lightBlue: "azzurro",
  brown: "marrone",
  lime: "lime",
  green: "verde",
  neutral: null
};

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const getDoorTexturePath = (type: DoorType) => {
  if (type === "neutral") {
    return "/assets/porte/porta_base.png";
  }
  const colorFolder = doorColorAssets[type];
  if (!colorFolder) return null;
  return `/assets/porte/${colorFolder}/porta_${colorFolder}_base.png`;
};

const LobbyRoute = () => {
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);
  const drawLobbyDoors = useGameStore((state) => state.drawLobbyDoors);
  const openDoor = useGameStore((state) => state.openDoor);
  const doors = useLobbyDoors();

  useEffect(() => {
    console.debug("[LobbyRoute] Game state snapshot:", useGameStore.getState());
  }, []);

  const [hoveredAreas, setHoveredAreas] = useState<Record<LobbyAreaId, boolean>>({
    casa: false,
    baule: false,
    zaino: false,
    porta1: false,
    porta2: false,
    porta3: false
  });

  useEffect(() => {
    if (!save) return;
    if (!save.progress.lastLobbyDraw.length) {
      void drawLobbyDoors();
    }
  }, [save, drawLobbyDoors]);

  const doorsRef = useRef(doors);
  doorsRef.current = doors;
  const openDoorRef = useRef(openDoor);
  openDoorRef.current = openDoor;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

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
            if (area.route) {
              navigateRef.current(area.route);
              return;
            }
            if (area.isDoor) {
              const doorIndex = doorIdToIndex[area.id as LobbyDoorId];
              const doorData = doorsRef.current[doorIndex];
              if (doorData) {
                const doorType = typeof doorData === "string"
                  ? doorData
                  : (doorData as { type: DoorType }).type;
                openDoorRef.current(doorType as DoorType);
                navigateRef.current("/door");
              }
            }
          },
          //onHoverChange: (hovered: boolean) => handleHoverChange(area.id, hovered)
        };
        return callbacks;
      },
      {} as Record<LobbyAreaId, { onClick: () => void; onHoverChange: (hovered: boolean) => void }>
    );
  }, [handleHoverChange]);

  const blockedDoors = useMemo(() => {
    const blockedMap = new Map<DoorType, number>();
    save?.progress.blockedDoors.forEach((entry) => {
      blockedMap.set(entry.type, entry.turnsLeft);
    });
    return blockedMap;
  }, [save]);

  const sceneConfig = useMemo<SceneConfig>(() => {
    const elements: SceneElementConfig[] = [];

    lobbyAreas.forEach((area) => {
      elements.push({
        id: area.id,
        image: area.image,
        selectedImage: area.selectedImage,
        hitboxPath: area.hitboxPath,
        layout: area.layout,
        zIndex: area.zIndex,
        onClick: areaCallbacks[area.id].onClick,
        onHoverChange: areaCallbacks[area.id].onHoverChange
      });

      if (area.isDoor) {
        const doorId = area.id as LobbyDoorId;
        const doorIndex = doorIdToIndex[doorId];
        const doorData = doors[doorIndex];
        if (doorData) {
          const doorType = typeof doorData === "string"
            ? (doorData as DoorType)
            : (doorData as { type: DoorType }).type;
          const texturePath = getDoorTexturePath(doorType);
          if (texturePath) {
            const overlayLayout = doorOverlayLayouts[doorId];
            if (overlayLayout) {
              elements.push({
                id: `${area.id}-texture`,
                image: texturePath,
                layout: overlayLayout,
                zIndex: area.zIndex + 20
              });
            }
          }
        }
      }
    });

    return {
      baseWidth: LOBBY_IMAGE_WIDTH,
      baseHeight: LOBBY_IMAGE_HEIGHT,
      backgroundImage: "/assets/lobby/sfondo_lobby.png",
      elements
    };
  }, [doors, areaCallbacks]);

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
                  let doorType: DoorType | null = null;
                  let blockedFor: number | undefined;

                  if (area.isDoor) {
                    const doorId = area.id as LobbyDoorId;
                    const doorData = doors[doorIdToIndex[doorId]];
                    if (doorData) {
                      doorType = typeof doorData === "string"
                        ? (doorData as DoorType)
                        : (doorData as { type: DoorType }).type;
                      blockedFor = blockedDoors.get(doorType);
                    }
                  }

                  return (
                    <div
                      key={`label-${area.id}`}
                      className={
                        area.isDoor
                          ? "absolute flex flex-col items-center gap-2"
                          : "absolute -translate-x-1/2 -translate-y-full -mt-2"
                      }
                      style={{
                        left: toPercent(area.labelPosition.x, LOBBY_IMAGE_WIDTH),
                        top: toPercent(area.labelPosition.y, LOBBY_IMAGE_HEIGHT),
                        ...(area.isDoor ? { transform: "translate(-50%, 0)" } : {})
                      }}
                    >
                      <span
                        className={`rounded-full border px-3 py-1 ${
                          area.isDoor ? "text-xs" : "text-[11px]"
                        } uppercase tracking-[0.35em] ${
                          hovered
                            ? "border-[#a67c52] bg-black/70 text-[#a67c52]"
                            : "border-white/30 bg-black/60 text-white"
                        }`}
                      >
                        {area.isDoor && doorType ? doorLabels[doorType] : area.label}
                      </span>
                      {typeof blockedFor === "number" && blockedFor > 0 ? (
                        <span className="rounded-full bg-red-600/80 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white">
                          Bloccata ({blockedFor})
                        </span>
                      ) : null}
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

export default LobbyRoute;
