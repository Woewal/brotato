<template>
  <div class="top-3 max-w-2xl bg-white/90 p-3 rounded-sm text-sm shadow">
    <div class="mb-2 flex items-center gap-2">
      <div
        class="grid h-10 w-10 place-items-center rounded bg-slate-800 text-xl text-white shadow"
        :style="{ transform: rotationStyle, transformStyle: 'preserve-3d' }"
      >
        ↑
      </div>
      <div class="flex flex-col">
        <span>{{ statusMessage }}</span>
        <span class="text-xs opacity-70">{{ berlinStatusMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useGeolocation } from "@vueuse/core";
import { useHost } from "../lib/peerHost";
import type { Quaternion } from "../lib/peerClient";

const props = defineProps<{
  id: string;
}>();

const { on } = useHost();
const { coords } = useGeolocation();

const orientation = ref<Quaternion | null>(null);
const geolocation = ref<{ latitude: number; longitude: number } | null>(null);
const allowedErrorDegrees = 10;

type Vector3 = { x: number; y: number; z: number };

function isFiniteVector(vector: Vector3): boolean {
  return [vector.x, vector.y, vector.z].every(Number.isFinite);
}

function getFiniteErrorDegrees(cosine: number): number {
  if (!Number.isFinite(cosine)) {
    return 180;
  }

  const clampedCosine = Math.max(-1, Math.min(1, cosine));
  return toDegrees(Math.acos(clampedCosine));
}

function getHeadingFromVector(vector: Vector3): number {
  const horizontalDirection = normalizeVector({
    x: vector.x,
    y: vector.y,
    z: 0,
  });
  const headingRad = Math.atan2(horizontalDirection.x, horizontalDirection.y);

  return (toDegrees(headingRad) + 360) % 360;
}

function getHeadingErrorDegrees(targetVector: Vector3, quaternion: Quaternion) {
  const deviceDirection = rotateVectorByQuaternion(
    { x: 0, y: 1, z: 0 },
    quaternion,
  );
  const deviceHeading = getHeadingFromVector(deviceDirection);
  const targetHeading = getHeadingFromVector(targetVector);
  const delta = Math.abs(deviceHeading - targetHeading);

  return Math.min(delta, 360 - delta);
}

function getVectorErrorDegrees(targetVector: Vector3, quaternion: Quaternion) {
  const deviceDirection = rotateVectorByQuaternion(
    { x: 0, y: 1, z: 0 },
    quaternion,
  );
  const normalizedDeviceDirection = normalizeVector(deviceDirection);
  const normalizedTargetVector = normalizeVector(targetVector);
  const cosine = dot(normalizedDeviceDirection, normalizedTargetVector);

  return getFiniteErrorDegrees(cosine);
}

watch(
  coords,
  (value) => {
    if (value?.latitude != null && value?.longitude != null) {
      geolocation.value = {
        latitude: value.latitude,
        longitude: value.longitude,
      };
    }
  },
  { immediate: true },
);

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function normalizeVector(vector: Vector3): Vector3 {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  const safeLength = Number.isFinite(length) && length > 0 ? length : 1;

  return {
    x: vector.x / safeLength,
    y: vector.y / safeLength,
    z: vector.z / safeLength,
  };
}

function dot(a: Vector3, b: Vector3) {
  if (!isFiniteVector(a) || !isFiniteVector(b)) {
    return Number.NaN;
  }

  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vector3, b: Vector3): Vector3 {
  if (!isFiniteVector(a) || !isFiniteVector(b)) {
    return { x: 0, y: 0, z: 0 };
  }

  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

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

function quaternionFromDirection(
  direction: Vector3,
  referenceVector: Vector3 = { x: 0, y: 1, z: 0 },
): Quaternion {
  const forward = normalizeVector(referenceVector);
  const target = normalizeVector(direction);
  const axis = cross(forward, target);
  const cosine = Math.max(-1, Math.min(1, dot(forward, target)));
  const angle = Math.acos(cosine);

  if (Math.abs(angle) < 1e-6) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  const axisLength = Math.hypot(axis.x, axis.y, axis.z);
  if (axisLength < 1e-6) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  const normalizedAxis = {
    x: axis.x / axisLength,
    y: axis.y / axisLength,
    z: axis.z / axisLength,
  };

  const halfAngle = angle / 2;
  const s = Math.sin(halfAngle);

  return {
    x: normalizedAxis.x * s,
    y: normalizedAxis.y * s,
    z: normalizedAxis.z * s,
    w: Math.cos(halfAngle),
  };
}

function getSunDirection(
  latitude: number,
  longitude: number,
  date: Date,
): Vector3 {
  const julianDate =
    367 * date.getUTCFullYear() -
    Math.floor(
      7 * (date.getUTCFullYear() + Math.floor((date.getUTCMonth() + 9) / 12)),
    ) /
      4 +
    Math.floor((275 * (date.getUTCMonth() + 1)) / 9) +
    date.getUTCDate() +
    1721013.5 +
    (date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600) /
      24;

  const julianCenturies = (julianDate - 2451545.0) / 36525;
  const meanLongitude = (280.46 + 36000.77 * julianCenturies) % 360;
  const meanAnomaly = (357.528 + 35999.05 * julianCenturies) % 360;
  const eclipticLongitude =
    meanLongitude +
    1.915 * Math.sin(toRadians(meanAnomaly)) +
    0.02 * Math.sin(toRadians(2 * meanAnomaly));

  const obliquity = 23.439 - 0.013 * julianCenturies;
  const rightAscension = Math.atan2(
    Math.cos(toRadians(obliquity)) * Math.sin(toRadians(eclipticLongitude)),
    Math.cos(toRadians(eclipticLongitude)),
  );
  const declination = Math.asin(
    Math.sin(toRadians(obliquity)) * Math.sin(toRadians(eclipticLongitude)),
  );

  const localSiderealTime =
    (100.46 + 0.985647 * (julianDate - 2451545.0) + longitude) % 360;
  const hourAngle = toRadians(localSiderealTime) - rightAscension;

  const altitude = Math.asin(
    Math.sin(toRadians(latitude)) * Math.sin(declination) +
      Math.cos(toRadians(latitude)) *
        Math.cos(declination) *
        Math.cos(hourAngle),
  );

  const azimuth = Math.atan2(
    -Math.cos(declination) * Math.sin(hourAngle),
    Math.sin(toRadians(latitude)) *
      Math.cos(declination) *
      Math.cos(hourAngle) -
      Math.cos(toRadians(latitude)) * Math.sin(declination),
  );

  const normalizedAzimuth = (toDegrees(azimuth) + 360) % 360;
  const normalizedAltitude = toDegrees(altitude);
  const azimuthRad = toRadians(normalizedAzimuth);
  const altitudeRad = toRadians(normalizedAltitude);

  return {
    x: Math.cos(altitudeRad) * Math.sin(azimuthRad),
    y: Math.cos(altitudeRad) * Math.cos(azimuthRad),
    z: Math.sin(altitudeRad),
  };
}

function getDirectionToBerlin(latitude: number, longitude: number): Vector3 {
  const berlinLatitude = 52.52;
  const berlinLongitude = 13.405;

  const phi1 = toRadians(latitude);
  const phi2 = toRadians(berlinLatitude);
  const deltaLambda = toRadians(berlinLongitude - longitude);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360;
  const bearingRad = toRadians(bearing);

  return {
    x: Math.sin(bearingRad),
    y: Math.cos(bearingRad),
    z: 0,
  };
}

const sunDirection = computed<Vector3 | null>(() => {
  if (!geolocation.value) return null;

  return getSunDirection(
    geolocation.value.latitude,
    geolocation.value.longitude,
    new Date(),
  );
});

const pointingState = computed(() => {
  if (!orientation.value || !sunDirection.value) {
    return { pointing: false, errorDegrees: Number.POSITIVE_INFINITY };
  }

  const errorDegrees = getVectorErrorDegrees(
    sunDirection.value,
    orientation.value,
  );

  return {
    pointing: errorDegrees <= allowedErrorDegrees,
    errorDegrees,
  };
});

const berlinDirection = computed<Vector3 | null>(() => {
  if (!geolocation.value) return null;

  return getDirectionToBerlin(
    geolocation.value.latitude,
    geolocation.value.longitude,
  );
});

const berlinPointingState = computed(() => {
  if (!orientation.value || !berlinDirection.value) {
    return { pointing: false, errorDegrees: Number.POSITIVE_INFINITY };
  }

  const errorDegrees = getHeadingErrorDegrees(
    berlinDirection.value,
    orientation.value,
  );

  return {
    pointing: errorDegrees <= allowedErrorDegrees,
    errorDegrees,
  };
});

const statusMessage = computed(() => {
  if (!orientation.value || !sunDirection.value) {
    return "Pointing to sun: false";
  }

  return `Pointing to sun: ${pointingState.value.pointing ? "true" : "false"} (${pointingState.value.errorDegrees.toFixed(1)}° error, allowed ${allowedErrorDegrees}°)`;
});

const berlinStatusMessage = computed(() => {
  if (!orientation.value || !berlinDirection.value) {
    return "Pointing to Berlin: false";
  }

  return `Pointing to Berlin: ${berlinPointingState.value.pointing ? "true" : "false"} (${berlinPointingState.value.errorDegrees.toFixed(1)}° error, allowed ${allowedErrorDegrees}°)`;
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
  if (id !== props.id) return;

  orientation.value = payload.quaternion;
});
</script>
