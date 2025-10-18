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
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-background py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl bg-black/70 p-8 text-white">
        <header className="flex items-center justify-between gap-4">
          <h2 className="text-3xl font-display uppercase tracking-[0.4em]">
            {t("settings.title")}
          </h2>
          <Link
            to="/"
            className="rounded-full border border-white/30 px-4 py-2 text-sm uppercase tracking-widest hover:border-accent hover:text-accent"
          >
            {t("settings.back")}
          </Link>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
                className="w-64 accent-accent"
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
                className="w-64 accent-accent"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm uppercase tracking-[0.4em] text-white/60">Lingua</h3>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="mt-4 w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2 text-white focus:border-accent focus:outline-none"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-background text-white">
                {lang.label}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm uppercase tracking-[0.4em] text-white/60">Accessibilit\u00e0</h3>
          <label className="mt-3 flex items-center justify-between text-sm text-white/80">
            <span>Riduci animazioni</span>
            <input
              type="checkbox"
              checked={ui.reducedMotion}
              onChange={toggleReducedMotion}
              className="h-5 w-5 accent-accent"
            />
          </label>
        </section>
      </div>
    </div>
  );
};

export default SettingsRoute;
