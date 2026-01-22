import type { MainGame } from "../scenes/MainGame";
import type { Bullet } from "./Bullet";
import { StateMachine } from "../stateMachine";
import { Enemy } from "./Enemy";
import { getPixelPosition, isWithinRange } from "../utils";
import { Math as PhaserMath, Physics } from "phaser";

export class Player extends Physics.Arcade.Sprite {
  declare scene: MainGame
  declare body: Physics.Arcade.Body;
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
  #maxHealth = 10
  #health = 10
  #xp = 0
  #level = 1
  #xpToNextLevel = 10
  #skillPoints = 0
  #damage = 1
  #maxMana = 10
  #mana = 10
  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'player');
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
      frames: this.anims.generateFrameNumbers('player'),
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
              this.#attackPrepareTimer -= dt
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
              this.#attackBackswingTimer -= dt
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
  }

  takeDamage(amount: number) {
    this.#health -= amount;
    this.scene.cameras.main.shake(100, 0.003);
    this.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this,
      duration: 150,
      onComplete: () => this.clearTint()
    });
    if (this.#health <= 0) {
      this.stateMachine.set('dead');
    }
  }

  gainXP(amount: number) {
    this.#xp += amount;
    while (this.#xp >= this.#xpToNextLevel) {
      this.#level++;
      this.#skillPoints += 5;
      this.#xpToNextLevel = Math.floor(this.#xpToNextLevel * 1.5);
    }
  }

  get damage(): number {
    return this.#damage;
  }

  get health(): number {
    return this.#health;
  }

  get maxHealth(): number {
    return this.#maxHealth;
  }

  get xp(): number {
    return this.#xp;
  }

  get xpToNextLevel(): number {
    return this.#xpToNextLevel;
  }

  get level(): number {
    return this.#level;
  }

  get mana(): number {
    return this.#mana;
  }

  get maxMana(): number {
    return this.#maxMana;
  }
}
