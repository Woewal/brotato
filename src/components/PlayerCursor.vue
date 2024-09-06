<template>
  <div
    :style="{
      position: 'fixed',
      width: '30px',
      height: '30px',
      background: 'hotpink',
      left: `${position.x}px`,
      top: `${position.y}px`,
      transition: '0.2s all ease',
    }"
  ></div>
  );
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { injectPlayers } from "../context/players";

const playerManager = injectPlayers();

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

  position.value = (() => {
    const previous = position.value;

    const newValue = {
      x: minMax(previous.x - _position.x * 30, 0, window.innerWidth),
      y: minMax(previous.y - _position.y * 30, 0, window.innerHeight),
    };

    return newValue;
  })();
};

onMounted(() => {
  playerManager.host.value.on("mousePositionDelta", updatePosition);
});

onUnmounted(() => {
  playerManager.host.value.off("mousePositionDelta", updatePosition);
});
</script>
