import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Door } from "@/components/Door";
import InfoPanel from "@/components/InfoPanel";
import DoorHitbox from "@/components/DoorHitbox";
import { useGameStore } from "@/state/store";
import { useLobbyDoors } from "@/state/selectors";

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

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/lobby/sfondo_lobby.png)' }}
      />
      <div className="relative z-10 flex min-h-screen flex-col justify-between px-8 py-10">
        <header className="flex items-center justify-between text-sm uppercase tracking-[0.5em] text-white/60">
          <span>Lobby</span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rotate-6 rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest text-white hover:border-accent hover:text-accent"
          >
            Exit
          </button>
        </header>

        <main className="flex flex-1 items-center justify-between gap-10">
          <button
            type="button"
            onClick={() => navigate("/house")}
            className="relative flex w-48 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-6 text-sm uppercase tracking-[0.3em] text-white/80 transition hover:-translate-x-1 hover:border-accent hover:text-accent"
          >
            <span className="rotate-[-8deg] text-xs text-white/60">Casa</span>
            <span className="text-lg font-semibold">Ingresso</span>
          </button>

          <div className="flex flex-1 items-end justify-center gap-8">
            {doors.map((doorType) => {
              const blocked = save?.progress.blockedDoors.find(
                (entry) => entry.type === doorType
              );
              return (
                <Door
                  key={doorType}
                  type={doorType}
                  blockedFor={blocked?.turnsLeft}
                  onOpen={() => handleDoorClick(doorType)}
                />
              );
            })}
          </div>

          <div className="flex flex-col items-end gap-4">
            {save ? (
              <InfoPanel
                doorsOpened={save.progress.doorsOpened}
                turn={save.progress.turn}
                blockedDoors={save.progress.blockedDoors}
              />
            ) : null}
            <DoorHitbox
              hitboxPath="/assets/lobby/pulsanti/baule.json"
              width={200}
              height={120}
              onClick={() => navigate("/chest")}
              className="mt-4"
            >
              <div className="rounded-lg border border-yellow-400/40 bg-yellow-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-yellow-200">
                Baule
              </div>
            </DoorHitbox>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LobbyRoute;
