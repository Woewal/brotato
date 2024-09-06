<template><div ref="game-parent"></div></template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { createClient } from "../lib/peer";
import { throttle } from "../lib/throttle";
import { useRouteParams } from "@vueuse/router";
import useGame from "../lib/game";

const id = useRouteParams("id");
const { send, on } = createClient(id.value as string);

const currentPosition = ref({ x: 0, y: 0 });

// Function to normalize alpha values to the range [0, 360)
function normalizeAlpha(alpha: number): number {
  return alpha < 0 ? 360 + alpha : alpha % 360;
}

const gameParent = useTemplateRef("game-parent");

useGame({ element: gameParent.value });

// Function to normalize beta values to the range [-90, 90]
function normalizeBeta(beta: number): number {
  return Math.max(-90, Math.min(90, beta));
}

const handleOrientation = throttle((event: DeviceOrientationEvent) => {
  const alpha = event.alpha || 0; // Use a default value if alpha is undefined
  const beta = event.beta || 0; // Use a default value if beta is undefined

  const newPosition = {
    x: normalizeAlpha(alpha),
    y: normalizeBeta(beta),
  };

  const { x: currentX, y: currentY } = currentPosition.value;

  const deltaPosition = {
    x: -(currentX - newPosition.x) * 2,
    y: -(currentY - newPosition.y) * 2,
  };

  send("mousePositionDelta", deltaPosition);

  currentPosition.value = newPosition;
}, 16.67);

window.addEventListener("deviceorientation", handleOrientation);

const ping = ref(0);

on("ping", (dateNumber) => {
  ping.value = Math.abs(dateNumber - new Date().getTime());
});

// onCleanup(() => {
//   window.addEventListener("deviceorientation", handleOrientation);
// });
</script>
