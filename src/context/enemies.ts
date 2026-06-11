import defineContext from "../lib/context";
import type * as Phaser from "phaser";

export type EnemyEntry = {
  id: string;
  sprite: Phaser.GameObjects.Arc;
};

const [useEnemies, provideEnemies] = defineContext(() => {
  const enemyMap = new Map<string, EnemyEntry>();

  const registerEnemy = (id: string, sprite: Phaser.GameObjects.Arc) => {
    enemyMap.set(id, { id, sprite });
  };

  const unregisterEnemy = (id: string) => {
    enemyMap.delete(id);
  };

  const getClosestEnemy = (x: number, y: number): EnemyEntry | null => {
    let closest: EnemyEntry | null = null;
    let shortestDistance = Number.POSITIVE_INFINITY;

    for (const enemy of enemyMap.values()) {
      if (!enemy.sprite.active) continue;
      const dx = enemy.sprite.x - x;
      const dy = enemy.sprite.y - y;
      const distance = Math.hypot(dx, dy);

      if (distance < shortestDistance) {
        shortestDistance = distance;
        closest = enemy;
      }
    }

    return closest;
  };

  return {
    registerEnemy,
    unregisterEnemy,
    getClosestEnemy,
  };
});

export { useEnemies, provideEnemies };