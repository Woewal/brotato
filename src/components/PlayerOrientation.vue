<template>
  <div class="top-3 max-w-2xl bg-white/90 p-3 rounded-sm text-sm shadow">
    <div class="mb-2 flex items-center gap-2">
      <div
        class="grid h-10 w-10 place-items-center rounded bg-slate-800 text-xl text-white shadow"
      >
        ↑
      </div>
      <div class="flex flex-col gap-1">
        <span
          v-for="message in targetStatusMessages"
          :key="message"
          class="text-xs opacity-70"
        >
          {{ message }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useGeolocation } from "@vueuse/core";
import { useHost } from "../lib/peerHost";
import {
  comparePositionToTargets,
  getTargetPointingStates,
} from "../lib/position";

const props = defineProps<{
  id: string;
}>();

const { on } = useHost();
const { coords } = useGeolocation();

const heading = ref<number | null>(null);
const geolocation = ref<{ latitude: number; longitude: number } | null>(null);
const allowedErrorDegrees = 10;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

watch(
  coords,
  (value) => {
    const currentCoords = (value as { value?: { latitude?: number; longitude?: number } } | null)?.value ?? (value as { latitude?: number; longitude?: number } | null);

    if (currentCoords?.latitude != null && currentCoords?.longitude != null) {
      geolocation.value = {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
      };
    }
  },
  { immediate: true },
);

const targetCities = [
  { name: "Berlin", latitude: 52.52, longitude: 13.405 },
  { name: "Amsterdam", latitude: 52.3676, longitude: 4.9041 },
  { name: "New York", latitude: 40.7128, longitude: -74.006 },
] as const;

const resolvedHeading = computed<number | null>(() => {
  if (isFiniteNumber(heading.value)) {
    return heading.value;
  }

  return null;
});

function formatErrorDegrees(value: number) {
  if (!Number.isFinite(value)) {
    return "unknown";
  }

  return `${value.toFixed(1)}°`;
}

const targetStatusMessages = computed(() => {
  const heading = resolvedHeading.value;

  if (!isFiniteNumber(heading) || !geolocation.value) {
    return targetCities.map(({ name }) => {
      return `Pointing to ${name}: false (unknown error, allowed ${allowedErrorDegrees}°)`;
    });
  }

  const comparisons = comparePositionToTargets(
    {
      latitude: geolocation.value.latitude,
      longitude: geolocation.value.longitude,
    },
    targetCities,
  );

  return getTargetPointingStates(
    comparisons,
    heading,
    allowedErrorDegrees,
  ).map(({ name, errorDegrees, pointing }) => {
    return `Pointing to ${name}: ${pointing ? "true" : "false"} (${formatErrorDegrees(errorDegrees)} error, allowed ${allowedErrorDegrees}°)`;
  });
});

on("mouseOrientation", (id, payload) => {
  if (id !== props.id || !payload) return;

  if (isFiniteNumber(payload.heading)) {
    heading.value = (payload.heading + 360) % 360;
  } else {
    heading.value = null;
  }
});
</script>
