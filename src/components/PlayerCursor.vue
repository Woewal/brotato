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

// Track last orientation for delta calculation
const lastOrientation = ref<{ yaw: number; pitch: number } | null>(null);

const props = defineProps<{ id: string }>();

const minMax = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const sensitivity = 10; // Adjust this value for more/less sensitivity

function getYawDelta(prev: number, next: number) {
  let delta = prev - next;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

const updatePosition = (
  id: string,
  _orientation: { yaw: number; pitch: number }
) => {
  if (id != props.id) return;

  if (!lastOrientation.value) {
    lastOrientation.value = {
      yaw: _orientation.yaw,
      pitch: _orientation.pitch,
    };
    return;
  }

  // Flip yaw direction and handle wrapping
  const dyaw =
    getYawDelta(lastOrientation.value.yaw, _orientation.yaw) * sensitivity;
  // Flip pitch direction
  const dpitch =
    (lastOrientation.value.pitch - _orientation.pitch) * sensitivity;

  position.value.x = minMax(position.value.x + dyaw, 0, window.innerWidth);
  position.value.y = minMax(position.value.y + dpitch, 0, window.innerHeight);

  circle.setPosition(position.value.x, position.value.y);

  lastOrientation.value = { yaw: _orientation.yaw, pitch: _orientation.pitch };
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
  console.log(game);

  playerManager.host.value.on("mouseOrientation", updatePosition);
});

onUnmounted(() => {
  playerManager.host.value.off("mouseOrientation", updatePosition);
});
</script>
