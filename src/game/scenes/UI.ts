import type { MainGame } from "./MainGame.svelte";

// UIScene.ts
export class UIScene extends Phaser.Scene {
  #mainGame!: MainGame
  constructor() {
    super('ui-scene');
  }

  create() {
    this.#mainGame = this.scene.get('main-game') as MainGame;
  }

  update(): void {
  }
}
