import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InfoPanel from "@/components/InfoPanel";
import P5Scene, { type SceneConfig, type SceneElementConfig } from "@/components/P5Scene";
import { doorLabels } from "@/components/Door";
import type { DoorType } from "@/game/types";
import { useGameStore } from "@/state/store";
import { useLobbyDoors } from "@/state/selectors";

const LOBBY_IMAGE_WIDTH = 1785;
const LOBBY_IMAGE_HEIGHT = 1004;

interface DoorAreaConfig {
  id: string;
  hitboxPath: string;
  image: string;
  selectedImage: string;
  labelPosition?: {
    x: number;
    y: number;
  };
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  texture: {
    layout: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

interface StaticAreaConfig {
  id: string;
  hitboxPath: string;
  image: string;
  selectedImage: string;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  route: string;
  label: string;
  labelOffset?: {
    x: number;
    y: number;
  };
  labelPosition?: {
    x: number;
    y: number;
  };
}

const doorAreas: DoorAreaConfig[] = [
  {
    id: "porta1",
    hitboxPath: "/assets/lobby/pulsanti/porta1.json",
    image: "/assets/lobby/pulsanti/porta1.png",
    selectedImage: "/assets/lobby/pulsanti/porta1_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    texture: {
      layout: {
        x: 392,
        y: 275,
        width: 285,
        height: 520
      }
    }
  },
  {
    id: "porta2",
    hitboxPath: "/assets/lobby/pulsanti/porta2.json",
    image: "/assets/lobby/pulsanti/porta2.png",
    selectedImage: "/assets/lobby/pulsanti/porta2_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    texture: {
      layout: {
        x: 844,
        y: 275,
        width: 285,
        height: 520
      }
    }
  },
  {
    id: "porta3",
    hitboxPath: "/assets/lobby/pulsanti/porta3.json",
    image: "/assets/lobby/pulsanti/porta3.png",
    selectedImage: "/assets/lobby/pulsanti/porta3_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    texture: {
      layout: {
        x: 1286,
        y: 275,
        width: 285,
        height: 520
      }
    }
  }
];

const staticAreas: StaticAreaConfig[] = [
  {
    id: "casa",
    hitboxPath: "/assets/lobby/pulsanti/casa.json",
    image: "/assets/lobby/pulsanti/casa.png",
    selectedImage: "/assets/lobby/pulsanti/casa_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    route: "/house",
    label: "Casa",
    labelOffset: {
      x: 60,
      y: 160
    }
  },
  {
    id: "baule",
    hitboxPath: "/assets/lobby/pulsanti/baule.json",
    image: "/assets/lobby/pulsanti/baule.png",
    selectedImage: "/assets/lobby/pulsanti/baule_selected.png",
    layout: {
      x: 100,
      y: 100,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    route: "/chest",
    label: "Baule",
    labelOffset: {
      x: 120,
      y: 60
    }
  },
  {
    id: "zaino",
    hitboxPath: "/assets/lobby/pulsanti/zaino.json",
    image: "/assets/lobby/pulsanti/zaino.png",
    selectedImage: "/assets/lobby/pulsanti/zaino_selected.png",
    layout: {
      x: 0,
      y: 0,
      width: LOBBY_IMAGE_WIDTH,
      height: LOBBY_IMAGE_HEIGHT
    },
    route: "/inventory",
    label: "Inventario",
    labelOffset: {
      x: 120,
      y: 60
    }
  }
];

type LobbyDoorEntry = {
  type: DoorType;
  variant?: string;
};

const isDoorType = (value: unknown): value is DoorType =>
  typeof value === "string" && value in doorLabels;

const isLobbyDoorObject = (value: unknown): value is LobbyDoorEntry => {
  if (!value || typeof value !== "object") return false;
  if (!("type" in value)) return false;
  const potentialType = (value as { type: unknown }).type;
  if (!isDoorType(potentialType)) return false;
  const variant = (value as { variant?: unknown }).variant;
  return variant === undefined || typeof variant === "string";
};

const sanitizeVariant = (variant?: string) => {
  if (!variant) return "";
  return variant.toLowerCase().replace(/[^a-z0-9_-]/g, "");
};

const doorColorAssets: Record<DoorType, { folder: string; file: string } | null> = {
  white: { folder: "bianco", file: "bianco" },
  black: { folder: "nero", file: "nero" },
  red: { folder: "rosso", file: "rosso" },
  orange: { folder: "arancione", file: "arancione" },
  yellow: { folder: "giallo", file: "giallo" },
  purple: { folder: "magenta", file: "magenta" },
  blue: { folder: "blu", file: "blu" },
  lightBlue: { folder: "azzurro", file: "azzurro" },
  brown: { folder: "marrone", file: "marrone" },
  lime: { folder: "lime", file: "lime" },
  green: { folder: "verde", file: "verde" },
  neutral: null
};

const getDoorTexturePath = (type: DoorType, variant?: string) => {
  // Return null for neutral (no overlay)
  if (type === "neutral") return null;
  const asset = doorColorAssets[type];
  console.log(`Getting texture path for door type: ${type}, variant: ${variant}`);
  if (!asset) return null;
  const sanitized = sanitizeVariant(variant);
  // requested path format: /assets/porte/porta_<colore>_<tipo>.png
  // where <tipo> is 'base' if not specified
  const typeSuffix = sanitized || "base";
  return `/assets/porte/porta_${asset.file}_${typeSuffix}.png`;
};

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const LobbyRoute = () => {
  const navigate = useNavigate();
  const doors = useLobbyDoors();
  const {
    save,
    drawLobbyDoors,
    openDoor
  } = useGameStore((state) => ({
    save: state.save,
    drawLobbyDoors: state.drawLobbyDoors,
    openDoor: state.openDoor
  }));

  const [hoveredElements, setHoveredElements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!save) return;
    if (!save.progress.lastLobbyDraw.length) {
      void drawLobbyDoors();
    }
  }, [save, drawLobbyDoors]);

  const handleDoorClick = useCallback(
    (doorType: DoorType) => {
      const encounter = openDoor(doorType);
      if (encounter) {
        navigate("/door");
      } else {
        navigate("/door");
      }
    },
    [navigate, openDoor]
  );

  const handleHoverChange = useCallback((elementId: string, hovered: boolean) => {
    setHoveredElements((previous) => {
      if ((previous[elementId] ?? false) === hovered) {
        return previous;
      }
      return {
        ...previous,
        [elementId]: hovered
      };
    });
  }, []);

  const lobbyDoorEntries = useMemo(() => {
    const entries = (doors as unknown[]).slice(0, doorAreas.length);
    return entries.map((entry, index) => {
      if (isLobbyDoorObject(entry)) {
        return { door: entry, area: doorAreas[index] };
      }
      const fallbackType = isDoorType(entry) ? entry : "neutral";
      return { door: { type: fallbackType }, area: doorAreas[index] };
    });
  }, [doors]);

  const blockedDoors = useMemo(() => {
    const blockedMap = new Map<DoorType, number>();
    save?.progress.blockedDoors.forEach((entry) => {
      blockedMap.set(entry.type, entry.turnsLeft);
    });
    return blockedMap;
  }, [save]);

  const sceneConfig = useMemo<SceneConfig>(() => {
    const elements: SceneElementConfig[] = [];

    lobbyDoorEntries.forEach(({ door, area }, index) => {
      const texturePath = getDoorTexturePath(door.type, door.variant);

      // Draw the base button (this contains the hitbox and interaction handlers)
      elements.push({
        id: area.id,
        image: area.image,
        selectedImage: area.selectedImage,
        hitboxPath: area.hitboxPath,
        layout: area.layout,
        zIndex: 20 + index,
        onClick: () => handleDoorClick(door.type),
        onHoverChange: (hovered) => handleHoverChange(area.id, hovered)
      });

      // If a texture overlay exists, draw it above the button using the texture layout.
      // The overlay is purely visual so it should not capture clicks/hover; interactions
      // remain bound to the button element. We set a slightly higher zIndex so it sits on top.
      if (texturePath) {
        elements.push({
          id: `${area.id}-texture`,
          image: texturePath,
          layout: area.texture.layout,
          zIndex: 40 + index
        });
        console.log(`Added texture overlay for door ${area.id}: ${texturePath}`);
      }
    });

    staticAreas.forEach((area, index) => {
      elements.push({
        id: area.id,
        image: area.image,
        selectedImage: area.selectedImage,
        hitboxPath: area.hitboxPath,
        layout: area.layout,
        zIndex: 50 + index,
        onClick: () => navigate(area.route),
        onHoverChange: (hovered) => handleHoverChange(area.id, hovered)
      });
    });

    return {
      baseWidth: LOBBY_IMAGE_WIDTH,
      baseHeight: LOBBY_IMAGE_HEIGHT,
      backgroundImage: "/assets/lobby/sfondo_lobby.png",
      elements
    };
  }, [handleDoorClick, handleHoverChange, lobbyDoorEntries, navigate]);

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
            <div className="relative mx-auto w-full overflow-hidden rounded-[32px] shadow-lg">
              <P5Scene config={sceneConfig} className="w-full" />

              <div className="pointer-events-none absolute inset-0">
                {lobbyDoorEntries.map(({ door, area }) => {
                  const blockedFor = blockedDoors.get(door.type);
                const textureLayout = area.texture.layout;
                const labelBaseX =
                  area.labelPosition?.x ?? textureLayout.x + textureLayout.width / 2;
                const labelBaseY =
                  area.labelPosition?.y ?? textureLayout.y + textureLayout.height + 40;
                const labelLeft = toPercent(labelBaseX, LOBBY_IMAGE_WIDTH);
                const labelTop = toPercent(labelBaseY, LOBBY_IMAGE_HEIGHT);
                const hovered = hoveredElements[area.id];
                return (
                  <div
                    key={`label-${area.id}`}
                    className="absolute flex flex-col items-center gap-2"
                      style={{
                        left: labelLeft,
                        top: labelTop,
                        transform: "translate(-50%, 0)"
                      }}
                    >
                      <span
                        className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.35em] ${
                          hovered
                            ? "border-accent bg-black/70 text-accent"
                            : "border-white/30 bg-black/60 text-white"
                        }`}
                      >
                        {doorLabels[door.type]}
                      </span>
                      {typeof blockedFor === "number" && blockedFor > 0 ? (
                        <span className="rounded-full bg-red-600/80 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white">
                          Bloccata ({blockedFor})
                        </span>
                      ) : null}
                    </div>
                  );
                })}

                {staticAreas.map((area) => {
                  const hovered = hoveredElements[area.id];
                  const labelBaseX =
                    area.labelPosition?.x ??
                    area.layout.x + (area.labelOffset?.x ?? 0);
                  const labelBaseY =
                    area.labelPosition?.y ??
                    area.layout.y + (area.labelOffset?.y ?? 0);
                  return (
                    <div
                      key={`label-${area.id}`}
                      className="absolute"
                      style={{
                        left: toPercent(labelBaseX, LOBBY_IMAGE_WIDTH),
                        top: toPercent(labelBaseY, LOBBY_IMAGE_HEIGHT)
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
