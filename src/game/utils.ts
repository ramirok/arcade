import { Math as PhaserMath } from "phaser";
import { GRID_CELL_SIZE } from "./scenes/MainGame";

export const getPixelPosition = (cellX: number, cellY: number) => {
  return {
    x: (cellX * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2),
    y: (cellY * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2)
  };
}
export const getCellFromPixel = (pixelX: number, pixelY: number) => {
  return {
    cellX: Math.floor(pixelX / GRID_CELL_SIZE),
    cellY: Math.floor(pixelY / GRID_CELL_SIZE)
  };
}

export const isWithinRange = (x1: number, y1: number, x2: number, y2: number, range: number) => {
  const distanceToTarget = PhaserMath.Distance.Between(
    x1, y1,
    x2, y2
  );
  return distanceToTarget < range
}

export const createEntityDataEventMap = <T extends string>(keys: T[]) => {
  const data = {} as { [P in T]: P };

  type EventMap = { [K in T as `changedata-${K}`]: `changedata-${K}` };
  const events = {} as EventMap;

  for (const key of keys) {
    data[key] = key;

    const eventName = `changedata-${key}` as keyof EventMap;
    events[eventName] = eventName as EventMap[typeof eventName];
  }

  return { data, events };
};
