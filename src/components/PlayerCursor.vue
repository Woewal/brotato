<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { injectPlayers } from "../context/players";
import { useGame } from "../context/game";

const playerManager = injectPlayers();

const game = useGame();

const position = ref({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
});

const props = defineProps<{ id: string }>();

const minMax = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const updatePosition = (id: string, _position: { x: number; y: number }) => {
  if (id != props.id) return;

  const { x, y } = circle;

  console.log("updating pos");

  circle.setPosition(x + _position.x, y + _position.y);

  // position.value = (() => {
  //   const previous = position.value;

  //   const newValue = {
  //     x: minMax(previous.x - _position.x * 30, 0, window.innerWidth),
  //     y: minMax(previous.y - _position.y * 30, 0, window.innerHeight),
  //   };

  //   return newValue;
  // })();
};

let circle: ReturnType<typeof game.scene.value.add.circle>;

onMounted(() => {
  console.log(game);

  let scene = game.scene.value;

  circle = scene.add.circle(400, 300, 50, 0xff0000); // x, y, radius, color

  playerManager.host.value.on("mousePositionDelta", updatePosition);
});

onUnmounted(() => {
  playerManager.host.value.off("mousePositionDelta", updatePosition);
});
</script>
