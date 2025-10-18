import { Link } from "react-router-dom";

const CreditsRoute = () => {
  const contributors = [
    { role: "Graphics & Project Manager", name: "Luca Bertotto" },
    { role: "Game Design & Rules", name: "Matteo Bertotto" },
    { role: "Graphics & Prototype Development", name: "Kevin Delugan" },
    { role: "Database Design & Game Logic", name: "Philip Fleckinger" },
    { role: "Development Support", name: "Marco Bertotto" }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-background to-black px-6 py-10 text-white relative">

      {/* HEADER */}
      <header className="absolute top-6 left-6 right-6 flex items-center justify-between">
        {/* Crediti in alto a sinistra */}
        <span className="uppercase tracking-[0.4em] text-white/60 text-xs">Crediti</span>

        {/* Bottone Menu in alto a destra */}
        <Link
          to="/"
          className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest hover:border-accent hover:text-accent"
        >
          Menu
        </Link>
      </header>

      {/* Titolo centrale */}
      <h1 className="absolute top-20 text-[5rem] sm:text-[6rem] font-extrabold tracking-[0.15em] text-center bg-gradient-to-r from-purple-300 via-pink-400 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
        B8 STUDIOS
      </h1>

      {/* Lista crediti */}
      <ul className="w-full max-w-md mt-32 space-y-4 text-center text-sm">
        {contributors.map((entry) => (
          <li
            key={entry.role}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <span className="block text-xs uppercase text-white/50">{entry.role}</span>
            <span className="text-lg font-semibold text-white">{entry.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreditsRoute;
