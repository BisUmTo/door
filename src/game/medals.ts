import type { DoorType, MedalResource, Resource } from "./types";

export interface MedalDefinition {
  type: DoorType;
  name: string;
  color: string;
  description: string;
  dropRate: number;
}

const DEFAULT_DROP_RATE = 0.002;

const doorLabels: Record<DoorType, string> = {
  white: "Porta Bianca",
  black: "Porta Nera",
  red: "Porta Rossa",
  orange: "Porta Arancione",
  yellow: "Porta Gialla",
  purple: "Porta Viola",
  blue: "Porta Blu",
  lightBlue: "Porta Azzurra",
  brown: "Porta Marrone",
  lime: "Porta Lime",
  green: "Porta Verde",
  neutral: "Porta Neutra"
};

const defaultDescriptions: Record<DoorType, string> = {
  white: "Ricompense bilanciate, ottima per iniziare a collezionare risorse.",
  black: "Ricompense rare con alta probabilità di armature.",
  red: "Elevato rischio ma ottime ricompense offensive.",
  orange: "Garantisce loot legati ai potenziamenti tattici.",
  yellow: "Concentrata su risorse economiche e pacchetti cibo.",
  purple: "Medaglione collegato a drop magici e speciali.",
  blue: "Ricompense dedicate alle risorse energetiche.",
  lightBlue: "Favorisce loot supporto e acceleratori di progressione.",
  brown: "Specializzata in risorse difensive e costruzione.",
  lime: "Ricompense ibride tra supporto e potenziamenti rari.",
  green: "Focus su equipaggiamento animale e potenziamenti.",
  neutral: "Loot generico utile per completare collezioni mancanti."
};

const doorColors: Record<DoorType, string> = {
  white: "#e5e5e5",
  black: "#1f2937",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#facc15",
  purple: "#a855f7",
  blue: "#3b82f6",
  lightBlue: "#22d3ee",
  brown: "#92400e",
  lime: "#84cc16",
  green: "#059669",
  neutral: "#9ca3af"
};

export const MEDAL_DEFINITIONS: MedalDefinition[] = (Object.keys(doorLabels) as DoorType[]).map(
  (type) => ({
    type,
    name: `Medaglietta ${doorLabels[type]}`,
    color: doorColors[type] ?? "#9ca3af",
    description: defaultDescriptions[type],
    dropRate: DEFAULT_DROP_RATE
  })
);

export const isMedalResource = (resource: Resource): resource is MedalResource => {
  return typeof resource === "string" && resource.startsWith("medal_");
};

export const doorTypeToMedalResource = (door: DoorType): MedalResource => {
  return `medal_${door}`;
};

export const medalResourceToDoorType = (resource: MedalResource): DoorType => {
  return resource.replace("medal_", "") as DoorType;
};

export const getMedalDefinition = (type: DoorType): MedalDefinition | undefined => {
  return MEDAL_DEFINITIONS.find((entry) => entry.type === type);
};
