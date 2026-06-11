import type * as Phaser from "phaser";
import type { EnemyEntry } from "../context/enemies";

export type ProjectileOptions = {
  speed?: number;
  radius?: number;
  color?: number;
  hitRadius?: number;
  onHit?: (target: EnemyEntry) => void;
  onDestroy?: () => void;
};

export class Projectile {
  sprite: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;
  private target: EnemyEntry;
  private speed: number;
  private hitRadius: number;
  private onHit?: (target: EnemyEntry) => void;
  private onDestroy?: () => void;
  private updateHandler: (time: number, delta: number) => void;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: EnemyEntry,
    options: ProjectileOptions = {}
  ) {
    this.scene = scene;
    this.target = target;
    this.speed = options.speed ?? 320;
    this.hitRadius = options.hitRadius ?? Math.max(options.radius ?? 5, 12);
    this.onHit = options.onHit;
    this.onDestroy = options.onDestroy;

    const radius = options.radius ?? 5;
    this.sprite = scene.add.arc(x, y, radius, 0, 360, false, options.color ?? 0xffff00);

    this.updateHandler = this.update.bind(this);
    this.scene.events.on("update", this.updateHandler);
  }

  private update(_time: number, delta: number) {
    if (this.destroyed) return;

    if (!this.target.sprite.active) {
      this.destroy();
      return;
    }

    const dx = this.target.sprite.x - this.sprite.x;
    const dy = this.target.sprite.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= this.hitRadius) {
      this.onHit?.(this.target);
      this.destroy();
      return;
    }

    const step = (this.speed * delta) / 1000;
    if (distance > 0) {
      this.sprite.x += (dx / distance) * step;
      this.sprite.y += (dy / distance) * step;
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.events.off("update", this.updateHandler);
    this.sprite.destroy();
    this.onDestroy?.();
  }
}
