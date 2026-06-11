<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { injectPlayers } from "../context/connection";
import { useGame } from "../context/game";
import useGameObject from "../composables/useGameObject";
import { useEnemies } from "../context/enemies";
import { Projectile } from "../lib/projectile";

const playerManager = injectPlayers();

const game = useGame();
const enemyManager = useEnemies();

const position = ref({
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

const sensitivity = 20;
const fireCooldown = 300;
let lastFire = 0;
let fireTimer: number | undefined;
const activeProjectiles: Projectile[] = [];

const removeProjectile = (projectile: Projectile) => {
  const index = activeProjectiles.indexOf(projectile);
  if (index >= 0) {
    activeProjectiles.splice(index, 1);
  }
};

function getYawDelta(prev: number, next: number) {
  let delta = prev - next;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

const tryFireAtClosestEnemy = () => {
  const now = performance.now();
  if (now - lastFire < fireCooldown) return;

  const target = enemyManager.getClosestEnemy(position.value.x, position.value.y);
  if (!target) return;

  lastFire = now;

  const projectile = new Projectile(game.scene.value, position.value.x, position.value.y, target, {
    speed: 420,
    radius: 6,
    color: 0x00ffff,
    hitRadius: 14,
    onHit: () => {
      // Keep enemies alive on hit for now.
    },
    onDestroy: () => {
      removeProjectile(projectile);
    },
  });

  activeProjectiles.push(projectile);
};

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

  const dyaw = getYawDelta(lastOrientation.value.yaw, _orientation.yaw) * sensitivity;
  const dpitch = (lastOrientation.value.pitch - _orientation.pitch) * sensitivity;

  position.value.x = minMax(position.value.x + dyaw, 0, window.innerWidth);
  position.value.y = minMax(position.value.y + dpitch, 0, window.innerHeight);

  circle.setPosition(position.value.x, position.value.y);

  lastOrientation.value = { yaw: _orientation.yaw, pitch: _orientation.pitch };
  tryFireAtClosestEnemy();
};

let circle: ReturnType<typeof game.scene.value.add.circle>;

useGameObject({
  factory: (factory) => {
    circle = factory.arc(500, 500, 10, 0, 360, false, 0x00ffff);
    return circle;
  },
});

onMounted(() => {
  playerManager.host.value.on("mouseOrientation", updatePosition);
  fireTimer = window.setInterval(() => {
    tryFireAtClosestEnemy();
  }, 400);
});

onUnmounted(() => {
  playerManager.host.value.off("mouseOrientation", updatePosition);
  if (fireTimer) {
    window.clearInterval(fireTimer);
  }
  activeProjectiles.forEach((projectile) => projectile.destroy());
});
</script>