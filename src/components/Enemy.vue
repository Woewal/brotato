<script setup lang="ts">
import { onUnmounted } from "vue";
import type * as Phaser from "phaser";
import useGameObject from "../composables/useGameObject";
import { useEnemies } from "../context/enemies";

const props = defineProps<{
  id: string;
  x: number;
  y: number;
  radius?: number;
  color?: number;
}>();

const enemyManager = useEnemies();
let circle: Phaser.GameObjects.Arc;

useGameObject({
    factory: (factory, scene) => {
            const radius = props.radius ?? 16;
            circle = factory.arc(props.x, props.y, radius, 0, 360, false, props.color ?? 0xffffff);
            scene.physics.add.existing(circle);

            const body = circle.body as Phaser.Physics.Arcade.Body;
            body.setCircle(radius);
            body.setImmovable(true);
            body.setAllowGravity(false);
            body.setCollideWorldBounds(true);

            enemyManager.registerEnemy(props.id, circle);

            return circle;
    },
});

onUnmounted(() => {
  enemyManager.unregisterEnemy(props.id);
});

</script>