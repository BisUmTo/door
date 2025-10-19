import { doorLabels } from "@/components/Door";
import type { DoorType } from "@/game/types";

export interface DoorTypeDefinition {
  type: DoorType;
  summary: string;
  uniqueRewards: string[];
  conflicts: string;
}

const definitions: DoorTypeDefinition[] = [
  {
    type: "white",
    summary: "Permette di accumulare ricchezza con costanza, ma limita l’accesso a opportunità più vantaggiose.",
    uniqueRewards: ["Monete (3–7)", "Cibo (1–3)"],
    conflicts: "Blocca la porta Gialla per 1–2 turni."
  },
  {
    type: "black",
    summary: "Imprevedibile e instabile: può alterare l’equilibrio delle scelte, con rischi elevati e ricompense incerte.",
    uniqueRewards: [],
    conflicts: "Blocca la porta Arancione e 2 porte casuali diverse per 3–5 turni."
  },
  {
    type: "red",
    summary: "Rafforza la potenza offensiva, ma riduce il controllo e la capacità di adattamento.",
    uniqueRewards: ["Proiettili (1–2)", "Granata (1)"],
    conflicts: "Blocca la porta Blu e Verde chiaro per 2–4 turni."
  },
  {
    type: "orange",
    summary: "Potenzia la difesa delle creature alleate, ma rallenta la preparazione e il recupero.",
    uniqueRewards: ["Armatura (1)", "Granata (1)"],
    conflicts: "Blocca la porta Verde chiaro e Verde scuro per 3–5 turni."
  },
  {
    type: "yellow",
    summary: "Amplia le risorse economiche, ma può saturare il mercato e indebolire altre fonti di guadagno.",
    uniqueRewards: ["Monete (5–25)"],
    conflicts: "Blocca la porta Bianca e Gialla per 1–3 turni."
  },
  {
    type: "purple", // Rosa/Viola
    summary: "Favorisce la crescita e la sostenibilità, ma tende a sbilanciare la stabilità generale.",
    uniqueRewards: ["Cibo (3–7)", "Monete (3–7)"],
    conflicts: "Blocca la porta Verde scuro e Marrone per 2–3 turni."
  },
  {
    type: "blue",
    summary: "Aumenta la forza dell’arsenale, ma limita l’accesso a risorse di supporto e flessibilità.",
    uniqueRewards: ["Cartucce (1–3)", "Granata (1)"],
    conflicts: "Blocca la porta Rossa e Arancione per 3–4 turni."
  },
  {
    type: "lightBlue",
    summary: "Offre equilibrio e precisione, ma richiede una gestione attenta per non perdere slancio.",
    uniqueRewards: ["Frecce (1–4)", "Dardi (1–4)"],
    conflicts: "Blocca la porta Verde scuro per 2–3 turni."
  },
  {
    type: "brown",
    summary: "Fornisce una protezione moderata e costante, ma rende più difficili alcune scelte future.",
    uniqueRewards: ["Armatura (1)"],
    conflicts: "Blocca la porta Arancione e Verde chiaro per 3–4 turni."
  },
  {
    type: "lime",
    summary: "Favorisce la sopravvivenza e la resistenza, ma riduce la spinta offensiva.",
    uniqueRewards: ["Cibo (20)"],
    conflicts: "Blocca la porta Rossa, Blu e Azzurra per 2–4 turni."
  },
  {
    type: "green",
    summary: "Bilancia potenza e sostegno, ma limita l’aggressività diretta nel lungo periodo.",
    uniqueRewards: ["Dardi (1–3)", "Cibo (3–7)"],
    conflicts: "Blocca la porta Azzurra e Rossa per 2–3 turni."
  },
  {
    type: "neutral",
    summary: "Sempre accessibile. Mantiene aperto il percorso e consente di proseguire anche nei momenti più critici, sebbene con basse probabilità di trovare ricompense.",
    uniqueRewards: [
      "Monete (1–3)",
      "Cibo (1–3)",
      "Dardi (1–3)",
      "Frecce (1–3)",
      "Proiettili (1–2)",
      "Cartucce (1)",
      "Granate (1)"
    ],
    conflicts: "Blocca la porta Nera per 1 turno."
  }
];



export const getDoorTypeDefinitions = () =>
  definitions.map((definition) => ({
    ...definition,
    name: doorLabels[definition.type]
  }));

  