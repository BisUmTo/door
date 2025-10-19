import type { ChestRarity } from "./types";
import { assetUrl } from "@/utils/assetUrl";

export interface ChestDefinition {
  id: ChestRarity;
  name: string;
  image: string;
  accent: string;
  description: string;
}

export const CHEST_DEFINITIONS: ChestDefinition[] = [
  {
    id: "common",
    name: "Baule Comune",
    image: assetUrl("/assets/bauli/legno.png"),
    accent: "#f59e0b",
    description: "Contiene risorse di base utili a rinforzare l'equipaggiamento."
  },
  {
    id: "uncommon",
    name: "Baule Non Comune",
    image: assetUrl("/assets/bauli/bronzo.png"),
    accent: "#ec4899",
    description: "Ricompense migliorate con possibilità di trovare potenziamenti rari."
  },
  {
    id: "rare",
    name: "Baule Raro",
    image: assetUrl("/assets/bauli/argento.png"),
    accent: "#38bdf8",
    description: "Loot prezioso concentrato su risorse avanzate e armature."
  },
  {
    id: "epic",
    name: "Baule Epico",
    image: assetUrl("/assets/bauli/oro.png"),
    accent: "#f97316",
    description: "Ricompense di alto livello con possibilità di oggetti speciali."
  },
  {
    id: "legendary",
    name: "Baule Leggendario",
    image: assetUrl("/assets/bauli/diamante.png"),
    accent: "#c084fc",
    description: "Contiene le ricompense più rare, inclusi oggetti unici."
  }
];

export const getChestDefinition = (rarity: ChestRarity): ChestDefinition => {
  const definition = CHEST_DEFINITIONS.find((entry) => entry.id === rarity);
  return (
    definition ?? {
      id: rarity,
      name: `Baule ${rarity}`,
      image: assetUrl("/assets/bauli/legno.png"),
      accent: "#a67c52",
      description: "Contiene una selezione casuale di ricompense."
    }
  );
};
