<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-white"
  >
    <div class="rounded-lg bg-white/10 p-4 text-center shadow-lg backdrop-blur">
      <div class="mb-2 text-sm opacity-80">Ping: {{ ping }}ms</div>
      <div
        class="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-slate-800 text-2xl shadow-inner"
        :style="{ transform: rotationStyle, transformStyle: 'preserve-3d' }"
      >
        ↑
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDeviceOrientation } from "@vueuse/core";
import { useRouteParams } from "@vueuse/router";
import { throttle } from "../lib/throttle";
import { createClient, type Quaternion } from "../lib/peerClient";

const id = useRouteParams("id");
const { send, on } = createClient(id.value as string);

const ping = ref(0);
const deviceQuaternion = ref<Quaternion | null>(null);
on("ping", (dateNumber) => {
  ping.value = Math.abs(dateNumber - Date.now());
});

// --- Device orientation ---
const { alpha, beta, gamma } = useDeviceOrientation();

const currentPosition = ref({
  x: 0,
  y: 0,
});

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// Normalize helpers
function normalizeAlpha(a: number) {
  return (a + 360) % 360;
}

function normalizeBeta(b: number) {
  return Math.max(-90, Math.min(90, b));
}

function normalizeGamma(g: number) {
  return Math.max(-180, Math.min(180, g));
}

function eulerToQuaternion(
  yaw: number,
  pitch: number,
  roll: number,
): Quaternion {
  const yawRad = (yaw * Math.PI) / 180;
  const pitchRad = (pitch * Math.PI) / 180;
  const rollRad = (roll * Math.PI) / 180;

  const cy = Math.cos(yawRad / 2);
  const sy = Math.sin(yawRad / 2);
  const cp = Math.cos(pitchRad / 2);
  const sp = Math.sin(pitchRad / 2);
  const cr = Math.cos(rollRad / 2);
  const sr = Math.sin(rollRad / 2);

  return {
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy,
  };
}

// Throttled sender
const sendOrientation = throttle(
  (yaw: number, pitch: number, quaternion: Quaternion) => {
    send("mouseOrientation", { yaw, pitch, quaternion });
  },
  16.67,
);

// Watch orientation changes
watch([alpha, beta, gamma], ([a, b, g]) => {
  if (!isFiniteNumber(a) || !isFiniteNumber(b) || !isFiniteNumber(g)) return;

  const yaw = normalizeAlpha(a);
  const pitch = normalizeBeta(b);
  const roll = normalizeGamma(g);
  const quaternion = eulerToQuaternion(yaw, pitch, roll);

  deviceQuaternion.value = quaternion;
  sendOrientation(yaw, pitch, quaternion);
});

const rotationStyle = computed(() => {
  if (!deviceQuaternion.value) return "";

  const { x, y, z, w } = deviceQuaternion.value;
  const matrix = [
    1 - 2 * (y * y + z * z),
    2 * (x * y + z * w),
    2 * (x * z - y * w),
    0,
    2 * (x * y - z * w),
    1 - 2 * (x * x + z * z),
    2 * (y * z + x * w),
    0,
    2 * (x * z + y * w),
    2 * (y * z - x * w),
    1 - 2 * (x * x + y * y),
    0,
    0,
    0,
    0,
    1,
  ];

  return `matrix3d(${matrix.join(",")})`;
});
</script>
