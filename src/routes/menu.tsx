import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGameStore } from "@/state/store";

const MenuRoute = () => {
  const { t } = useTranslation();
  const status = useGameStore((state) => state.status);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background to-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2e1065_0%,_transparent_55%)] opacity-60" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-12 text-center">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-white/60">
            {status === "loading" ? "Caricamento dati..." : "Benvenuto"}
          </p>
          <h1 className="mt-2 text-6xl font-display uppercase tracking-[0.6em] text-white drop-shadow-glow">
            {t("menu.title")}
          </h1>
        </div>

        <nav className="flex w-full max-w-xs flex-col gap-4">
          <Link
            to="/settings"
            className="rounded-full border border-white/30 px-6 py-3 text-lg font-semibold uppercase tracking-widest transition hover:-translate-y-1 hover:border-accent hover:text-accent"
          >
            {t("menu.settings")}
          </Link>
          <Link
            to="/lobby"
            className="rounded-full border border-accent bg-accent px-6 py-3 text-lg font-semibold uppercase tracking-widest text-black transition hover:-translate-y-1 hover:bg-accent/90"
          >
            {t("menu.play")}
          </Link>
          <Link
            to="/saves"
            className="rounded-full border border-white/30 px-6 py-3 text-lg font-semibold uppercase tracking-widest transition hover:-translate-y-1 hover:border-accent hover:text-accent"
          >
            {t("menu.saves")}
          </Link>
          <Link
            to="/credits"
            className="rounded-full border border-white/30 px-6 py-3 text-lg font-semibold uppercase tracking-widest transition hover:-translate-y-1 hover:border-accent hover:text-accent"
          >
            {t("menu.credits")}
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default MenuRoute;
