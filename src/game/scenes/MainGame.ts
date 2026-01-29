import { Cursor } from "../components/Cursor";
import { Castle } from "../components/Castle";
import { Enemy, Slime } from "../components/Enemy";
import { Player } from "../components/Player";
import { Bullet } from "../components/Bullet";
import { getCellFromPixel, type DataOverride } from "../utils";
import { GameObjects, Geom, Input, Math as PhaserMath, Physics, Scene } from "phaser";
import PF from 'pathfinding'

type SceneData = {
  showBars: boolean
  charStatsOpen: boolean
}

interface MapObject {
  key: string;
  x: number;
  y: number;
  scale?: number;
}

const OBJECT_MAP: Record<string, MapObject[]> = {
  "0-0": [
    { key: 'castle', x: 1000, y: 1500 },
    // { key: 'castle', x: 500, y: 150 }
  ]
};

export class MainGame extends Scene {
  declare data: DataOverride<MainGame, SceneData>

  //create
  player!: Player;
  castle!: Castle
  bullets!: Physics.Arcade.Group;
  enemies!: Physics.Arcade.Group;
  #mapCollisionGroup!: Physics.Arcade.StaticGroup;
  #camLastX!: number
  #camLastY!: number
  grid!: PF.Grid

  // initialized now
  gameMap = {} as {
    worldWidth: number,
    worldHeight: number,
    gridCellSize: number,
    gridWidth: number,
    gridHeight: number,
    chunkSize: { width: number, height: number }
  }
  #objectChunks: Record<string, GameObjects.Sprite[]> = {};
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
  }

  create() {
    console.log('MainGame create');

    this.data.set('showBars', false)
    this.data.set('charStatsOpen', false)

    const texture = this.textures.get('bg-chunk-0-0').getSourceImage();
    const chunkW = texture.width;
    const chunkH = texture.height;
    const COLUMNS = 3;
    const ROWS = 3;

    this.gameMap.worldWidth = chunkW * COLUMNS;
    this.gameMap.worldHeight = chunkH * ROWS;
    this.gameMap.gridCellSize = 100;
    this.gameMap.gridHeight = this.gameMap.worldHeight / this.gameMap.gridCellSize;
    this.gameMap.gridWidth = this.gameMap.worldWidth / this.gameMap.gridCellSize;
    this.gameMap.chunkSize = { width: chunkW, height: chunkH }

    this.cameras.main.setBounds(0, 0, this.gameMap.worldWidth, this.gameMap.worldHeight);
    this.physics.world.setBounds(0, 0, this.gameMap.worldWidth, this.gameMap.worldHeight);
    this.grid = new PF.Grid(this.gameMap.gridWidth, this.gameMap.gridHeight);

    this.#mapCollisionGroup = this.physics.add.staticGroup();

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.pause()
      this.scene.launch('pause-screen');
    })

    this.player = new Player(
      this,
      this.gameMap.worldWidth / 2,
      this.gameMap.worldHeight / 2 + 250,
    )
    this.castle = new Castle(this, this.gameMap.worldWidth / 2, this.gameMap.worldHeight / 2)
    new Cursor(this, 0, 0);

    this.#camLastX = this.cameras.main.scrollX
    this.#camLastY = this.cameras.main.scrollY
    this.#updateChunks()
    for (const obj of this.#mapCollisionGroup.getChildren()) {
      const obstacle = obj as Physics.Arcade.Sprite
      const bounds = obstacle.getBounds();

      for (let x = bounds.x; x <= bounds.x + bounds.width; x += 1) {
        for (let y = bounds.y; y <= bounds.y + bounds.height; y += 1) {
          const blockedCell = getCellFromPixel(x, y, this.gameMap.gridCellSize)
          this.grid.setWalkableAt(blockedCell.cellX, blockedCell.cellY, false)
        }
      }
    }

    const clonedGrid = this.grid.clone()
    for (let x = 0; x < this.gameMap.gridWidth; x += 1) {
      for (let y = 0; y < this.gameMap.gridHeight; y += 1) {
        const node = clonedGrid.getNodeAt(x, y);
        const rectangle = this.add.rectangle(x * this.gameMap.gridCellSize, y * this.gameMap.gridCellSize, this.gameMap.gridCellSize, this.gameMap.gridCellSize, node.walkable ? 0xffffff : 0xff0000, .5)
        rectangle.setOrigin(0)
        rectangle.setStrokeStyle(1, 0x000000, .5)

      }

    }

    this.input.on('pointerdown', (pointerEvent: Input.Pointer, currentlyOver: GameObjects.GameObject[]) => {
      if (pointerEvent.button === 2) {
        if (currentlyOver.length === 0) {
          this.player.stateMachine.set('move', pointerEvent)
        } else if (currentlyOver[0] instanceof Enemy) {
          if (currentlyOver[0].stateMachine.is('corpse')) {
            this.player.stateMachine.set('absorbe-move', currentlyOver[0])
          } else {
            const isAttacking = this.player.stateMachine.getCurrent().startsWith('attack')
            if (!(isAttacking && this.player.attackTarget === currentlyOver[0])) {
              this.player.stateMachine.set('attack-move', currentlyOver[0])
            }
          }
        }
      }
    });

    this.input.keyboard!.on('keydown-ALT', () => {
      this.data.set('showBars', true)
    })
    this.input.keyboard!.on('keyup-ALT', () => {
      this.data.set('showBars', false)
    })
    this.input.keyboard!.on('keydown-C', () => {
      this.data.toggle('charStatsOpen')
    })

    this.bullets = this.physics.add.group({
      classType: Bullet,
      collideWorldBounds: true
    });

    this.enemies = this.physics.add.group({
      maxSize: 0,
      collideWorldBounds: true,
    })
    this.#spawnEnemy()

    this.physics.add.collider(this.castle, this.enemies)
    this.physics.add.collider(this.castle, this.player)
    this.physics.add.collider(this.player, this.#mapCollisionGroup)
    this.physics.add.collider(this.enemies, this.#mapCollisionGroup)

    this.physics.add.overlap(this.enemies, this.enemies, (objA, objB) => {
      const enemyA = objA as Enemy
      const enemyB = objB as Enemy
      if (!enemyA.stateMachine.is('corpse') && !enemyB.stateMachine.is('corpse')) {
        this.#overlapRepel(enemyA, enemyB)
      }
    })
    this.physics.add.overlap(this.player, this.enemies, (objA, objB) => {
      const player = objA as Player
      const enemy = objB as Enemy
      if (!enemy.stateMachine.is('corpse')) {
        this.#overlapRepel(player, enemy)
      }
    })

    this.physics.add.overlap(this.bullets, this.enemies, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Bullet;
      const enemy = enemyObj as Enemy;
      if (enemy.active && !enemy.stateMachine.is('corpse') && bullet.ownerEntity instanceof Player) {
        const damage = bullet.ownerEntity.data.get('attributeDamage');
        enemy.takeDamage(damage);
        bullet.disable();
      }
    })

    this.physics.add.overlap(this.player, this.bullets, (playerObj, bulletObj) => {
      const player = playerObj as Player;
      const bullet = bulletObj as Bullet;
      if (bullet.active && bullet.ownerEntity instanceof Enemy) {
        const damage = bullet.ownerEntity.data.get('damage');
        player.takeDamage(damage);
        bullet.disable();
      }
    })

    this.physics.add.overlap(this.castle, this.bullets, (castleObj, bulletObj) => {
      const castle = castleObj as Castle;
      const bullet = bulletObj as Bullet;
      if (bullet.active && bullet.ownerEntity instanceof Enemy) {
        const damage = bullet.ownerEntity.data.get('damage');
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
    const buffer = 500;
    const chunkWidth = this.gameMap.chunkSize.width
    const chunkHeight = this.gameMap.chunkSize.height

    const left = Math.floor((cam.scrollX - buffer) / chunkWidth);
    const right = Math.floor((cam.scrollX + cam.width + buffer) / chunkWidth);
    const top = Math.floor((cam.scrollY - buffer) / chunkHeight);
    const bottom = Math.floor((cam.scrollY + cam.height + buffer) / chunkHeight);

    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        const chunkKey = `bg-chunk-${x}-${y}`;

        if (this.textures.exists(chunkKey) && !this.#visibleChunks[chunkKey]) {
          const chunk = this.add.image(x * chunkWidth, y * chunkHeight, chunkKey).setOrigin(0);
          chunk.setDepth(-1);
          this.#visibleChunks[chunkKey] = chunk;

          this.#spawnChunkObjects(x, y, chunkKey);
        }
      }
    }

    for (const key in this.#visibleChunks) {
      const chunk = this.#visibleChunks[key];

      const chunkX = chunk.x / chunkWidth;
      const chunkY = chunk.y / chunkHeight;

      if (chunkX < left || chunkX > right || chunkY < top || chunkY > bottom) {
        chunk.destroy();
        delete this.#visibleChunks[key];
      }
    }
  }

  #spawnChunkObjects(x: number, y: number, chunkKey: string) {
    const chunkData = OBJECT_MAP[`${x}-${y}`];
    if (!chunkData) return;

    const { width, height } = this.gameMap.chunkSize;
    const spawnedInThisChunk: GameObjects.Sprite[] = [];

    chunkData.forEach(obj => {
      const worldX = (x * width) + obj.x;
      const worldY = (y * height) + obj.y;

      const sprite = this.#mapCollisionGroup.create(worldX, worldY, obj.key);
      sprite.setOrigin(0.5);

      sprite.body.setSize(sprite.width * 0.8, sprite.height * 0.8);
      sprite.body.updateFromGameObject();

      spawnedInThisChunk.push(sprite);
    });

    this.#objectChunks[chunkKey] = spawnedInThisChunk;
  }

  #spawnEnemy() {
    const safePadding = 500;
    const safeZone = Geom.Rectangle.Clone(this.castle.getBounds());

    Geom.Rectangle.Inflate(safeZone, safePadding, safePadding);

    let x = 0
    let y = 0
    let isInsideSafeZone = true;

    while (isInsideSafeZone) {
      x = PhaserMath.Between(0, this.gameMap.worldWidth);
      y = PhaserMath.Between(0, this.gameMap.worldHeight);
      isInsideSafeZone = safeZone.contains(x, y);
    }
    const enemy = this.enemies.getFirstDead(false, x, y, undefined, undefined, true);

    if (this.enemies.maxSize === this.enemies.getLength()) {
      return
    }

    if (enemy) {
      enemy.enable()
    } else {
      const newEnemy = new Slime(this, x, y)
      this.enemies.add(newEnemy)
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

