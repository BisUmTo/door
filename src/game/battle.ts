export interface WeaponDamageProfile {
  damagePerShot: number;
}

export interface EnemyCombatant {
  life: number;
  damage: number;
  attackSpeed: number;
}

export interface PlayerAnimalCombatant {
  life: number;
  damage: number;
  attackSpeed: number;
  armor?: number | null;
}

export const simulateWeaponAttack = (
  enemy: EnemyCombatant,
  weapon: WeaponDamageProfile,
  shots: number
): {
  enemyLifeLeft: number;
  ammoSpent: number;
  defeated: boolean;
} => {
  const sanitizedShots = Math.max(0, Math.floor(shots));
  const totalDamage = weapon.damagePerShot * sanitizedShots;
  const enemyLifeLeft = Math.max(0, enemy.life - totalDamage);

  return {
    enemyLifeLeft,
    ammoSpent: sanitizedShots,
    defeated: enemyLifeLeft === 0
  };
};

const applyDamage = (life: number, damage: number, defence: number) => {
  const effective = Math.max(1, damage - defence);
  return Math.max(0, life - effective);
};

export const simulateAnimalDuel = (
  player: PlayerAnimalCombatant,
  enemy: EnemyCombatant
): {
  winner: "player" | "enemy";
  turns: number;
  playerLifeLeft: number;
  enemyLifeLeft: number;
} => {
  let playerLife = player.life;
  let enemyLife = enemy.life;
  const playerDefence = Math.max(0, player.armor ?? 0);
  const enemyDefence = 0;

  let turns = 0;
  const playerFirst = player.attackSpeed >= enemy.attackSpeed;

  // Cap to avoid infinite loops in pathological configs
  const maxRounds = 100;

  for (let round = 0; round < maxRounds; round += 1) {
    turns += 1;
    if (playerFirst) {
      enemyLife = applyDamage(enemyLife, player.damage, enemyDefence);
      if (enemyLife <= 0) break;
      playerLife = applyDamage(playerLife, enemy.damage, playerDefence);
      if (playerLife <= 0) break;
    } else {
      playerLife = applyDamage(playerLife, enemy.damage, playerDefence);
      if (playerLife <= 0) break;
      enemyLife = applyDamage(enemyLife, player.damage, enemyDefence);
      if (enemyLife <= 0) break;
    }
  }

  let winner: "player" | "enemy";
  if (enemyLife <= 0 && playerLife <= 0) {
    winner = "player";
  } else if (enemyLife <= 0) {
    winner = "player";
  } else {
    winner = "enemy";
  }

  return {
    winner,
    turns,
    playerLifeLeft: Math.max(0, playerLife),
    enemyLifeLeft: Math.max(0, enemyLife)
  };
};
