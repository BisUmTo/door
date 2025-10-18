import type { AnimalConfig, AnimalInstance } from "./types";

const SMALL_DAMAGE_MULTIPLIER = 0.7;
const SMALL_LIFE_MULTIPLIER = 0.75;
const SMALL_STAMINA_MULTIPLIER = 0.6;
const SMALL_SPEED_BONUS = 2;

export const getLifeCap = (config: AnimalConfig, size: AnimalInstance["size"]): number => {
  if (size === "Small") {
    return Math.max(1, Math.round(config.life * SMALL_LIFE_MULTIPLIER));
  }
  return config.life;
};

export const getStaminaCap = (config: AnimalConfig, size: AnimalInstance["size"]): number => {
  if (size === "Small") {
    return Math.max(5, Math.round(config.staminaMax * SMALL_STAMINA_MULTIPLIER));
  }
  return config.staminaMax;
};

export const getDamageValue = (config: AnimalConfig, size: AnimalInstance["size"]): number => {
  if (size === "Small") {
    return Math.max(1, Math.round(config.damage * SMALL_DAMAGE_MULTIPLIER));
  }
  return config.damage;
};

export const getAttackSpeedValue = (
  config: AnimalConfig,
  size: AnimalInstance["size"]
): number => {
  if (size === "Small") {
    return Math.max(1, config.attackSpeed + SMALL_SPEED_BONUS);
  }
  return config.attackSpeed;
};

export interface AnimalBattleStats {
  life: number;
  damage: number;
  attackSpeed: number;
  staminaCap: number;
  lifeCap: number;
}

export const computeBattleStats = (
  config: AnimalConfig,
  instance: AnimalInstance
): AnimalBattleStats => {
  const lifeCap = getLifeCap(config, instance.size);
  const staminaCap = getStaminaCap(config, instance.size);
  return {
    life: Math.min(instance.life, lifeCap),
    damage: getDamageValue(config, instance.size),
    attackSpeed: getAttackSpeedValue(config, instance.size),
    staminaCap,
    lifeCap
  };
};

export const applyGrowthToInstance = (
  instance: AnimalInstance,
  config: AnimalConfig
): AnimalInstance => {
  const grownLifeCap = getLifeCap(config, "Large");
  const grownStaminaCap = getStaminaCap(config, "Large");
  return {
    ...instance,
    size: "Large",
    life: grownLifeCap,
    stamina: grownStaminaCap
  };
};
