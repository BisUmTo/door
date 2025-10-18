import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InfoPanel from "@/components/InfoPanel";
import DoorHitbox from "@/components/DoorHitbox";
import { doorLabels } from "@/components/Door";
import { useGameStore } from "@/state/store";
import { useLobbyDoors } from "@/state/selectors";

const LOBBY_IMAGE_WIDTH = 1785;
const LOBBY_IMAGE_HEIGHT = 1004;

const doorAreas = [
  {
    id: "porta1",
    hitboxPath: "/assets/lobby/pulsanti/porta1.json",
    imageSrc: "/assets/lobby/pulsanti/porta1.png",
    selectedImageSrc: "/assets/lobby/pulsanti/porta1_selected.png",
    x: 0,
    y: 0,
    width: LOBBY_IMAGE_WIDTH,
    height: LOBBY_IMAGE_HEIGHT,
  },
  {
    id: "porta2",
    hitboxPath: "/assets/lobby/pulsanti/porta2.json",
    imageSrc: "/assets/lobby/pulsanti/porta2.png",
    selectedImageSrc: "/assets/lobby/pulsanti/porta2_selected.png",
    x: 0,
    y: 0,
    width: LOBBY_IMAGE_WIDTH,
    height: LOBBY_IMAGE_HEIGHT,
  },
  {
    id: "porta3",
    hitboxPath: "/assets/lobby/pulsanti/porta3.json",
    imageSrc: "/assets/lobby/pulsanti/porta3.png",
    selectedImageSrc: "/assets/lobby/pulsanti/porta3_selected.png",
    x: 0,
    y: 0,
    width: LOBBY_IMAGE_WIDTH,
    height: LOBBY_IMAGE_HEIGHT,
  }
] as const;

const staticAreas = [
  {
    id: "casa",
    hitboxPath: "/assets/lobby/pulsanti/casa.json",
    imageSrc: "/assets/lobby/pulsanti/casa.png",
    selectedImageSrc: "/assets/lobby/pulsanti/casa_selected.png",
    x: 0,
    y: 0,
    width: LOBBY_IMAGE_WIDTH,
    height: LOBBY_IMAGE_HEIGHT,
    route: "/house",
    // label: "Casa"
  },
  {
    id: "baule",
    hitboxPath: "/assets/lobby/pulsanti/baule.json",
    imageSrc: "/assets/lobby/pulsanti/baule.png",
    selectedImageSrc: "/assets/lobby/pulsanti/baule_selected.png",
    x: 0,
    y: 0,
    width: LOBBY_IMAGE_WIDTH,
    height: LOBBY_IMAGE_HEIGHT,
    route: "/chest",
    // label: "Baule"
  }
] as const;

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

  useEffect(() => {
    if (!save) return;
    if (!save.progress.lastLobbyDraw.length) {
      void drawLobbyDoors();
    }
  }, [save, drawLobbyDoors]);

  const handleDoorClick = (doorType: typeof doors[number]) => {
    const encounter = openDoor(doorType);
    if (encounter) {
      navigate("/door");
    } else {
      // Reward without battle also goes through door screen to show summary
      navigate("/door");
    }
  };

  const doorButtons = useMemo(() => {
    return doors.slice(0, doorAreas.length).map((doorType, index) => ({
      doorType,
      layout: doorAreas[index]
    }));
  }, [doors]);

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div className="relative min-h-screen bg-[#0b0c0f] text-white">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-6 py-8">
        <header className="flex items-center justify-between text-sm uppercase tracking-[0.5em] text-white/70">
          <span>Lobby</span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rotate-6 rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest text-white hover:border-accent hover:text-accent"
          >
            Exit
          </button>
        </header>

        <main className="mt-8 flex flex-1 flex-col gap-8 lg:flex-row">
          <div className="relative flex-1">
            <div
              className="relative mx-auto w-full overflow-hidden rounded-[32px] shadow-lg"
              style={{ aspectRatio: `${LOBBY_IMAGE_WIDTH} / ${LOBBY_IMAGE_HEIGHT}` }}
            >
              <img
                src="/assets/lobby/sfondo_lobby.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />

              {doorButtons.map(({ doorType, layout }) => {
                const blocked = save?.progress.blockedDoors.find(
                  (entry) => entry.type === doorType
                );
                return (
                  <div
                    key={layout.id}
                    className="absolute"
                    style={{
                      left: toPercent(layout.x, LOBBY_IMAGE_WIDTH),
                      top: toPercent(layout.y, LOBBY_IMAGE_HEIGHT),
                      width: toPercent(layout.width, LOBBY_IMAGE_WIDTH),
                      height: toPercent(layout.height, LOBBY_IMAGE_HEIGHT)
                    }}
                  >
                    <DoorHitbox
                      hitboxPath={layout.hitboxPath}
                      width="100%"
                      height="100%"
                      referenceWidth={layout.width}
                      referenceHeight={layout.height}
                      referenceOffsetX={layout.x}
                      referenceOffsetY={layout.y}
                      imageSrc={layout.imageSrc}
                      selectedImageSrc={layout.selectedImageSrc}
                      onClick={() => handleDoorClick(doorType)}
                      childrenWrapperClassName="flex flex-col items-center justify-end pb-8 gap-2"
                    >
                      <span className="rounded-full border border-white/30 bg-black/60 px-3 py-1 text-xs uppercase tracking-widest">
                        {doorLabels[doorType]}
                      </span>
                      {typeof blocked?.turnsLeft === "number" && blocked.turnsLeft > 0 ? (
                        <span className="rounded-full bg-red-600/80 px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                          Bloccata ({blocked.turnsLeft})
                        </span>
                      ) : null}
                    </DoorHitbox>
                  </div>
                );
              })}

              {staticAreas.map((area) => (
                <div
                  key={area.id}
                  className="absolute"
                  style={{
                    left: toPercent(area.x, LOBBY_IMAGE_WIDTH),
                    top: toPercent(area.y, LOBBY_IMAGE_HEIGHT),
                    width: toPercent(area.width, LOBBY_IMAGE_WIDTH),
                    height: toPercent(area.height, LOBBY_IMAGE_HEIGHT)
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
                    onClick={() => navigate(area.route)}
                    childrenWrapperClassName="flex items-end justify-center pb-4"
                  >
                    {area.label ? (
                    <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.35em]">
                      {area.label}
                    </span>
                    ) : null}
                  </DoorHitbox>
                </div>
              ))}
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
