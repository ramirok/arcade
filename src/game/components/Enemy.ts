import type { MainGame } from "../scenes/MainGame.svelte";
import type { Shot } from "./Shot";

export class Enemy extends Phaser.GameObjects.Ellipse {
  declare body: Phaser.Physics.Arcade.Body;
  declare scene: MainGame;
  damage = 10
  #health = 5
  #recalculateTargetTime = 200
  #recalculateTargetTimeElapsed = 0
  #hitCooldownTime = 2000
  #hitCooldownElapsed = 0
  damageCooldownTime = 500
  damageCooldownElapsed = 0
  knockbackForce = 100

  // overlapZone: Phaser.GameObjects.Zone; // New property
  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 40, 40, 0xff0000);

    // // 1. Create a zone larger than the enemy (e.g., 80x80)
    // this.overlapZone = this.scene.add.zone(x, y, 80, 80);
    // this.scene.physics.add.existing(this.overlapZone);
    // // 2. Make the zone follow the enemy's velocity
    // (this.overlapZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  update(_: number, delta: number) {
    // // 3. Keep the zone centered on the enemy
    // this.overlapZone.x = this.x;
    // this.overlapZone.y = this.y;

    if (this.damageCooldownElapsed > 0) {
      this.damageCooldownElapsed -= delta
    }
    if (this.#hitCooldownElapsed > 0) {
      this.#hitCooldownElapsed -= delta
    }
    if (this.#recalculateTargetTimeElapsed < this.#recalculateTargetTime) {
      this.#recalculateTargetTimeElapsed += delta
      return
    }

    const distToPlayer = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.scene.player.x, this.scene.player.y
    );

    const distToCastle = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.scene.castle.x, this.scene.castle.y
    );

    let target
    if (this.#hitCooldownElapsed > 0) {
      target = this.scene.player
    } else {
      target = distToPlayer < distToCastle
        ? this.scene.player
        : this.scene.castle;
    }
    const edgeToEdgeStopDistance = (this.scene.castle.width / 2) + (this.width / 2) + 20;

    if (target === this.scene.castle && distToCastle <= edgeToEdgeStopDistance) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    } else {
      this.scene.physics.moveToObject(this, target, 100);
    }
    this.#recalculateTargetTimeElapsed = 0
  }

  hit(shot: Shot) {
    this.#health -= shot.damage
    if (this.#health < 1) {
      this.#die()
    } else {
      this.#hitCooldownElapsed = this.#hitCooldownTime
      this.scene.physics.moveToObject(this, this.scene.player, 100);
    }
  }

  #die() {
    this.scene.player.exp += this.damage
    this.destroy()
    // this.overlapZone.destroy()
  }
}
