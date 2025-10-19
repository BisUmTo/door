import { describe, expect, it } from "vitest";
import { simulateWeaponAttack, simulateAnimalDuel } from "@/game/battle";

describe("battle mechanics", () => {
  it("weapon attack defeats enemy when damage suffices", () => {
    const result = simulateWeaponAttack({ life: 10, damage: 4, attackSpeed: 5 }, { damagePerShot: 5 }, 2);
    expect(result.defeated).toBe(true);
    expect(result.enemyLifeLeft).toBe(0);
    expect(result.ammoSpent).toBe(2);
  });

  it("weapon attack tracks remaining life when not defeated", () => {
    const result = simulateWeaponAttack({ life: 10, damage: 4, attackSpeed: 5 }, { damagePerShot: 3 }, 2);
    expect(result.defeated).toBe(false);
    expect(result.enemyLifeLeft).toBe(4);
  });

  it("animal duel respects attack speed ordering", () => {
    const duel = simulateAnimalDuel(
      { life: 12, damage: 5, attackSpeed: 8, armor: 1 },
      { life: 10, damage: 4, attackSpeed: 6 }
    );
    expect(duel.winner).toBe("player");
    expect(duel.enemyLifeLeft).toBe(0);
    expect(duel.log.length).toBeGreaterThan(0);
    expect(duel.log[0].attacker).toBe("player");
  });

  it("animal duel can result in defeat", () => {
    const duel = simulateAnimalDuel(
      { life: 8, damage: 3, attackSpeed: 5, armor: 0 },
      { life: 14, damage: 6, attackSpeed: 7 }
    );
    expect(duel.winner).toBe("enemy");
    expect(duel.playerLifeLeft).toBe(0);
    expect(duel.log.at(-1)?.attacker).toBe("enemy");
  });
});
