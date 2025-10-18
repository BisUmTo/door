import { useCallback, useEffect, useMemo, useState } from "react";
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
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    labelPosition: {
      x: 60,
      y: 160
    },
    zIndex: 10,
    route: "/house"
  },
  {
    id: "baule",
    label: "Baule",
    hitboxPath: "/assets/lobby/pulsanti/baule.json",
    image: "/assets/lobby/pulsanti/baule.png",
    selectedImage: "/assets/lobby/pulsanti/baule_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    labelPosition: {
      x: 220,
      y: 160
    },
    zIndex: 12,
    route: "/chest"
  },
  {
    id: "zaino",
    label: "Inventario",
    hitboxPath: "/assets/lobby/pulsanti/zaino.json",
    image: "/assets/lobby/pulsanti/zaino.png",
    selectedImage: "/assets/lobby/pulsanti/zaino_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    labelPosition: {
      x: 1680,
      y: 160
    },
    zIndex: 14,
    route: "/inventory"
  },
  {
    id: "porta1",
    label: "Porta 1",
    hitboxPath: "/assets/lobby/pulsanti/porta1.json",
    image: "/assets/lobby/pulsanti/porta1.png",
    selectedImage: "/assets/lobby/pulsanti/porta1_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    labelPosition: {
      x: 534.5,
      y: 835
    },
    zIndex: 20,
    isDoor: true
  },
  {
    id: "porta2",
    label: "Porta 2",
    hitboxPath: "/assets/lobby/pulsanti/porta2.json",
    image: "/assets/lobby/pulsanti/porta2.png",
    selectedImage: "/assets/lobby/pulsanti/porta2_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    labelPosition: {
      x: 986.5,
      y: 835
    },
    zIndex: 22,
    isDoor: true
  },
  {
    id: "porta3",
    label: "Porta 3",
    hitboxPath: "/assets/lobby/pulsanti/porta3.json",
    image: "/assets/lobby/pulsanti/porta3.png",
    selectedImage: "/assets/lobby/pulsanti/porta3_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    labelPosition: {
      x: 1428.5,
      y: 835
    },
    zIndex: 24,
    isDoor: true
  }
];

const doorOverlayLayouts: Record<string, { x: number; y: number; width: number; height: number }> = {
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

const getDoorTexturePath = (type: DoorType) => {
  const colorFolder = doorColorAssets[type];
  if (!colorFolder) return null;
  return `/assets/porte/${colorFolder}/porta_${colorFolder}_base.png`;
};

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const LobbyRoute = () => {
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);
  const drawLobbyDoors = useGameStore((state) => state.drawLobbyDoors);
  const openDoor = useGameStore((state) => state.openDoor);
  const doors = useLobbyDoors();

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

  const handleHoverChange = useCallback((areaId: LobbyAreaId, hovered: boolean) => {
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

  const handleAreaClick = useCallback(
    (area: LobbyAreaConfig, doorIndex?: number) => {
      if (area.route) {
        navigate(area.route);
        return;
      }
      if (area.isDoor && typeof doorIndex === "number" && doors[doorIndex]) {
        const doorType = typeof doors[doorIndex] === "string"
          ? doors[doorIndex] as DoorType
          : (doors[doorIndex] as { type: DoorType }).type;
        openDoor(doorType);
        navigate("/door");
      }
    },
    [navigate, doors, openDoor]
  );

  const blockedDoors = useMemo(() => {
    const blockedMap = new Map<DoorType, number>();
    save?.progress.blockedDoors.forEach((entry) => {
      blockedMap.set(entry.type, entry.turnsLeft);
    });
    return blockedMap;
  }, [save]);

  const sceneConfig = useMemo<SceneConfig>(() => {
    const elements: SceneElementConfig[] = [];

    lobbyAreas.forEach((area, index) => {
      elements.push({
        id: area.id,
        image: area.image,
        selectedImage: area.selectedImage,
        hitboxPath: area.hitboxPath,
        layout: area.layout,
        zIndex: area.zIndex,
        onClick: () => handleAreaClick(area, area.isDoor ? index - 3 : undefined),
        onHoverChange: (hovered) => handleHoverChange(area.id, hovered)
      });

      // Add door overlay if this is a door
      if (area.isDoor) {
        const doorIndex = index - 3; // First 3 areas are not doors
        const doorData = doors[doorIndex];
        if (doorData) {
          const doorType = typeof doorData === "string"
            ? doorData as DoorType
            : (doorData as { type: DoorType }).type;
          const texturePath = getDoorTexturePath(doorType);
          if (texturePath) {
            const overlayLayout = doorOverlayLayouts[area.id];
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
  }, [handleAreaClick, handleHoverChange, doors]);

  return (
    <div className="relative min-h-screen bg-[#0b0c0f] text-white">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-6 py-8">
        <header className="flex items-center justify-between text-sm uppercase tracking-[0.5em] text-white/70">
          <span>Lobby</span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rotate-6 rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest text-white transition hover:border-accent hover:text-accent"
          >
            Exit
          </button>
        </header>

        <main className="mt-8 flex flex-1 flex-col gap-8 lg:flex-row">
          <div className="relative flex-1">
            <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] shadow-lg">
              <P5Scene config={sceneConfig} className="w-full" />

              <div className="pointer-events-none absolute inset-0">
                {lobbyAreas.map((area, index) => {
                  const hovered = hoveredAreas[area.id];
                  let doorType: DoorType | null = null;
                  let blockedFor: number | undefined = undefined;

                  if (area.isDoor) {
                    const doorIndex = index - 3;
                    const doorData = doors[doorIndex];
                    if (doorData) {
                      doorType = typeof doorData === "string"
                        ? doorData as DoorType
                        : (doorData as { type: DoorType }).type;
                      blockedFor = blockedDoors.get(doorType);
                    }
                  }

                  return (
                    <div
                      key={`label-${area.id}`}
                      className={area.isDoor ? "absolute flex flex-col items-center gap-2" : "absolute"}
                      style={{
                        left: toPercent(area.labelPosition.x, LOBBY_IMAGE_WIDTH),
                        top: toPercent(area.labelPosition.y, LOBBY_IMAGE_HEIGHT),
                        ...(area.isDoor ? { transform: "translate(-50%, 0)" } : {})
                      }}
                    >
                      <span
                        className={`rounded-full border px-3 py-1 ${area.isDoor ? "text-xs" : "text-[11px]"} uppercase tracking-[0.35em] ${
                          hovered
                            ? "border-accent bg-black/70 text-accent"
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
