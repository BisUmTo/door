import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DoorHitbox from "@/components/DoorHitbox";
import Tooltip from "@/components/Tooltip";
import { useGameStore } from "@/state/store";

const HouseRoute = () => {
  const save = useGameStore((state) => state.save);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const visibleObjects = useMemo(() => {
    if (!save) return [];
    return save.house.objects.filter((object) => object.piecesOwned > 0 || object.unlocked);
  }, [save]);

  const selectedObject = visibleObjects.find((object) => object.id === selectedId) ?? null;

  return (
    <div className="relative min-h-screen px-6 py-10 text-white">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/casa/sfondo_casa.png)' }}
      />
      <div className="relative z-10">
      <header className="flex items-center justify-between uppercase tracking-[0.4em] text-white/60">
        <span>Casa</span>
        <Link
          to="/lobby"
          className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest hover:border-accent hover:text-accent"
        >
          Lobby
        </Link>
      </header>

      <main className="mt-10 grid gap-6 md:grid-cols-3">
        {visibleObjects.length === 0 ? (
          <p className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
            Trova pezzi nell'avventura per iniziare ad arredare la casa.
          </p>
        ) : (
          visibleObjects.map((object) => (
            <DoorHitbox
              key={object.id}
              hitboxPath="/assets/house/object.json"
              width={200}
              height={120}
              onClick={() => setSelectedId(object.id)}
              className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 transition hover:border-accent hover:text-accent"
            >
              <div className="flex flex-col gap-2 text-left">
                <span className="text-lg font-semibold text-white">{object.name}</span>
                <span className="text-xs uppercase text-white/50">
                  {object.piecesOwned}/{object.piecesNeeded} pezzi
                </span>
                <span className="text-xs text-white/60">
                  {object.unlocked ? "Completato" : "Incompleto"}
                </span>
              </div>
            </DoorHitbox>
          ))
        )}
      </main>

      {selectedObject ? (
        <div className="fixed bottom-10 left-1/2 z-40 w-full max-w-md -translate-x-1/2">
          <Tooltip
            title={selectedObject.name}
            description={selectedObject.unlocked ? `Bonus ogni ${selectedObject.bonus.turnsCooldown} turni` : undefined}
          />
          <div className="mt-2 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm">
            {selectedObject.unlocked ? (
              <>
                <p className="text-white/80">
                  Bonus: {Array.isArray(selectedObject.bonus.amount)
                    ? selectedObject.bonus.amount.join(", ")
                    : selectedObject.bonus.amount}
                </p>
                <p className="text-white/60">
                  Turni al prossimo bonus: {selectedObject.turnsToNextBonus ?? "-"}
                </p>
              </>
            ) : (
              <p className="text-white/70">
                Pezzi mancanti: {selectedObject.piecesNeeded - selectedObject.piecesOwned}
              </p>
            )}
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
};

export default HouseRoute;
