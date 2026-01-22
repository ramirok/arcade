import { Cursor } from "../components/Cursor";
import { Castle } from "../components/Castle";
import { Enemy, Slime } from "../components/Enemy";
import { Player } from "../components/Player";
import { Bullet } from "../components/Bullet";
import { getCellFromPixel } from "../utils";
import PF from 'pathfinding'
import { GameObjects, Geom, Input, Math as PhaserMath, Physics, Scene } from "phaser";

export const WORLD_WIDTH = 3000
export const WORLD_HEIGHT = 3000
export const GRID_CELL_SIZE = 30
export const GRID_WIDTH = WORLD_WIDTH / GRID_CELL_SIZE
export const GRID_HEIGHT = WORLD_HEIGHT / GRID_CELL_SIZE

export class MainGame extends Scene {
  //create
  player!: Player;
  castle!: Castle
  bullets!: Physics.Arcade.Group;
  enemies!: Physics.Arcade.Group;
  #camLastX!: number
  #camLastY!: number

  // initialized now
  #visibleChunks: Record<string, GameObjects.Image> = {}
  constructor() {
    super('main-game');
  }

  init() {
    console.log('MainGame init');
    this.#visibleChunks = {};
  }

  preload() {
    console.log('MainGame preload');
    this.load.image('bg-chunk-0-0', 'assets/bg-1.png')
    this.load.image('bg-chunk-0-1', 'assets/bg-2.png')
    this.load.image('bg-chunk-0-2', 'assets/bg-3.png')
    this.load.image('bg-chunk-1-0', 'assets/bg-4.png')
    this.load.image('bg-chunk-1-1', 'assets/bg-5.png')
    this.load.image('bg-chunk-1-2', 'assets/bg-6.png')
    this.load.image('bg-chunk-2-0', 'assets/bg-7.png')
    this.load.image('bg-chunk-2-1', 'assets/bg-8.png')
    this.load.image('bg-chunk-2-2', 'assets/bg-9.png')
    this.load.image('castle', 'assets/castle.png')
    this.load.spritesheet('slime', 'assets/slime.png', {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create() {
    console.log('MainGame create');

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const grid = new PF.Grid(GRID_WIDTH, GRID_HEIGHT);
    const finder = new PF.AStarFinder({ allowDiagonal: true, dontCrossCorners: true });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.pause()
      this.scene.launch('pause-screen');
    })

    this.player = new Player(
      this,
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2 + 250,
    )
    this.castle = new Castle(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
    new Cursor(this, 0, 0);

    this.#camLastX = this.cameras.main.scrollX
    this.#camLastY = this.cameras.main.scrollY
    this.#updateChunks()

    this.input.on('pointerdown', (pointerEvent: Input.Pointer, currentlyOver: GameObjects.GameObject[]) => {
      if (pointerEvent.button === 2) {
        if (currentlyOver.length === 0) {
          const playerCell = getCellFromPixel(this.player.x, this.player.y)
          const targetCell = getCellFromPixel(pointerEvent.worldX, pointerEvent.worldY)
          const path = finder.findPath(playerCell.cellX, playerCell.cellY, targetCell.cellX, targetCell.cellY, grid.clone());
          if (path.length > 0 && path[0][0] === playerCell.cellX && path[0][1] === playerCell.cellY) {
            path.shift();
          }
          const smoothPath = PF.Util.smoothenPath(grid, path);
          this.player.stateMachine.set('move', smoothPath)
        } else if (currentlyOver[0] instanceof Enemy) {
          const isAttacking = this.player.stateMachine.getCurrent().startsWith('attack')
          if (!(isAttacking && this.player.attackTarget === currentlyOver[0])) {
            this.player.stateMachine.set('attack-move', currentlyOver[0])
          }
        }
      }
    });

    this.bullets = this.physics.add.group({
      classType: Bullet,
      collideWorldBounds: true
    });

    this.enemies = this.physics.add.group({
      classType: Slime,
      maxSize: 3,
      collideWorldBounds: true,
    })
    this.#spawnEnemy()

    this.physics.add.collider(this.castle, this.enemies)
    this.physics.add.collider(this.castle, this.player)

    this.physics.add.overlap(this.enemies, this.enemies, (objA, objB) => {
      const enemyA = objA as Enemy
      const enemyB = objB as Enemy
      this.#overlapRepel(enemyA, enemyB)
    })
    this.physics.add.overlap(this.player, this.enemies, (objA, objB) => {
      const player = objA as Player
      const enemy = objB as Enemy
      this.#overlapRepel(player, enemy)
    })

    this.physics.add.overlap(this.bullets, this.enemies, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Bullet;
      const enemy = enemyObj as Enemy;
      if (bullet.active && enemy.active && bullet.owner === 'player') {
        const damage = bullet.ownerEntity?.damage ?? 1;
        enemy.takeDamage(damage);
        bullet.disable();
      }
    })

    this.physics.add.overlap(this.player, this.bullets, (playerObj, bulletObj) => {
      const player = playerObj as Player;
      const bullet = bulletObj as Bullet;
      if (bullet.active && bullet.owner === 'enemy') {
        const damage = bullet.ownerEntity?.damage ?? 1;
        player.takeDamage(damage);
        bullet.disable();
      }
    })

    this.physics.add.overlap(this.castle, this.bullets, (castleObj, bulletObj) => {
      const castle = castleObj as Castle;
      const bullet = bulletObj as Bullet;
      if (bullet.active && bullet.owner === 'enemy') {
        const damage = bullet.ownerEntity?.damage ?? 1;
        castle.takeDamage(damage);
        bullet.disable();
      }
    })
    this.game.events.emit('main-scene-ready');
  }

  update() {
    if (this.#camLastX !== this.cameras.main.scrollX || this.#camLastY !== this.cameras.main.scrollY) {
      this.#updateChunks()
      this.#camLastX = this.cameras.main.scrollX
      this.#camLastY = this.cameras.main.scrollY
    }
  }

  #updateChunks() {
    const cam = this.cameras.main;
    const CHUNK_SIZE = 1000;
    const buffer = 500;

    const left = Math.floor((cam.scrollX - buffer) / CHUNK_SIZE);
    const right = Math.floor((cam.scrollX + cam.width + buffer) / CHUNK_SIZE);
    const top = Math.floor((cam.scrollY - buffer) / CHUNK_SIZE);
    const bottom = Math.floor((cam.scrollY + cam.height + buffer) / CHUNK_SIZE);

    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        const chunkKey = `bg-chunk-${x}-${y}`;

        if (this.#isValidChunk(x, y) && !this.#visibleChunks[chunkKey]) {
          const posX = x * CHUNK_SIZE;
          const posY = y * CHUNK_SIZE;

          const chunk = this.add.image(posX, posY, chunkKey).setOrigin(0);
          chunk.setDepth(-1);
          this.#visibleChunks[chunkKey] = chunk;
        }
      }
    }

    for (const key in this.#visibleChunks) {
      const chunk = this.#visibleChunks[key];

      const chunkX = chunk.x / CHUNK_SIZE;
      const chunkY = chunk.y / CHUNK_SIZE;

      if (chunkX < left || chunkX > right || chunkY < top || chunkY > bottom) {
        chunk.destroy();
        delete this.#visibleChunks[key];
      }
    }
  }
  #isValidChunk(x: number, y: number) {
    const maxChunksX = 3;
    const maxChunksY = 3;

    return (
      x >= 0 &&
      x < maxChunksX &&
      y >= 0 &&
      y < maxChunksY
    );
  }

  #spawnEnemy() {
    const safePadding = 500;
    const safeZone = Geom.Rectangle.Clone(this.castle.getBounds());

    Geom.Rectangle.Inflate(safeZone, safePadding, safePadding);

    let x, y;
    let isInsideSafeZone = true;

    while (isInsideSafeZone) {
      x = PhaserMath.Between(0, WORLD_WIDTH);
      y = PhaserMath.Between(0, WORLD_HEIGHT);
      isInsideSafeZone = safeZone.contains(x, y);
    }
    const enemy = this.enemies.get(x, y);

    if (enemy) {
      enemy.setActive(true);
      enemy.setVisible(true);
    }
    this.time.delayedCall(PhaserMath.Between(2000, 4000), this.#spawnEnemy, undefined, this)
  }

  #overlapRepel(objA: GameObjects.Sprite, objB: GameObjects.Sprite) {
    const angle = PhaserMath.Angle.BetweenPoints(objA, objB);
    const separationForce = 0.5;
    objA.x -= Math.cos(angle) * separationForce;
    objA.y -= Math.sin(angle) * separationForce;
    objB.x += Math.cos(angle) * separationForce;
    objB.y += Math.sin(angle) * separationForce;
  }
}

