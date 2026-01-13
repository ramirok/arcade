import type { Enemy } from "./Enemy";

export class Castle extends Phaser.GameObjects.Ellipse {
  declare body: Phaser.Physics.Arcade.Body
  health = 100

  constructor(scene: Phaser.Scene, x: number, y: number) {

    super(scene, x, y, 100, 100, 0xBBBBBB);

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true)
  }


  hit(enemy: Enemy) {
    if (enemy.damageCooldownElapsed > 0) return
    this.health -= enemy.damage

    enemy.damageCooldownElapsed = 1000

    if (this.health < 1) {
      this.#die()
    }
  }

  #die() {
    this.scene.scene.pause()
    this.scene.scene.launch('game-over');
  }
}
