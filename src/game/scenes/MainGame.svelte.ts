import { Aim } from "../components/Aim";
import { Castle } from "../components/Castle";
import { Enemy } from "../components/Enemy";
import { Player } from "../components/Player";
import { Shot } from "../components/Shot";

export class MainGame extends Phaser.Scene {
  //create
  player!: Player;
  castle!: Castle
  #aim!: Aim
  #shots!: Phaser.Physics.Arcade.Group;
  #enemies!: Phaser.Physics.Arcade.Group;

  constructor() {
    super('main-game');
  }

  init() {
    console.log('MainGame init');
  }

  preload() {
    console.log('MainGame preload');
  }

  create() {
    console.log('MainGame create');
    this.scene.launch('ui-scene');

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.pause()
      this.scene.launch('pause-screen');
    })

    const middleX = this.cameras.main.width / 2
    const middleY = this.cameras.main.height / 2
    this.player = new Player(
      this,
      middleX,
      middleY + 100,
    )

    this.castle = new Castle(this, middleX, middleY)

    this.#aim = new Aim(this, 0, 0);

    this.input.on('pointerdown', (event: PointerEvent) => {
      if (event.button === 2)
        console.log(event)
      this.#shoot()
    })

    this.#shots = this.physics.add.group({
      classType: Shot,
      maxSize: 100,
      collideWorldBounds: true,
    });

    this.#enemies = this.physics.add.group({
      classType: Enemy,
      maxSize: 50,
      collideWorldBounds: true,
      runChildUpdate: true
    })
    this.#spawnEnemy()

    this.physics.add.collider(this.castle, this.#enemies, (_, enemy) => {
      this.castle.hit(enemy as Enemy)
    })

    this.physics.add.collider(this.castle, this.player)

    this.physics.add.collider(this.#enemies, this.#enemies)

    this.physics.add.collider(
      this.player,
      this.#enemies,
      (_, enemy) => {
        this.player.hit((enemy as Enemy));
      }
    )

    this.physics.add.collider(
      this.#enemies,
      this.#shots,
      (enemy, shot) => {
        (enemy as Enemy).hit(shot as Shot);
        (shot as Shot).disable();
      }
    )
  }

  update(time: number, delta: number) {
    this.player.update(time, delta);
    this.#aim.update();
  }

  #shoot() {
    if (this.player.coolDown < 1) {
      const bullet = this.#shots.get(this.player.x, this.player.y);
      if (bullet) {
        bullet.enable();
        this.physics.moveToObject(bullet, this.#aim, 600);
        this.player.shoot()
      }
    }
  }
  #spawnEnemy() {
    const safePadding = 150;
    // Clone the bounds so we don't accidentally modify the castle itself
    const safeZone = Phaser.Geom.Rectangle.Clone(this.castle.getBounds());

    Phaser.Geom.Rectangle.Inflate(safeZone, safePadding, safePadding);

    let x, y;
    let isInsideSafeZone = true;

    while (isInsideSafeZone) {
      x = Phaser.Math.Between(0, 1000);
      y = Phaser.Math.Between(0, 800);
      isInsideSafeZone = safeZone.contains(x, y);
    }
    const enemy = this.#enemies.get(x, y);

    if (enemy) {
      enemy.setActive(true);
      enemy.setVisible(true);
    }

    this.time.delayedCall(Phaser.Math.Between(2000, 4000), this.#spawnEnemy, undefined, this)
  }
}
