import type { MainGame } from "../scenes/MainGame.svelte";
import { StateMachine } from "../stateMachine";
import type { Castle } from "./Castle";
import type { Player } from "./Player";
import type { Bullet } from "./Bullet";
import { isWithinRange } from "../utils";

type AttackTarget = Player | Castle | null
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  declare scene: MainGame;
  id = crypto.randomUUID()
  stateMachine
  #attackTarget: AttackTarget = null
  #attackPrepareTimeInitial = 500
  #attackPrepareTimer = 500
  #recalculateAttackMoveTimeInitial = 200
  #recalculateAttackMoveTimer = 0
  #attackRange = 100
  #attackBackswingTimeInitial = 500
  #attackBackswingTimer = 500
  #movementSpeed = 100
  #chaseRange = 400
  #maxHealth = 3
  #health = 3
  #damage = 1

  constructor(scene: MainGame, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

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
              const dist = Phaser.Math.Distance.Between(this.x, this.y, possibleTarget.x, possibleTarget.y);
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
              const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.#attackTarget.x, this.#attackTarget.y)
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
              }
            });
          }
        }
      }
    })
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
    this.body.setEnable(true)
    this.#health = this.#maxHealth
    this.stateMachine.set('idle')
  }

  takeDamage(amount: number) {
    this.#health -= amount;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 1
    });
    if (this.#health <= 0) {
      this.stateMachine.set('dead');
    }
  }
}


export class Slime extends Enemy {
  constructor(scene: MainGame, x: number, y: number) {
    super(scene, x, y, 'slime')

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('slime'),
      frameRate: 8,
      repeat: -1, // Loop forever
      randomFrame: true,
    });
    this.play('idle');
  }
}
