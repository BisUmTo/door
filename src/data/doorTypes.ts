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
    summary: "Ricompense bilanciate con piccole quantità di risorse per ogni categoria.",
    uniqueRewards: ["Piccoli pacchetti di cibo", "Munizioni base"],
    conflicts: "Blocca temporaneamente le porte Rosse e Nere per 1 turno."
  },
  {
    type: "black",
    summary: "Ricompense rare orientate alle armature e ai potenziamenti difensivi.",
    uniqueRewards: ["Frammenti di armatura", "Bonus difesa"],
    conflicts: "Blocca le porte Gialle per 2 turni."
  },
  {
    type: "red",
    summary: "Fornisce risorse offensive e munizioni ad alto impatto.",
    uniqueRewards: ["Munizioni speciali", "Boost danno"],
    conflicts: "Blocca le porte Blu e Verde per 2 turni."
  },
  {
    type: "orange",
    summary: "Ricompense legate ai potenziamenti tattici e alle risorse miste.",
    uniqueRewards: ["Pacchetti misti", "Carte evento"],
    conflicts: "Blocca le porte Bianche per 1 turno."
  },
  {
    type: "yellow",
    summary: "Grande quantità di monete e acceleratori di progressione.",
    uniqueRewards: ["Sacchetti di monete", "Coupon negozio"],
    conflicts: "Blocca le porte Lime per 1 turno."
  },
  {
    type: "purple",
    summary: "Ricompense speciali e oggetti rari dalla collezione.",
    uniqueRewards: ["Oggetti unici", "Potenziamenti magici"],
    conflicts: "Blocca le porte Azzurre per 2 turni."
  },
  {
    type: "blue",
    summary: "Loot energetici, ottimi per rigenerare stamina e cibo.",
    uniqueRewards: ["Stimolanti stamina", "Scorte di cibo"],
    conflicts: "Blocca le porte Arancioni per 1 turno."
  },
  {
    type: "lightBlue",
    summary: "Supporto e potenziamenti logistici utili a lungo termine.",
    uniqueRewards: ["Componenti casa", "Potenziamenti incubatrice"],
    conflicts: "Blocca le porte Viola per 1 turno."
  },
  {
    type: "brown",
    summary: "Ricompense dedicate alle strutture della casa e bonus di costruzione.",
    uniqueRewards: ["Pezzi arredamento", "Bonus produzione"],
    conflicts: "Blocca le porte Bianche per 1 turno."
  },
  {
    type: "lime",
    summary: "Potenziamenti ibridi che combinano stamina e risorse speciali.",
    uniqueRewards: ["Pozioni stamina", "Pacchetti misti"],
    conflicts: "Blocca le porte Gialle per 1 turno."
  },
  {
    type: "green",
    summary: "Ricompense per il potenziamento degli animali e del nutrimento.",
    uniqueRewards: ["Cibo di alta qualità", "Upgrade animali"],
    conflicts: "Blocca le porte Rosse per 1 turno."
  },
  {
    type: "neutral",
    summary: "Loot generico utile per completare set mancanti e materiali di supporto.",
    uniqueRewards: ["Materiali vari", "Loot casuale"],
    conflicts: "Non genera Contrasti, ma ha drop limitati."
  }
];

export const getDoorTypeDefinitions = () =>
  definitions.map((definition) => ({
    ...definition,
    name: doorLabels[definition.type]
  }));

  