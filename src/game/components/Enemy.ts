import type { MainGame } from "../scenes/MainGame";
import { StateMachine } from "../stateMachine";
import type { Castle } from "./Castle";
import type { Player } from "./Player";
import type { Bullet } from "./Bullet";
import { isWithinRange } from "../utils";
import { Physics, Math as PhaserMath } from "phaser";

export interface EnemyConfig {
  maxHealth: number;
  damage: number;
  attackRange: number;
  chaseRange: number;
  movementSpeed: number;
  attackPrepareTime: number;
  attackBackswingTime: number;
  recalculateAttackMoveTime: number;
  xpValue: number;
  maxMana: number;
}

type AttackTarget = Player | Castle | null
export class Enemy extends Physics.Arcade.Sprite {
  declare body: Physics.Arcade.Body;
  declare scene: MainGame;
  id = crypto.randomUUID()
  stateMachine
  #attackTarget: AttackTarget = null
  #attackPrepareTimeInitial = 500
  #attackPrepareTimer = 500
  #recalculateAttackMoveTimeInitial = 200
  #recalculateAttackMoveTimer = 0
  #attackRange = 200
  #attackBackswingTimeInitial = 500
  #attackBackswingTimer = 500
  #movementSpeed = 100
  #chaseRange = 400
  #maxHealth = 3
  #health = 3
  #damage = 1
  #xpValue = 1
  #maxMana = 0
  #mana = 0

  constructor(scene: MainGame, x: number, y: number, texture: string, config: EnemyConfig) {
    super(scene, x, y, texture);

    this.#maxHealth = config.maxHealth;
    this.#health = config.maxHealth;
    this.#damage = config.damage;
    this.#attackRange = config.attackRange;
    this.#chaseRange = config.chaseRange;
    this.#movementSpeed = config.movementSpeed;
    this.#attackPrepareTimeInitial = config.attackPrepareTime;
    this.#attackBackswingTimeInitial = config.attackBackswingTime;
    this.#recalculateAttackMoveTimeInitial = config.recalculateAttackMoveTime;
    this.#xpValue = config.xpValue;
    this.#maxMana = config.maxMana;
    this.#mana = config.maxMana;

    this.setInteractive()
    this.scene.physics.add.existing(this)

    this.stateMachine = new StateMachine({
      // debug: true,
      name: 'EnemyMachine',
      initial: 'idle',
      states: {
        idle: {
          onEnter: () => {
            this.#attackTarget = null
          },
          onUpdate: () => {
            const attackTargets = [this.scene.player, this.scene.castle];
            let closestEnemy: NonNullable<AttackTarget> = this.scene.castle;
            let shortestDistance = Infinity;
            for (const possibleTarget of attackTargets) {
              const dist = PhaserMath.Distance.Between(this.x, this.y, possibleTarget.x, possibleTarget.y);
              if (dist < shortestDistance) {
                shortestDistance = dist;
                closestEnemy = possibleTarget;
              }
            }
            this.#attackTarget = closestEnemy;
            if (shortestDistance <= this.#attackRange) {
              this.stateMachine.set('attack-prepare');
            } else if (shortestDistance <= this.#chaseRange) {
              this.stateMachine.set('attack-move', closestEnemy);
            } else {
              this.scene.physics.moveToObject(this, this.scene.castle, this.#movementSpeed);
            }
          }
        },
        // move: {
        //   // TODO: to be implemented
        // },
        'attack-move': {
          reenter: true,
          onEnter: (target: Player | Castle) => {
            this.#attackTarget = target
          },
          onUpdate: (dt) => {
            if (!this.#attackTarget?.active) {
              return
            }
            if (this.#recalculateAttackMoveTimer > 0) {
              this.#recalculateAttackMoveTimer -= dt
            } else {
              this.#recalculateAttackMoveTimer = this.#recalculateAttackMoveTimeInitial
              const distanceToTarget = PhaserMath.Distance.Between(this.x, this.y, this.#attackTarget.x, this.#attackTarget.y)
              if (distanceToTarget < this.#attackRange) {
                this.stateMachine.set('attack-prepare')
              } else if (distanceToTarget < this.#chaseRange) {
                this.scene.physics.moveToObject(this, this.#attackTarget, this.#movementSpeed);
              } else {
                this.stateMachine.set('idle')
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
            if (!this.#attackTarget?.active) {
              this.stateMachine.set('idle')
            }
          },
          onUpdate: (dt) => {
            if (this.#attackPrepareTimer > 0) {
              this.#attackPrepareTimer -= dt
            } else {
              if (this.#attackTarget?.active) {
                const bullet = this.scene.bullets.get(this.x, this.y) as Bullet
                bullet.ownerEntity = this
                bullet.enable();
                this.scene.physics.moveToObject(bullet, this.#attackTarget, bullet.speed);
                this.stateMachine.set('attack-backswing')
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
              if (this.#attackTarget?.active) {
                const withinRange = isWithinRange(this.x, this.y, this.#attackTarget.x, this.#attackTarget.y, this.#attackRange)
                if (withinRange) {
                  this.stateMachine.set('attack-prepare')
                } else {
                  this.stateMachine.set('attack-move', this.#attackTarget)
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
            this.scene.tweens.add({
              targets: this,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                this.disable();
                this.scene.player.gainXP(this.#xpValue);
              }
            });
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


  disable() {
    this.setActive(false);
    this.setVisible(false)
  }

  enable() {
    this.setActive(true);
    this.setVisible(true)
    this.setAlpha(1)
    this.body.setEnable(true)
    this.#health = this.#maxHealth
    this.#mana = this.#maxMana
    this.stateMachine.reset()
  }

  get xpValue(): number {
    return this.#xpValue;
  }

  get damage(): number {
    return this.#damage;
  }

  get mana(): number {
    return this.#mana;
  }

  get maxMana(): number {
    return this.#maxMana;
  }

  takeDamage(amount: number) {
    this.#health -= amount;
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
}


export class Slime extends Enemy {
  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'slime', {
      maxHealth: 3,
      damage: 1,
      attackRange: 200,
      chaseRange: 400,
      movementSpeed: 100,
      attackPrepareTime: 500,
      attackBackswingTime: 500,
      recalculateAttackMoveTime: 200,
      xpValue: 1,
      maxMana: 5
    })

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('slime'),
      frameRate: 8,
      repeat: -1,
      randomFrame: true,
    });
    this.play('idle');
  }
}
