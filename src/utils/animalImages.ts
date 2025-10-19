import type { AnimalConfig } from "@/game/types";
import { assetUrl } from "@/utils/assetUrl";

const ANIMAL_ICON_BASE = assetUrl("/assets/animali/icona");
// Usa un'icona generica esistente come fallback
const FALLBACK_ANIMAL_IMG = assetUrl("/assets/animali/icona/gatto.png");

/**
 * Converte una stringa in formato slug (lowercase, no spazi, no caratteri speciali)
 * Es: "Lupo Grigio" -> "lupo_grigio"
 * Es: "Orso" -> "orso" (prende solo la prima parola)
 */
export const toSlug = (s: string): string => {
  const normalized = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Prende solo la prima parola per matchare le icone
  const firstWord = normalized.split(/\s+/)[0];

  return firstWord.replace(/[^a-z0-9]/g, "");
};

/**
 * Risolve il percorso dell'immagine icona di un animale
 * Cerca in ordine:
 * 1. Se config.image esiste, usa quello
 * 2. Se config.kind esiste, usa /assets/animali/icona/{kind}.png
 * 3. Altrimenti usa placeholder
 */
export const resolveAnimalIconImage = (config: AnimalConfig | null): string => {
  if (!config) return FALLBACK_ANIMAL_IMG;

  // Se ha già un'immagine specifica, usala
  if ("image" in config && config.image) {
    const value = String(config.image);
    if (value.startsWith("/assets/") || value.startsWith("assets/")) {
      return assetUrl(value);
    }
    return value;
  }

  // Altrimenti costruisci il path dalla kind
  if (config.kind) {
    return `${ANIMAL_ICON_BASE}/${toSlug(config.kind)}.png`;
  }

  // Fallback generico
  return FALLBACK_ANIMAL_IMG;
};

/**
 * Gestisce l'errore di caricamento immagine, sostituendo con placeholder
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>
): void => {
  const target = e.currentTarget;
  if (target.src !== FALLBACK_ANIMAL_IMG) {
    target.src = FALLBACK_ANIMAL_IMG;
  }
};
