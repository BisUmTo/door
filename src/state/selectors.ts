import { useGameStore } from "./store";

export const useGameStatus = () => useGameStore((state) => state.status);

export const useGameError = () => useGameStore((state) => state.error);

export const useActiveSave = () => useGameStore((state) => state.save);

export const useLobbyDoors = () =>
  useGameStore((state) => state.save?.progress.lastLobbyDraw ?? []);

export const usePendingReward = () => useGameStore((state) => state.pendingReward);

export const useBattleState = () => useGameStore((state) => state.save?.battleState);

export const useWeaponsPhaseLocked = () => useGameStore((state) => state.weaponsPhaseLocked);

export const useBattleResult = () => useGameStore((state) => state.battleResult);

export const useSlots = () =>
  useGameStore((state) => ({
    slots: state.slots,
    activeSlotId: state.activeSlotId
  }));
