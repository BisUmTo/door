export class RNG {
  private seed: number;

  constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new Error("Seed must be an integer");
    }
    this.seed = seed >>> 0;
  }

  next(): number {
    // xorshift32
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed;
  }

  nextFloat(): number {
    return (this.next() & 0xfffffff) / 0x10000000;
  }

  nextInt(min: number, max: number): number {
    if (max < min) {
      throw new Error("max must be >= min");
    }
    const range = max - min + 1;
    return min + Math.floor(this.nextFloat() * range);
  }

  pickOne<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    const index = this.nextInt(0, items.length - 1);
    return items[index];
  }
}

export const createTurnSeed = (baseSeed: number, turn: number) => {
  return (baseSeed + turn * 9973) >>> 0;
};
