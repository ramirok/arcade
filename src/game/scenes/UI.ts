import type { MainGame } from "./MainGame";

export class UIScene extends Phaser.Scene {
  #mainGame!: MainGame
  #healthText!: Phaser.GameObjects.Text
  #xpText!: Phaser.GameObjects.Text
  #levelText!: Phaser.GameObjects.Text
  #background!: Phaser.GameObjects.Rectangle

  constructor() {
    super('ui-scene');
  }

  create() {
    this.#mainGame = this.scene.get('main-game') as MainGame;

    const y = this.cameras.main.height - 30;
    this.#background = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - 20,
      this.cameras.main.width,
      40,
      0x000000
    );
    this.#background.setAlpha(0.7);
    this.#healthText = this.add.text(10, y, '').setFontSize(20);
    this.#xpText = this.add.text(300, y, '').setFontSize(20);
    this.#levelText = this.add.text(550, y, '').setFontSize(20);
  }

  update(): void {
    if (!this.#mainGame.player) return;

    const player = this.#mainGame.player;
    this.#healthText.setText(`HP: ${player.health}/${player.maxHealth}`);
    this.#xpText.setText(`XP: ${player.xp}/${player.xpToNextLevel}`);
    this.#levelText.setText(`Lvl: ${player.level}`);
  }
}
