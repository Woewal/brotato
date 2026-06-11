<template>
  {{ ping }}
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useDeviceOrientation } from "@vueuse/core";
import { useRouteParams } from "@vueuse/router";
import { throttle } from "../lib/throttle";
import { createClient } from "../lib/peerClient";

const id = useRouteParams("id");
const { send, on } = createClient(id.value as string);

const ping = ref(0);
on("ping", (dateNumber) => {
  ping.value = Math.abs(dateNumber - Date.now());
});

// --- Device orientation ---
const { alpha, beta } = useDeviceOrientation();

const currentPosition = ref({
  x: 0,
  y: 0,
});

// Normalize helpers
function normalizeAlpha(a: number) {
  return (a + 360) % 360;
}

function normalizeBeta(b: number) {
  return Math.max(-90, Math.min(90, b));
}

// Throttled sender
const sendOrientation = throttle((yaw: number, pitch: number) => {
  send("mouseOrientation", { yaw, pitch });
}, 16.67);

// Watch orientation changes
watch([alpha, beta], ([a, b]) => {
  if (a == null || b == null) return;

  const yaw = normalizeAlpha(a);
  const pitch = normalizeBeta(b);

  sendOrientation(yaw, pitch);
});
</script>
