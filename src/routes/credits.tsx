import { Link } from "react-router-dom";

const CreditsRoute = () => {
  const contributors = [
    "Luca Bertotto",
    "Marco Bertotto",
    "Matteo Bertotto",
    "Kevin Delugan",
    "Philip Fleckinger"
  ];

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/assets/lobby/sfondo_lobby.png')] bg-cover bg-center blur" />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col items-center gap-10 px-6 py-12 text-center">
        <header className="flex w-full items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
          <span>Crediti</span>
          <Link
            to="/"
            className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest transition hover:border-accent hover:text-accent"
          >
            Torna al menu
          </Link>
        </header>

        <div className="mt-8 flex flex-col items-center gap-4">
          <h1 className="text-5xl font-display uppercase tracking-[0.5em] text-white drop-shadow">
            B8 Studios
          </h1>
          <p className="max-w-lg text-sm text-white/60">
            Un progetto creato con passione dal team B8 Studios. Grazie per aver aperto le nostre porte.
          </p>
        </div>

        <ul className="w-full space-y-4 text-center text-lg font-semibold text-white/80">
          {contributors.map((name) => (
            <li
              key={name}
              className="rounded-3xl border border-white/15 bg-white/10 py-4 uppercase tracking-[0.3em] text-white/70 backdrop-blur"
            >
              {name}
            </li>
          ))}
        </ul>

        <Link
          to="/"
          className="mt-auto rounded-full border border-white/30 px-6 py-2 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:border-accent hover:text-accent"
        >
          Torna al menu principale
        </Link>
      </div>
    </div>
  );
};

export default CreditsRoute;
