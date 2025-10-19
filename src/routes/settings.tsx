import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useSettingsStore } from "@/state/settings";

const languages = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" }
];

const SettingsRoute = () => {
  const { t, i18n } = useTranslation();
  const { language, audio, ui, setLanguage, setAudio, toggleReducedMotion } = useSettingsStore();

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* SFONDO CON IMMAGINE E OVERLAY */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/assets/lobby/sfondo_lobby.png')] bg-cover bg-center blur" />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* CONTENUTO */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4">
          <h2 className="text-3xl font-display uppercase tracking-[0.4em]">
            {t("settings.title")}
          </h2>
          <Link
            to="/"
            className="rounded-full border border-white/30 px-4 py-2 text-sm uppercase tracking-widest transition hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            {t("settings.back")}
          </Link>
        </header>

        {/* SEZIONE AUDIO */}
        <section className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/20">
          <h3 className="text-sm uppercase tracking-[0.4em] text-white/60">Audio</h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between gap-4 text-sm text-white/80">
              <span>SFX</span>
              <input
                type="range"
                min={0}
                max={100}
                value={audio.sfx}
                onChange={(event) => setAudio({ sfx: Number(event.target.value) })}
                className="w-64 accent-[#a67c52]"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-white/80">
              <span>Musica</span>
              <input
                type="range"
                min={0}
                max={100}
                value={audio.music}
                onChange={(event) => setAudio({ music: Number(event.target.value) })}
                className="w-64 accent-[#a67c52]"
              />
            </label>
          </div>
        </section>

        {/* SEZIONE LINGUA */}
        <section className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/20">
          <h3 className="text-sm uppercase tracking-[0.4em] text-white/60">Lingua</h3>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="mt-4 w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2 text-white focus:border-[#a67c52] focus:outline-none"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-background text-white">
                {lang.label}
              </option>
            ))}
          </select>
        </section>

        {/* SEZIONE ACCESSIBILITÀ */}
        <section className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/20">
          <h3 className="text-sm uppercase tracking-[0.4em] text-white/60">Accessibilità</h3>
          <label className="mt-3 flex items-center justify-between text-sm text-white/80">
            <span>Riduci animazioni</span>
            <input
              type="checkbox"
              checked={ui.reducedMotion}
              onChange={toggleReducedMotion}
              disabled={true}
              className="h-5 w-5 accent-[#a67c52]"
            />
          </label>
        </section>
      </div>
    </div>
  );
};

export default SettingsRoute;
