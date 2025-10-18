import { Link } from "react-router-dom";
import { getDoorTypeDefinitions } from "@/data/doorTypes";

const DoorTypesRoute = () => {
  const definitions = getDoorTypeDefinitions();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#101321] to-[#050608] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <h1 className="text-4xl font-display uppercase tracking-[0.5em] text-white/80">
              Tipologia Porte
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Ogni porta offre ricompense uniche e può bloccarne temporaneamente altre.
            </p>
          </div>
          <Link
            to="/lobby"
            className="rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:border-accent hover:text-accent"
          >
            Torna alla lobby
          </Link>
        </header>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur lg:grid-cols-2">
          {definitions.map((definition) => (
            <article
              key={definition.type}
              className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-5"
            >
              <header className="flex items-baseline justify-between">
                <h2 className="text-xl font-semibold uppercase tracking-[0.35em] text-white/80">
                  {definition.name}
                </h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white/50">
                  {definition.type}
                </span>
              </header>
              <p className="text-sm text-white/70">{definition.summary}</p>
              <div>
                <h3 className="text-xs uppercase tracking-[0.35em] text-white/50">Ricompense</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
                  {definition.uniqueRewards.map((reward) => (
                    <li key={reward}>{reward}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                <span className="block uppercase tracking-[0.35em] text-white/40">
                  Conflitto
                </span>
                <p className="mt-1 text-sm text-white/70">{definition.conflicts}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default DoorTypesRoute;
