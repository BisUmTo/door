import {
  AmmoKind,
  AnimalConfig,
  DoorLootTable,
  DoorLootTableRaw,
  DoorType,
  Resource,
  WeaponName
} from "@/game/types";

const sanitize = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const normalizeFurnitureName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const furnitureAliasDefinitions: Array<{ id: number; names: string[] }> = [
  { id: 1, names: ["poltrona", "poltrone"] },
  { id: 2, names: ["mensola", "mensole"] },
  { id: 3, names: ["tavolino", "tavolini"] },
  { id: 4, names: ["sedia", "sedie"] }
];

const furnitureNameToId = (() => {
  const map = new Map<string, number>();
  for (const { id, names } of furnitureAliasDefinitions) {
    for (const name of names) {
      const key = normalizeFurnitureName(name);
      if (key.length > 0 && !map.has(key)) {
        map.set(key, id);
      }
    }
  }
  return map;
})();

const furniturePrefixes = [
  "pezzi arredamento",
  "pezzi di arredamento",
  "pezzo arredamento",
  "pezzo di arredamento",
  "pezzi arredamento della casa",
  "pezzo arredamento della casa",
  "arredamento"
];

const stripFurnitureArticles = (value: string) => {
  return value.replace(/^(di|del|della|dell'|dei|degli|delle|la|il|lo|le|gli|i)\s+/u, "");
};

const normalizeFurnitureLoot = (raw: string): Resource | null => {
  const base = sanitize(raw);
  const remainderToKey = (value: string) => {
    const trimmed = value.trim().replace(/^[-:]+/, "").trim();
    if (!trimmed) return "";
    const withoutArticles = stripFurnitureArticles(trimmed);
    return normalizeFurnitureName(withoutArticles);
  };

  for (const prefix of furniturePrefixes) {
    if (base.startsWith(prefix)) {
      const remainder = remainderToKey(base.slice(prefix.length));
      if (!remainder) {
        return "housePiece:any";
      }
      const targetId = furnitureNameToId.get(remainder);
      if (typeof targetId === "number") {
        return `housePiece:${targetId}`;
      }
      return "housePiece:any";
    }
  }

  const direct = furnitureNameToId.get(normalizeFurnitureName(raw));
  if (typeof direct === "number") {
    return `housePiece:${direct}`;
  }

  return null;
};

const doorAliasPairs: Array<[string, DoorType]> = [
  ["\u26aa bianca", "white"],
  ["bianca", "white"],
  ["white", "white"],
  ["\u26ab nera", "black"],
  ["nera", "black"],
  ["black", "black"],
  ["\ud83d\udd34 rossa", "red"],
  ["rossa", "red"],
  ["red", "red"],
  ["\ud83d\udfe0 arancione", "orange"],
  ["arancione", "orange"],
  ["orange", "orange"],
  ["\ud83d\udfe1 gialla", "yellow"],
  ["gialla", "yellow"],
  ["yellow", "yellow"],
  ["\ud83d\udc9c rosa", "purple"],
  ["viola", "purple"],
  ["rosa", "purple"],
  ["purple", "purple"],
  ["\ud83d\udd35 blu", "blue"],
  ["blu", "blue"],
  ["blue", "blue"],
  ["\ud83d\udfe6 azzurra", "lightBlue"],
  ["azzurra", "lightBlue"],
  ["lightblue", "lightBlue"],
  ["\ud83d\udfe4 marrone", "brown"],
  ["marrone", "brown"],
  ["brown", "brown"],
  ["\ud83d\udf49 lime", "lime"],
  ["lime", "lime"],
  ["\ud83d\udfe9 verde scuro", "green"],
  ["verde", "green"],
  ["verde scuro", "green"],
  ["green", "green"],
  ["\u2699\ufe0f neutra", "neutral"],
  ["neutra", "neutral"],
  ["neutral", "neutral"]
];

const doorAliasMap = new Map<string, DoorType>(
  doorAliasPairs.map(([alias, canonical]) => [sanitize(alias), canonical])
);

const lootAliasPairs: Array<[string, Resource]> = [
  ["monete", "coins"],
  ["\ud83d\udcb0 monete", "coins"],
  ["coins", "coins"],
  ["cibo", "food"],
  ["\ud83c\udf57 cibo", "food"],
  ["food", "food"],
  ["armatura", "armor"],
  ["armature", "armor"],
  ["armor", "armor"],
  ["proiettili", "bullets"],
  ["pallottole", "bullets"],
  ["bullets", "bullets"],
  ["cartucce", "shells"],
  ["shells", "shells"],
  ["frecce", "arrows"],
  ["arrows", "arrows"],
  ["dardi", "darts"],
  ["darts", "darts"],
  ["granata", "grenades"],
  ["granate", "grenades"],
  ["grenades", "grenades"],
  ["oggetto speciale", "specialItem"],
  ["speciale", "specialItem"],
  ["special item", "specialItem"],
  ["pezzi arredamento", "housePiece:any"],
  ["pezzi di arredamento", "housePiece:any"],
  ["pezzo arredamento", "housePiece:any"],
  ["pezzo di arredamento", "housePiece:any"],
  ["arredamento", "housePiece:any"],
  ["nessuno", "none"],
  ["null", "none"],
  ["nessuna ricompensa", "none"],
  ["medaglietta bianca", "medal_white"],
  ["medaglia bianca", "medal_white"],
  ["badge bianca", "medal_white"],
  ["medaglietta nera", "medal_black"],
  ["medaglietta rossa", "medal_red"],
  ["medaglietta arancione", "medal_orange"],
  ["medaglietta gialla", "medal_yellow"],
  ["medaglietta viola", "medal_purple"],
  ["medaglietta blu", "medal_blue"],
  ["medaglietta azzurra", "medal_lightBlue"],
  ["medaglietta marrone", "medal_brown"],
  ["medaglietta lime", "medal_lime"],
  ["medaglietta verde", "medal_green"],
  ["medaglietta verde scuro", "medal_green"],
  ["medaglietta neutra", "medal_neutral"]
];

const lootAliasMap = new Map<string, Resource>(
  lootAliasPairs.map(([alias, canonical]) => [sanitize(alias), canonical])
);

const weaponAliasPairs: Array<[string, WeaponName]> = [
  ["fucile a pompa", "shotgun"],
  ["shotgun", "shotgun"],
  ["cerbottana", "blowgun"],
  ["blowgun", "blowgun"],
  ["lanciagranate", "grenadeLauncher"],
  ["grenade launcher", "grenadeLauncher"],
  ["arco semplice", "simpleBow"],
  ["arco", "simpleBow"],
  ["simple bow", "simpleBow"],
  ["pistola", "pistol"],
  ["pistol", "pistol"]
];

const weaponAliasMap = new Map<string, WeaponName>(
  weaponAliasPairs.map(([alias, canonical]) => [sanitize(alias), canonical])
);

const ammoMap = new Map<WeaponName, AmmoKind>([
  ["shotgun", "shells"],
  ["blowgun", "darts"],
  ["grenadeLauncher", "grenades"],
  ["simpleBow", "arrows"],
  ["pistol", "bullets"]
]);

const booleanTrue = new Set(["true", "si", "s\u00ec", "yes", "1"]);

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return booleanTrue.has(sanitize(value));
  return false;
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(`Unable to convert value "${value}" to number`);
};

const normalizeSize = (value: unknown): "Small" | "Large" => {
  const v = sanitize(String(value ?? ""));
  if (v.includes("piccol")) return "Small";
  if (v.includes("small")) return "Small";
  if (v.includes("grand") || v.includes("large")) return "Large";
  throw new Error(`Unknown size: ${value as string}`);
};

export const normalizeDoorKey = (raw: string): DoorType => {
  const canonical = doorAliasMap.get(sanitize(raw));
  if (!canonical) {
    throw new Error(`Unknown door type alias: ${raw}`);
  }
  return canonical;
};

export const normalizeLootKey = (raw: string): Resource => {
  const furniture = normalizeFurnitureLoot(raw);
  if (furniture) {
    return furniture;
  }
  const canonical = lootAliasMap.get(sanitize(raw));
  if (!canonical) {
    throw new Error(`Unknown loot alias: ${raw}`);
  }
  return canonical;
};

export const normalizeWeaponName = (raw: string): WeaponName => {
  const canonical = weaponAliasMap.get(sanitize(raw));
  if (!canonical) {
    throw new Error(`Unknown weapon alias: ${raw}`);
  }
  return canonical;
};

export const getWeaponAmmoKind = (weapon: WeaponName): AmmoKind => {
  const ammo = ammoMap.get(weapon);
  if (!ammo) {
    throw new Error(`Ammo type missing for weapon ${weapon}`);
  }
  return ammo;
};

export const normalizeAmmoKind = (raw: string): AmmoKind => {
  const resource = normalizeLootKey(raw);
  if (
    resource === "bullets" ||
    resource === "shells" ||
    resource === "arrows" ||
    resource === "darts" ||
    resource === "grenades"
  ) {
    return resource;
  }
  throw new Error(`Value "${raw}" is not a valid ammo kind`);
};

const bonusAliasMap = new Map<string, "Coins" | "Food" | "Ammo" | "Mixed">([
  ["coins", "Coins"],
  ["monete", "Coins"],
  ["credits", "Coins"],
  ["food", "Food"],
  ["cibo", "Food"],
  ["ammo", "Ammo"],
  ["munizioni", "Ammo"],
  ["mixed", "Mixed"],
  ["misto", "Mixed"]
]);

export const normalizeBonusType = (
  raw: string
): "Coins" | "Food" | "Ammo" | "Mixed" => {
  const canonical = bonusAliasMap.get(sanitize(raw));
  if (!canonical) {
    throw new Error(`Unknown bonus type alias: ${raw}`);
  }
  return canonical;
};

export interface AnimalConfigRaw {
  id: number | string;
  animale: string;
  vita: number | string;
  danno: number | string;
  velocita_di_attacco: number | string;
  eta: string;
  stamina_max: number | string;
  upgradable_armature: boolean | string | number;
  costo_crescita_cibo: number | string;
}

export const normalizeAnimalConfig = (raw: Record<string, unknown>): AnimalConfig => {
  const source = raw as Partial<AnimalConfigRaw>;

  return {
    id: normalizeNumber(source.id ?? (source as Record<string, unknown>)["ID"] ?? 0),
    kind: String(source.animale ?? (source as Record<string, unknown>)["name"] ?? "Sconosciuto"),
    life: normalizeNumber(source.vita ?? (source as Record<string, unknown>)["life"] ?? 0),
    damage: normalizeNumber(source.danno ?? (source as Record<string, unknown>)["damage"] ?? 0),
    attackSpeed: normalizeNumber(
      (source.velocita_di_attacco ?? (source as Record<string, unknown>)["attackSpeed"]) ?? 1
    ),
    size: normalizeSize(source.eta ?? "Small"),
    staminaMax: normalizeNumber(
      (source.stamina_max ?? (source as Record<string, unknown>)["staminaMax"]) ?? 0
    ),
    upgradableArmor: normalizeBoolean(
      (source.upgradable_armature ?? (source as Record<string, unknown>)["upgradableArmor"]) ?? false
    ),
    growthFoodCost: normalizeNumber(
      (source.costo_crescita_cibo ?? (source as Record<string, unknown>)["growthFoodCost"]) ?? 0
    )
  };
};

export const normalizeDoorLootTables = (raw: DoorLootTableRaw[]): DoorLootTable[] => {
  return raw.map(({ porta, ricompense }) => ({
    type: normalizeDoorKey(porta),
    rewards: ricompense
  }));
};
