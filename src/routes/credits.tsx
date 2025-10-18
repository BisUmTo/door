import { Link } from "react-router-dom";

const CreditsRoute = () => {
  const contributors = [
    { role: "Design & Gameplay", name: "Juvenes" },
    { role: "Development", name: "GPT-5 Codex" },
    { role: "Assets", name: "Mock JSON placeholders" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-black px-6 py-10 text-white">
      <header className="flex items-center justify-between uppercase tracking-[0.4em] text-white/60">
        <span>Crediti</span>
        <Link
          to="/"
          className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest hover:border-accent hover:text-accent"
        >
          Menu
        </Link>
      </header>

      <ul className="mt-10 space-y-4 text-sm">
        {contributors.map((entry) => (
          <li key={entry.role} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <span className="block text-xs uppercase text-white/50">{entry.role}</span>
            <span className="text-lg font-semibold text-white">{entry.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreditsRoute;
