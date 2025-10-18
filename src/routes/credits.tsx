import { Link } from "react-router-dom";

const CreditsRoute = () => {
  const contributors = [
    { name: "Luca Bertotto", role: "Project Manager & Graphics" },
    { name: "Marco Bertotto", role: "Development Support" },
    { name: "Matteo Bertotto", role: "Game Design & Rules" },
    { name: "Kevin Delugan", role: "Graphics & Prototype Development" },
    { name: "Philip Fleckinger", role: "Database Design & Game Logic" }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* SFONDO */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/assets/lobby/sfondo_lobby.png')] bg-cover bg-center blur" />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* CONTENITORE PRINCIPALE */}
      <div className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col items-center gap-10 px-6 py-12 text-center">

        {/* HEADER */}
        <header className="flex w-full items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
          <span>Crediti</span>
          <Link
            to="/"
            className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest transition hover:border-accent hover:text-accent"
          >
            Torna al menu
          </Link>
        </header>

        {/* TITOLO */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <h1 className="text-5xl font-display uppercase tracking-[0.5em] text-white drop-shadow">
            B8 Studios
          </h1>
          <p className="max-w-lg text-sm text-white/60">
            Un progetto creato con passione dal team B8 Studios. Grazie per aver aperto le nostre porte.
          </p>
        </div>

        {/* LISTA CREDITI */}
        <ul className="w-full space-y-4 text-center">
          {contributors.map((entry) => (
            <li
              key={entry.name}
              className="rounded-3xl border border-white/15 bg-white/10 py-4 px-4 backdrop-blur transition hover:bg-white/20"
            >
              <span className="block text-xs uppercase tracking-[0.3em] text-white/60 mb-1">
                {entry.role}
              </span>
              <span className="block text-lg font-semibold tracking-[0.25em] text-white">
                {entry.name}
              </span>
            </li>
          ))}
        </ul>

        {/* BOTTONE FINALE */}
        
      </div>
    </div>
  );
};

export default CreditsRoute;
