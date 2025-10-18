import {
  AnimalConfig,
  DoorLootTable,
  DoorLootTableRaw,
  WeaponConfig
} from "@/game/types";
import {
  normalizeAnimalConfig,
  normalizeDoorLootTables,
  normalizeWeaponName,
  normalizeAmmoKind
} from "./normalize";

const baseRequestInit: RequestInit = __ENABLE_CACHE__
  ? {}
  : {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store"
      }
    };

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path, baseRequestInit);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
};

export interface FileStructure {
  files: string[];
  version: string;
}

export const loadFileStructure = () =>
  fetchJson<FileStructure>("/assets/file_structure.json");

export interface HitboxPolygon {
  type: string;
  points: [number, number][];
}

export interface HitboxDefinition {
  polygons: HitboxPolygon[];
}

export const loadHitbox = async (path: string): Promise<HitboxDefinition | null> => {
  try {
    return await fetchJson<HitboxDefinition>(path);
  } catch (error) {
    console.warn(`Unable to load hitbox at ${path}`, error);
    return null;
  }
};

interface AnimalConfigFile {
  animali: Record<string, unknown>[];
}

export const loadAnimalsConfig = async (): Promise<AnimalConfig[]> => {
  const data = await fetchJson<AnimalConfigFile>("/assets/config_animali.json");
  return data.animali.map((entry) => normalizeAnimalConfig(entry));
};

interface WeaponConfigRaw {
  nome: string;
  munizioni: string;
  danno_per_colpo: number;
  capacita_massima: number;
}

export const loadWeaponsConfig = async (): Promise<WeaponConfig[]> => {
  const data = await fetchJson<{ armi: WeaponConfigRaw[] }>("/assets/config_armi.json");
  return data.armi.map((weapon) => {
    const name = normalizeWeaponName(weapon.nome);
    return {
      name,
      displayName: weapon.nome,
      ammoType: normalizeAmmoKind(weapon.munizioni),
      damagePerShot: weapon.danno_per_colpo,
      maxAmmo: weapon.capacita_massima
    };
  });
};

export interface ChestsConfig {
  bauli: Array<{
    id: string;
    rarita: string;
    loot: Array<{
      loot: string | null;
      peso: number;
      quantita?: string;
    }>;
  }>;
}

export const loadChestsConfig = () => fetchJson<ChestsConfig>("/assets/config_bauli.json");

export interface HouseConfig {
  arredamento: Array<{
    id: number;
    nome: string;
    pezzi: number;
    bonus: {
      tipo: string;
      quantita: number | number[];
      cooldown: number;
    };
  }>;
}

export const loadHouseConfig = () =>
  fetchJson<HouseConfig>("/assets/config_arredamento.json");

export const loadDoorLootTables = async (): Promise<DoorLootTable[]> => {
  const data = await fetchJson<{ loottables: DoorLootTableRaw[] }>(
    "/assets/door_loot_tables.json"
  );
  return normalizeDoorLootTables(data.loottables);
};
