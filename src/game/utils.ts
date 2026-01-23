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

// export const createEntityDataEventMap = <Data extends Record<string, any>>(keys: (keyof Data)[]) => {
//   const data = {} as { [P in keyof Data]: P };
//
//   type EventMap = { [K in Extract<keyof Data, string> as `changedata-${K}`]: `changedata-${K}` } &
//   { 'changedata': 'changedata' } &
//   { 'setdata': 'setdata' } &
//   { 'destroy': 'destroy' } &
//   { 'removedata': 'removedata' }
//
//   const events = {} as EventMap;
//
//   for (const key of keys) {
//     data[key] = key;
//     const eventName = `changedata-${key as string}` as keyof EventMap;
//     events[eventName] = eventName as EventMap[typeof eventName];
//   }
//   events['changedata'] = "changedata";
//   events['setdata'] = "setdata";
//   events['destroy'] = "destroy";
//   events['removedata'] = "removedata";
//
//   return { data, events };
// };

export type DataOverride<Entity, Data> = Omit<Phaser.Data.DataManager, 'set' | 'get' | 'inc' | 'events' | 'toggle'> & {
  // set: <T extends keyof Data>(dataKey: T, data: Data[T]) => Phaser.Data.DataManager
  set: {
    (dataObject: Partial<Data>): Phaser.Data.DataManager
    <T extends keyof Data>(dataKey: T, data: Data[T]): Phaser.Data.DataManager
  }
  get: <T extends keyof Data>(dataKey: T) => Data[T]
  inc: <T extends keyof Data>(dataKey: T, amount: number) => Phaser.Data.DataManager
  toggle: <T extends keyof Data>(dataKey: T) => Phaser.Data.DataManager
  events: Omit<Phaser.Events.EventEmitter, 'on'> & {
    on: {
      <T extends keyof Data>(event: `changedata-${keyof Data & string}`, cb: (entity: Entity, newData: Data[T], oldData: Data[T]) => void): Phaser.Events.EventEmitter;
      <T extends keyof Data>(event: 'changedata', cb: (entity: Entity, dataKey: T, newData: Data[T], oldData: Data[T]) => void): Phaser.Events.EventEmitter;
      <T extends keyof Data>(event: 'setdata' | 'removedata', cb: (entity: Entity, dataKey: T, data: Data[T]) => void): Phaser.Events.EventEmitter;
    }
  }
}
