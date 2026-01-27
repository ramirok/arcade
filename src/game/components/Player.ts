import { type MainGame } from "../scenes/MainGame";
import type { Bullet } from "./Bullet";
import { StateMachine } from "../stateMachine";
import { Enemy } from "./Enemy";
import { getCellFromPixel, getPixelPosition, isWithinRange, type DataOverride } from "../utils";
import { Input, Math as PhaserMath, Physics } from "phaser";
import PF from 'pathfinding'


export type Units = 'int' | 'percentage' | 'bool'
export const PLAYER_DATA = {
  baseStats: {
    statStrength: {
      unit: 'int',
      label: 'Strength',
      exampleVal: 0
    },
    statAgility: {
      unit: 'int',
      label: 'Agility',
      exampleVal: 0
    },
    statVitality: {
      unit: 'int',
      label: 'Vitality',
      exampleVal: 0
    },
    statEnergy: {
      unit: 'int',
      label: 'Energy',
      exampleVal: 0
    }
  },
  attributes: {
    attributeDamage: {
      unit: 'int',
      label: 'Damage',
      exampleVal: 0
    },
    attributeCriticalChance: {
      unit: 'percentage',
      label: 'Critical Chance',
      exampleVal: 0
    },
    attributeAttackSpeed: {
      unit: 'percentage',
      label: 'Attack Speed',
      exampleVal: 0
    },
    attributeEvasion: {
      unit: 'percentage',
      label: 'Evasion',
      exampleVal: 0
    },
    attributeMaxMana: {
      unit: 'int',
      label: 'Max Mana',
      exampleVal: 0
    },
    attributeManaRegen: {
      unit: 'int',
      label: 'Mana Regen',
      exampleVal: 0
    },
    attributeMagicDamage: {
      unit: 'int',
      label: 'Magic Damage',
      exampleVal: 0
    },
    attributeMaxHealth: {
      unit: 'int',
      label: 'Max Health',
      exampleVal: 0
    },
    attributeHealthRegen: {
      unit: 'int',
      label: 'Health Regen',
      exampleVal: 0
    },
    attributeDefense: {
      unit: 'int',
      label: 'Defense',
      exampleVal: 0
    }
  },
  currentState: {
    health: {
      unit: 'int',
      label: 'Health',
      exampleVal: 0
    },
    mana: {
      unit: 'int',
      label: 'Mana',
      exampleVal: 0
    },
    level: {
      unit: 'int',
      label: 'Level',
      exampleVal: 0
    },
    exp: {
      unit: 'int',
      label: 'Exp',
      exampleVal: 0
    },
    expToNextLevel: {
      unit: 'int',
      label: 'Exp To Next Level',
      exampleVal: 0
    },
    skillPoints: {
      unit: 'int',
      label: 'Skill Points',
      exampleVal: 0
    }
  }
} satisfies Record<string, Record<string, { unit: Units, label: string, exampleVal: number | string | boolean }>>
PLAYER_DATA.baseStats.statStrength.unit === 'int'

export type PlayerData = { [Key in keyof typeof PLAYER_DATA['baseStats']]: typeof PLAYER_DATA['baseStats'][Key]['exampleVal'] } &
{ [Key in keyof typeof PLAYER_DATA['attributes']]: typeof PLAYER_DATA['attributes'][Key]['exampleVal'] } &
{ [Key in keyof typeof PLAYER_DATA['currentState']]: typeof PLAYER_DATA['currentState'][Key]['exampleVal'] }

export class Player extends Physics.Arcade.Sprite {
  declare scene: MainGame
  declare body: Physics.Arcade.Body;
  declare data: DataOverride<Player, PlayerData>
  attackTarget: null | Enemy = null
  stateMachine
  #path: number[][] = []
  #movementSpeed = 200
  #attackRange = 300
  #attackPrepareTimeInitial = 500
  #attackPrepareTimer = 500
  #attackBackswingTimeInitial = 500
  #attackBackswingTimer = 500
  #lastHitTime = 0
  #regenDelay = 5000
  absorptionRange = 80
  #currentAbsorbingCorpse: Enemy | null = null
  #finder
  #grid

  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'slime');

    this.#grid = new PF.Grid(this.scene.gameMap.gridWidth, this.scene.gameMap.gridHeight);
    this.#finder = new PF.AStarFinder({ allowDiagonal: true, dontCrossCorners: true });

    this.setDataEnabled()
    const maxMana = PhaserMath.Between(5, 10);
    const maxHealth = PhaserMath.Between(5, 15);
    this.data.set({
      health: maxHealth,
      mana: maxMana,
      level: 1,
      exp: 0,
      expToNextLevel: 10,
      skillPoints: 10,

      statEnergy: 1,
      statAgility: 1,
      statStrength: 1,
      statVitality: 1,

      attributeDamage: PhaserMath.Between(1, 4),
      attributeCriticalChance: PhaserMath.FloatBetween(.01, .06),

      attributeAttackSpeed: PhaserMath.FloatBetween(.01, 0.04),
      attributeEvasion: PhaserMath.FloatBetween(.01, .04),

      attributeMaxMana: maxMana,
      attributeManaRegen: PhaserMath.Between(1, 2),
      attributeMagicDamage: PhaserMath.Between(3, 6),

      attributeMaxHealth: maxHealth,
      attributeHealthRegen: PhaserMath.Between(1, 3),
      attributeDefense: PhaserMath.Between(0, 2),
    })


    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);
    this.body.setCollideWorldBounds(true);
    this.scene.cameras.main.startFollow(this);
    this.scene.cameras.main.setDeadzone(500, 300)
    this.scene.scale.on('resize', () => {
      this.scene.cameras.main.pan(
        this.x,
        this.y,
        500,
        'Power2'
      );
    })

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('slime'),
      duration: 500,
      repeat: -1
    });

    this.stateMachine = new StateMachine({
      // debug: true,
      name: 'PlayerMachine',
      initial: 'idle',
      states: {
        idle: {
          onEnter: () => {
            this.play('idle');
            this.attackTarget = null
          },
          onUpdate: () => {
            const enemies = this.scene.enemies.getMatching('active', true).filter((enemy: Enemy) => !enemy.stateMachine.is('corpse'));
            if (enemies.length === 0) return;
            let closestEnemy: Enemy | null = null;
            let shortestDistance = Infinity;
            for (const enemy of enemies) {
              const dist = PhaserMath.Distance.Between(this.x, this.y, enemy.x, enemy.y);
              if (dist < shortestDistance) {
                shortestDistance = dist;
                closestEnemy = enemy;
              }
            }
            if (closestEnemy && shortestDistance <= this.#attackRange) {
              this.attackTarget = closestEnemy;
              this.stateMachine.set('attack-prepare');
            }
          }
        },
        move: {
          reenter: true,
          onEnter: (target: Input.Pointer) => {
            const path = this.#getPath(target.worldX, target.worldY)
            if (path) {
              this.#path = path
              this.attackTarget = null
            } else {
              this.stateMachine.set('idle')
            }
          },
          onUpdate: () => {
            const nextPoint = getPixelPosition(this.#path[0][0], this.#path[0][1], this.scene.gameMap.gridCellSize)
            this.scene.physics.moveTo(this, nextPoint.x, nextPoint.y, this.#movementSpeed)
            const distance = PhaserMath.Distance.Between(nextPoint.x, nextPoint.y, this.x, this.y);
            if (distance < 4) {
              this.#path.shift()
              if (!this.#path.length) {
                this.body.reset(nextPoint.x, nextPoint.y);
                this.stateMachine.set('idle')
              }
            }
          },
          onExit: () => {
            this.#path = []
            this.body.setVelocity(0)
          }
        },
        'attack-move': {
          reenter: true,
          onEnter: (target: Enemy) => {
            const path = this.#getPath(target.x, target.y)
            if (path) {
              this.#path = path
              this.attackTarget = target
            } else {
              this.stateMachine.set('idle')
            }
          },
          onUpdate: () => {
            const canBeAttacked = this.attackTarget && this.attackTarget.active && !this.attackTarget.stateMachine.is('corpse')
            if (!canBeAttacked) {
              return
            }
            const withinRange = isWithinRange(this.x, this.y, this.attackTarget!.x, this.attackTarget!.y, this.#attackRange)
            if (withinRange) {
              this.stateMachine.set('attack-prepare')
            } else {
              // MOVE LOGIC
              const nextPoint = getPixelPosition(this.#path[0][0], this.#path[0][1], this.scene.gameMap.gridCellSize)
              this.scene.physics.moveTo(this, nextPoint.x, nextPoint.y, this.#movementSpeed)
              const distance = PhaserMath.Distance.Between(nextPoint.x, nextPoint.y, this.x, this.y);
              if (distance < 4) {
                this.#path.shift()
                if (!this.#path.length) {
                  this.body.reset(nextPoint.x, nextPoint.y);
                }
              }
            }
          },
          onExit: () => {
            this.#path = []
            this.body.setVelocity(0)
          }
        },
        'attack-prepare': {
          onEnter: () => {
            this.#attackPrepareTimer = this.#attackPrepareTimeInitial
          },
          onUpdate: (dt) => {
            if (this.#attackPrepareTimer > 0) {
              this.#attackPrepareTimer -= dt * (this.data.get('attributeAttackSpeed') + 1)
            } else {
              const canBeAttacked = this.attackTarget && this.attackTarget.active && !this.attackTarget.stateMachine.is('corpse')
              if (canBeAttacked) {
                const bullet = this.scene.bullets.get(this.x, this.y) as Bullet
                bullet.ownerEntity = this
                bullet.enable();
                this.scene.physics.moveToObject(bullet, this.attackTarget!, bullet.speed);
                this.stateMachine.set('attack-backswing')
              } else {
                this.stateMachine.set('idle')
              }
            }
          }
        },
        'attack-backswing': {
          onEnter: () => {
            this.#attackBackswingTimer = this.#attackBackswingTimeInitial
          },
          onUpdate: (dt) => {
            if (this.#attackBackswingTimer > 0) {
              this.#attackBackswingTimer -= dt * (this.data.get('attributeAttackSpeed') + 1)
            } else {
              const canBeAttacked = this.attackTarget && this.attackTarget.active && !this.attackTarget.stateMachine.is('corpse')
              if (canBeAttacked) {
                const withinRange = isWithinRange(this.x, this.y, this.attackTarget!.x, this.attackTarget!.y, this.#attackRange)
                if (withinRange) {
                  this.stateMachine.set('attack-prepare')
                } else {
                  this.stateMachine.set('attack-move', this.attackTarget!)
                }
              } else {
                this.stateMachine.set('idle')
              }
            }
          }
        },
        'absorbe-move': {
          reenter: true,
          onEnter: (corpse: Enemy) => {
            const path = this.#getPath(corpse.x, corpse.y)
            if (path) {
              this.#currentAbsorbingCorpse = corpse
              this.#path = path
            } else {
              this.stateMachine.set('idle')
            }
          },
          onUpdate: () => {
            const canBeAbsorbed = this.#currentAbsorbingCorpse && this.#currentAbsorbingCorpse.active && this.#currentAbsorbingCorpse.stateMachine.is('corpse')
            if (!canBeAbsorbed) {
              return
            }
            const withinRange = isWithinRange(this.x, this.y, this.#currentAbsorbingCorpse!.x, this.#currentAbsorbingCorpse!.y, this.absorptionRange)
            if (withinRange) {
              this.stateMachine.set('absorbe')
            } else {
              const nextPoint = getPixelPosition(this.#path[0][0], this.#path[0][1], this.scene.gameMap.gridCellSize)
              this.scene.physics.moveTo(this, nextPoint.x, nextPoint.y, this.#movementSpeed)
              const distance = PhaserMath.Distance.Between(nextPoint.x, nextPoint.y, this.x, this.y);
              if (distance < 4) {
                this.#path.shift()
                if (!this.#path.length) {
                  this.body.reset(nextPoint.x, nextPoint.y);
                }
              }
            }
          },
          onExit: () => {
            this.#path = []
            this.body.setVelocity(0)
            this.#currentAbsorbingCorpse = null
          }
        },
        absorbe: {

        },
        cast: {
          // TODO: to be implemented
        },
        dead: {
          onEnter: () => {
            this.body.setEnable(false);
            this.play('idle');
            this.scene.scene.pause();
            this.scene.scene.launch('game-over');
          }
        }
      }
    })
    this.stateMachine.start()

  }

  preUpdate(time: number, dt: number) {
    super.preUpdate(time, dt)
    this.stateMachine.update(dt)

    if (this.stateMachine.is('dead')) return

    // this.#updateAbsorption(dt)

    if (this.scene.time.now - this.#lastHitTime < this.#regenDelay) return

    // Health Regeneration
    const health = this.data.get('health');
    const maxHealth = this.data.get('attributeMaxHealth');
    if (health < maxHealth) {
      const regen = this.data.get('attributeHealthRegen');
      const newHealth = Math.min(maxHealth, health + (regen * dt) / 1000);
      this.data.set('health', newHealth);
    }

    // Mana Regeneration
    const mana = this.data.get('mana');
    const maxMana = this.data.get('attributeMaxMana');
    if (mana < maxMana) {
      const regen = this.data.get('attributeManaRegen');
      const newMana = Math.min(maxMana, mana + (regen * dt) / 1000);
      this.data.set('mana', newMana);
    }
  }

  get currentAbsorbingCorpse() {
    return this.#currentAbsorbingCorpse
  }

  takeDamage(amount: number) {
    const evasionRoll = Math.random();
    if (evasionRoll < this.data.get('attributeEvasion')) {
      return
    }

    const defense = this.data.get('attributeDefense');
    const finalDamage = Math.min(1, Math.abs(amount - defense));

    this.#lastHitTime = this.scene.time.now;

    this.data.inc('health', -finalDamage)
    this.scene.cameras.main.shake(100, 0.003);
    this.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this,
      duration: 150,
      onComplete: () => this.clearTint()
    });

    if (this.data.get('health') <= 0) {
      this.stateMachine.set('dead');
    }
  }

  gainXP(amount: number) {
    this.data.inc('exp', amount)
    while (this.data.get('exp') >= this.data.get('expToNextLevel')) {
      this.data.inc('level', 1)
      this.data.inc('skillPoints', 5)
      this.data.inc('exp', -this.data.get('expToNextLevel'))
      this.data.inc('expToNextLevel', Math.floor(this.data.get('expToNextLevel') * 1.5))
    }
  }

  #getPath(x: number, y: number) {
    const playerCell = getCellFromPixel(this.x, this.y, this.scene.gameMap.gridCellSize)
    const targetCell = getCellFromPixel(x, y, this.scene.gameMap.gridCellSize)
    if (playerCell.cellX === targetCell.cellX && playerCell.cellY === targetCell.cellY) {
      return null
    }
    const path = this.#finder.findPath(playerCell.cellX, playerCell.cellY, targetCell.cellX, targetCell.cellY, this.#grid.clone());
    if (path.length > 0 && path[0][0] === playerCell.cellX && path[0][1] === playerCell.cellY) {
      path.shift();
    }
    return PF.Util.smoothenPath(this.#grid, path);
  }
}
