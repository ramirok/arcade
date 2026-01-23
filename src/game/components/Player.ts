import type { MainGame } from "../scenes/MainGame";
import type { Bullet } from "./Bullet";
import { StateMachine } from "../stateMachine";
import { Enemy } from "./Enemy";
import { getPixelPosition, isWithinRange, type DataOverride } from "../utils";
import { Math as PhaserMath, Physics } from "phaser";


export type PlayerData = {
  statStrength: number
  statAgility: number
  statVitality: number
  statEnergy: number

  attributeDamage: number
  attributeCriticalChance: number

  attributeAttackSpeed: number
  attributeEvasion: number

  attributeMaxMana: number
  attributeManaRegen: number
  attributeMagicDamage: number

  attributeMaxHealth: number
  attributeHealthRegen: number
  attributeDefense: number

  health: number;
  mana: number
  lvl: number
  xp: number
  xpToNextLVL: number
  skillPoints: number
}

export class Player extends Physics.Arcade.Sprite {
  declare scene: MainGame
  declare body: Physics.Arcade.Body;
  declare data: DataOverride<Player, PlayerData>
  attackTarget: null | Enemy = null
  stateMachine
  path: number[][] = []
  #movementSpeed = 200
  #attackRange = 300
  #attackPrepareTimeInitial = 500
  #attackPrepareTimer = 500
  #attackBackswingTimeInitial = 500
  #attackBackswingTimer = 500
  #recalculateAttackMoveTimeInitial = 200
  #recalculateAttackMoveTimer = 0
  #lastHitTime = 0
  #REGEN_DELAY = 5000

  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'slime');

    this.setDataEnabled()
    const maxMana = PhaserMath.Between(5, 10);
    const maxHealth = PhaserMath.Between(5, 15);
    this.data.set({
      health: maxHealth,
      mana: maxMana,
      lvl: 1,
      xp: 0,
      xpToNextLVL: 10,
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
            const enemies = this.scene.enemies.getMatching('active', true) as Enemy[];
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
          onEnter: (path: typeof this.path) => {
            this.path = path
            this.attackTarget = null
          },
          onUpdate: () => {
            const nextPoint = getPixelPosition(this.path[0][0], this.path[0][1])
            this.scene.physics.moveTo(this, nextPoint.x, nextPoint.y, this.#movementSpeed)
            const distance = PhaserMath.Distance.Between(nextPoint.x, nextPoint.y, this.x, this.y);
            if (distance < 4) {
              this.path.shift()
              if (!this.path.length) {
                this.body.reset(nextPoint.x, nextPoint.y);
                this.stateMachine.set('idle')
              }
            }
          },
          onExit: () => {
            this.path = []
            this.body.setVelocity(0)
          }
        },
        'attack-move': {
          reenter: true,
          onEnter: (target: Enemy) => {
            this.attackTarget = target
          },
          onUpdate: (dt) => {
            if (!this.attackTarget?.active) {
              return
            }
            if (this.#recalculateAttackMoveTimer > 0) {
              this.#recalculateAttackMoveTimer -= dt
            } else {
              this.#recalculateAttackMoveTimer = this.#recalculateAttackMoveTimeInitial
              const withinRange = isWithinRange(this.x, this.y, this.attackTarget.x, this.attackTarget.y, this.#attackRange)
              if (withinRange) {
                this.stateMachine.set('attack-prepare')
              } else {
                this.scene.physics.moveToObject(this, this.attackTarget, this.#movementSpeed);
              }
            }
          },
          onExit: () => {
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
              if (this.attackTarget?.active) {
                const bullet = this.scene.bullets.get(this.x, this.y) as Bullet
                bullet.ownerEntity = this
                bullet.enable();
                this.scene.physics.moveToObject(bullet, this.attackTarget, bullet.speed);
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
              if (this.attackTarget?.active) {
                const withinRange = isWithinRange(this.x, this.y, this.attackTarget.x, this.attackTarget.y, this.#attackRange)
                if (withinRange) {
                  this.stateMachine.set('attack-prepare')
                } else {
                  this.stateMachine.set('attack-move', this.attackTarget)
                }
              } else {
                this.stateMachine.set('idle')
              }
            }
          }
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

    if (this.scene.time.now - this.#lastHitTime < this.#REGEN_DELAY) return

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

  takeDamage(amount: number) {
    const evasionRoll = Math.random();
    if (evasionRoll < this.data.get('attributeEvasion')) {
      return
    }

    const defense = this.data.get('attributeDefense');
    const finalDamage = Math.max(1, amount - defense);

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
    this.data.inc('xp', amount)
    while (this.data.get('xp') >= this.data.get('xpToNextLVL')) {
      this.data.inc('lvl', 1)
      this.data.inc('skillPoints', 5)
      this.data.inc('xp', -this.data.get('xpToNextLVL'))
      this.data.inc('xpToNextLVL', Math.floor(this.data.get('xpToNextLVL') * 1.5))
    }
  }

}
