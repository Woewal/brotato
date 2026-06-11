<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { injectPlayers } from "../context/connection";
import { useGame } from "../context/game";
import useGameObject from "../composables/useGameObject";

const playerManager = injectPlayers();

const game = useGame();

const props = defineProps<{ id: string }>();

const targetPosition = ref({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
});

const ease = 0.15;

const minMax = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const updatePosition = (id: string, _position: { x: number; y: number }) => {
  if (id != props.id) return;

  targetPosition.value = {
    x: minMax(circle.x - _position.x * 30, 0, window.innerWidth),
    y: minMax(circle.y - _position.y * 30, 0, window.innerHeight),
  };
};

let circle: any;

useGameObject({
  factory: (factory, scene) => {
    circle = factory.arc(500, 500, 10, 0, 360, undefined, 0x00ffff);

    scene.physics.add.existing(circle);

    scene.events.on("update", () => {
      if (!circle) return;

      const x = lerp(circle.x, targetPosition.value.x, ease);
      const y = lerp(circle.y, targetPosition.value.y, ease);

      circle.setPosition(x, y);
    });

    return circle;
  },
});

onMounted(() => {
  playerManager.host.value!.on("mousePositionDelta", updatePosition);
});

onUnmounted(() => {
  playerManager.host.value!.off("mousePositionDelta", updatePosition);
});
</script>
