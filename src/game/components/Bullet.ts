
import { Player } from "./Player";
import { Enemy } from "./Enemy";

export class Bullet extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.Body;
  speed = 600
  ownerEntity: Player | Enemy | null = null

  get owner(): 'player' | 'enemy' {
    if (this.ownerEntity instanceof Player) return 'player';
    return 'enemy';
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 20, 20, 0x0000ff);


    this.scene.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject === this) {
        this.disable()
      }
    })
  }

  disable() {
    this.setActive(false);
    this.setVisible(false)
    this.body.setEnable(false)
  }

  enable() {
    this.body.onWorldBounds = true;
    this.setActive(true);
    this.setVisible(true)
    this.body.setEnable(true)
  }
}
