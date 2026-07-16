<template>
  <div class="top-3 max-w-2xl bg-white/90 p-3 rounded-sm text-sm shadow">
    <div class="mb-2 flex items-center gap-2">
      <div
        class="grid h-10 w-10 place-items-center rounded bg-slate-800 text-xl text-white shadow"
        :style="{ transform: rotationStyle, transformStyle: 'preserve-3d' }"
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
import { computed, ref, unref, watch } from "vue";
import { useGeolocation } from "@vueuse/core";
import { useHost } from "../lib/peerHost";
import type { Quaternion } from "../lib/peerClient";
import {
  comparePositionToTargets,
  getHeadingFromVector,
  getTargetPointingStates,
} from "../lib/position";

const props = defineProps<{
  id: string;
}>();

const { on } = useHost();
const { coords } = useGeolocation();

const orientation = ref<Quaternion | null>(null);
const heading = ref<number | null>(null);
const geolocation = ref<{ latitude: number; longitude: number } | null>(null);
const allowedErrorDegrees = 10;

type Vector3 = { x: number; y: number; z: number };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteVector(vector: Vector3): boolean {
  return [vector.x, vector.y, vector.z].every(Number.isFinite);
}

function getHeadingFromQuaternion(quaternion: Quaternion | null): number | null {
  if (!quaternion) return null;

  if (![quaternion.x, quaternion.y, quaternion.z, quaternion.w].every(Number.isFinite)) {
    return null;
  }

  const rotatedDirection = rotateVectorByQuaternion(
    { x: 0, y: 1, z: 0 },
    quaternion,
  );

  return getHeadingFromVector(rotatedDirection);
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

function rotateVectorByQuaternion(
  vector: Vector3,
  quaternion: Quaternion,
): Vector3 {
  if (
    !quaternion ||
    ![quaternion.x, quaternion.y, quaternion.z, quaternion.w].every(
      Number.isFinite,
    )
  ) {
    return vector;
  }

  const { x, y, z, w } = quaternion;
  const vx = vector.x;
  const vy = vector.y;
  const vz = vector.z;

  const ix = w * vx + y * vz - z * vy;
  const iy = w * vy + z * vx - x * vz;
  const iz = w * vz + x * vy - y * vx;
  const iw = -x * vx - y * vy - z * vz;

  return {
    x: ix * w + iw * -x + iy * -z - iz * -y,
    y: iy * w + iw * -y + iz * -x - ix * -z,
    z: iz * w + iw * -z + ix * -y - iy * -x,
  };
}

const targetCities = [
  { name: "Berlin", latitude: 52.52, longitude: 13.405 },
  { name: "Amsterdam", latitude: 52.3676, longitude: 4.9041 },
  { name: "New York", latitude: 40.7128, longitude: -74.006 },
] as const;

const resolvedHeading = computed<number | null>(() => {
  if (isFiniteNumber(heading.value)) {
    return heading.value;
  }

  return getHeadingFromQuaternion(orientation.value);
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

const rotationStyle = computed(() => {
  if (!orientation.value) return "";

  const { x, y, z, w } = orientation.value;
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

on("mouseOrientation", (id, payload) => {
  if (id !== props.id || !payload) return;

  if (
    payload.quaternion &&
    [payload.quaternion.x, payload.quaternion.y, payload.quaternion.z, payload.quaternion.w].every(Number.isFinite)
  ) {
    orientation.value = payload.quaternion;
  } else {
    orientation.value = null;
  }

  if (isFiniteNumber(payload.yaw)) {
    heading.value = (payload.yaw + 360) % 360;
  } else {
    heading.value = getHeadingFromQuaternion(payload.quaternion);
  }
});
</script>
