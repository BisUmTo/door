import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGameStore } from "@/state/store";

const MenuRoute = () => {
  const { t } = useTranslation();
  const status = useGameStore((state) => state.status);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* SFONDO CON IMMAGINE */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/assets/lobby/sfondo_lobby.png')] bg-cover bg-center blur" />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* CONTENUTO */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[960px] flex-col items-center justify-center gap-12 px-6 py-12 text-center">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-white/60">
            {status === "loading" ? "Caricamento dati..." : "Benvenuto"}
          </p>
          <h1 className="mt-2 text-6xl font-display uppercase tracking-[0.6em] text-white drop-shadow">
            {t("menu.title")}
          </h1>
        </div>

        {/* MENU */}
        <nav className="flex w-full max-w-xs flex-col gap-4">
          <Link
            to="/settings"
            className="rounded-full border border-white/30 px-6 py-3 text-lg font-semibold uppercase tracking-widest transition hover:-translate-y-1 hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            {t("menu.settings")}
          </Link>

          {/* GIOCA DEMO - Marrone con testo bianco */}
          <Link
            to="/lobby"
            className="rounded-full border border-[#a67c52] bg-[#a67c52] px-6 py-3 text-lg font-semibold uppercase tracking-widest text-white transition hover:-translate-y-1 hover:bg-[#8b5e34] hover:border-[#8b5e34]"
          >
            {t("menu.play")}
          </Link>

          <Link
            to="/saves"
            className="rounded-full border border-white/30 px-6 py-3 text-lg font-semibold uppercase tracking-widest transition hover:-translate-y-1 hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            {t("menu.saves")}
          </Link>

          <Link
            to="/credits"
            className="rounded-full border border-white/30 px-6 py-3 text-lg font-semibold uppercase tracking-widest transition hover:-translate-y-1 hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            {t("menu.credits")}
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default MenuRoute;
