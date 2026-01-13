import type { MainGame } from "./MainGame.svelte";

const getHealthTextString = (health: number) => {
  return `Health: ${health}%`
}

const getExpTextString = (exp: number) => {
  return `Exp: ${exp}`
}

// UIScene.ts
export class UIScene extends Phaser.Scene {
  #mainGame!: MainGame
  #playerHealthText!: Phaser.GameObjects.Text
  #expText!: Phaser.GameObjects.Text
  #cooldownBar!: Phaser.GameObjects.Rectangle
  #castleHealthText!: Phaser.GameObjects.Text
  constructor() {
    super('ui-scene');
  }

  create() {
    this.#mainGame = this.scene.get('main-game') as MainGame;
    const gameHeight = this.cameras.main.height;
    const gameWidth = this.cameras.main.width;
    const footerHeight = 100;

    const uiBg = this.add.graphics();
    uiBg.fillStyle(0x222222, 1);
    uiBg.fillRect(0, gameHeight - footerHeight, gameWidth, footerHeight);

    this.#playerHealthText = this.add.text(20, gameHeight - 60, getHealthTextString(this.#mainGame.player.health), { fontSize: '24px' });
    this.#expText = this.add.text(400, gameHeight - 60, getExpTextString(this.#mainGame.player.exp), { fontSize: '24px' });

    this.#cooldownBar = this.add.rectangle(200, gameHeight - 60, 10, 60, 0xffffff)
    this.#castleHealthText = this.add.text(700, gameHeight - 60, getHealthTextString(this.#mainGame.player.health), { fontSize: '24px' });
  }

  update(): void {
    this.#cooldownBar.height = - this.#mainGame.player.coolDown / 10
    this.#playerHealthText.text = getHealthTextString(this.#mainGame.player.health)
    this.#castleHealthText.text = getHealthTextString(this.#mainGame.castle.health)
    this.#expText.text = getExpTextString(this.#mainGame.player.exp)
  }
}
