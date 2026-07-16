<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-white"
  >
    <div class="rounded-lg bg-white/10 p-4 text-center shadow-lg backdrop-blur">
      <div class="mb-2 text-sm opacity-80">Ping: {{ ping }}ms</div>
      <div class="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-slate-800 text-2xl shadow-inner">
        ↑
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useDeviceOrientation } from "@vueuse/core";
import { useRouteParams } from "@vueuse/router";
import { throttle } from "../lib/throttle";
import { createClient } from "../lib/peer";

const id = useRouteParams("id");
const client = createClient(id.value as string) as {
  send: (event: string, payload: unknown) => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
};
const { send, on } = client;

const ping = ref(0);

on("ping", (dateNumber) => {
  ping.value = Math.abs(dateNumber - Date.now());
});

// --- Device orientation ---
const { alpha, beta, gamma } = useDeviceOrientation();

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeAlpha(a: number) {
  return (a + 360) % 360;
}

// Throttled sender
const sendOrientation = throttle(
  (heading: number) => {
    send("compassHeading", { heading });
  },
  16.67,
);

// Watch orientation changes
watch([alpha, beta, gamma], ([a]) => {
  if (!isFiniteNumber(a)) return;

  const heading = normalizeAlpha(a);
  sendOrientation(heading);
});
</script>
