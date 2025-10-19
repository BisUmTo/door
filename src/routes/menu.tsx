import { useCallback, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useGameStore } from "@/state/store";
import { assetUrl } from "@/utils/assetUrl";

const MenuRoute = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isStartingDemo, setIsStartingDemo] = useState(false);
  const { status, slots, createSlot } = useGameStore((state) => ({
    status: state.status,
    slots: state.slots,
    createSlot: state.createSlot
  }));

  const handlePlayDemo = useCallback(
    async (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (isStartingDemo) return;

      setIsStartingDemo(true);
      try {
        if (!slots.length) {
          await createSlot();
        }
        navigate("/lobby");
      } catch (error) {
        console.error("Unable to start demo", error);
      } finally {
        setIsStartingDemo(false);
      }
    },
    [createSlot, isStartingDemo, navigate, slots.length]
  );

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* SFONDO CON IMMAGINE */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center blur"
          style={{ backgroundImage: `url(${assetUrl("/assets/lobby/sfondo_lobby.png")})` }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* CONTENUTO */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[960px] flex-col items-center justify-center gap-12 px-6 py-12 text-center">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-white/60">
            {status === "loading" ? "Caricamento dati..." : "Benvenuto"}
          </p>
        <img
          src={assetUrl("/assets/logo/logo.png")}
          alt="Titolo del gioco"
          className="mt-2 h-auto w-60 drop-shadow-lg"
        />
        </div>

        {/* MENU */}
        <nav className="flex w-full max-w-xs flex-col gap-4">

          {/* GIOCA DEMO - Marrone con testo bianco */}
          <Link
            to="/lobby"
            onClick={handlePlayDemo}
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
          <br></br>
          <Link
            to="/settings"
            className="rounded-full border border-white/30 px-6 py-3 text-lg font-semibold uppercase tracking-widest transition hover:-translate-y-1 hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            {t("menu.settings")}
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
