import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import it from "./it.json";
import en from "./en.json";

const initialLanguage = (() => {
  if (typeof window === "undefined") return "it";
  const stored = localStorage.getItem("gc:settings");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { language?: string } };
      if (parsed?.state?.language) {
        return parsed.state.language;
      }
    } catch {
      // ignore parse failure
    }
  }
  return navigator.language?.split("-")[0] ?? "it";
})();

void i18n.use(initReactI18next).init({
  resources: {
    it: { translation: it },
    en: { translation: en }
  },
  lng: initialLanguage,
  fallbackLng: "it",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
