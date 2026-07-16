export type LatLng = {
  latitude: number;
  longitude: number;
};

export type PositionComparison = {
  bearingDegrees: number;
  distanceKm: number;
  direction: {
    x: number;
    y: number;
    z: number;
  };
};

export type PositionTarget = {
  name: string;
  latitude: number;
  longitude: number;
};

export type PositionTargetComparison = PositionComparison & {
  name: string;
};

export type TargetPointingState = PositionTargetComparison & {
  errorDegrees: number;
  pointing: boolean;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function sanitizeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function sanitizeVector(vector: { x: number; y: number; z: number }) {
  return {
    x: sanitizeNumber(vector.x),
    y: sanitizeNumber(vector.y),
    z: sanitizeNumber(vector.z),
  };
}

function normalizeVector(vector: { x: number; y: number; z: number }) {
  const safeVector = sanitizeVector(vector);
  const length = Math.hypot(safeVector.x, safeVector.y, safeVector.z) || 1;

  return {
    x: safeVector.x / length,
    y: safeVector.y / length,
    z: safeVector.z / length,
  };
}

export function getHeadingErrorDegrees(
  targetHeading: number,
  deviceHeading: number,
): number {
  if (!Number.isFinite(targetHeading) || !Number.isFinite(deviceHeading)) {
    return Number.POSITIVE_INFINITY;
  }

  const delta = Math.abs(deviceHeading - targetHeading);

  return Math.min(delta, 360 - delta);
}

export function getHeadingFromVector(vector: { x: number; y: number; z: number }) {
  const safeVector = sanitizeVector(vector);

  if (!Number.isFinite(safeVector.x) || !Number.isFinite(safeVector.y) || !Number.isFinite(safeVector.z)) {
    return Number.NaN;
  }

  const horizontalDirection = normalizeVector({
    x: safeVector.x,
    y: safeVector.y,
    z: 0,
  });
  const headingRad = Math.atan2(horizontalDirection.x, horizontalDirection.y);

  return (toDegrees(headingRad) + 360) % 360;
}

export function getAngularErrorDegrees(
  targetVector: { x: number; y: number; z: number },
  quaternion: { x: number; y: number; z: number; w: number } | null,
) {
  if (!quaternion) {
    return Number.POSITIVE_INFINITY;
  }

  if (![quaternion.x, quaternion.y, quaternion.z, quaternion.w].every(Number.isFinite)) {
    return Number.POSITIVE_INFINITY;
  }

  const safeTargetVector = sanitizeVector(targetVector);
  const deviceDirection = rotateVectorByQuaternion(
    { x: 0, y: 1, z: 0 },
    quaternion,
  );
  const safeDeviceDirection = sanitizeVector(deviceDirection);
  const normalizedDeviceDirection = normalizeVector(safeDeviceDirection);
  const normalizedTargetVector = normalizeVector(safeTargetVector);
  const cosine = Math.max(
    -1,
    Math.min(1, dot(normalizedDeviceDirection, normalizedTargetVector)),
  );

  const errorDegrees = toDegrees(Math.acos(cosine));

  if (Number.isFinite(errorDegrees)) {
    return errorDegrees;
  }

  const fallbackHeadingError = getHeadingErrorDegrees(
    getHeadingFromVector(safeTargetVector),
    getHeadingFromVector(safeDeviceDirection),
  );

  return Number.isFinite(fallbackHeadingError)
    ? fallbackHeadingError
    : Number.POSITIVE_INFINITY;
}

function dot(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function rotateVectorByQuaternion(
  vector: { x: number; y: number; z: number },
  quaternion: { x: number; y: number; z: number; w: number },
) {
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

export function createPositionComparer(currentPosition: LatLng) {
  return (targetPosition: LatLng): PositionComparison => {
    const fromLatitude = toRadians(currentPosition.latitude);
    const fromLongitude = toRadians(currentPosition.longitude);
    const toLatitude = toRadians(targetPosition.latitude);
    const toLongitude = toRadians(targetPosition.longitude);

    const latitudeDelta = toLatitude - fromLatitude;
    const longitudeDelta = toLongitude - fromLongitude;

    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(fromLatitude) *
        Math.cos(toLatitude) *
        Math.sin(longitudeDelta / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = EARTH_RADIUS_KM * c;

    const y =
      Math.sin(longitudeDelta) * Math.cos(toLatitude);
    const x =
      Math.cos(fromLatitude) * Math.sin(toLatitude) -
      Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDelta);
    const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360;

    const bearingRadians = toRadians(bearing);

    return {
      bearingDegrees: Number.isFinite(bearing) ? bearing : 0,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
      direction: normalizeVector({
        x: Math.sin(bearingRadians),
        y: Math.cos(bearingRadians),
        z: 0,
      }),
    };
  };
}

export function comparePositionToTargets(
  currentPosition: LatLng,
  targets: readonly PositionTarget[],
): PositionTargetComparison[] {
  const compare = createPositionComparer(currentPosition);

  return targets.map((target) => ({
    name: target.name,
    ...compare({ latitude: target.latitude, longitude: target.longitude }),
  }));
}

export function getTargetPointingStates(
  comparisons: readonly PositionTargetComparison[],
  deviceHeading: number,
  allowedErrorDegrees: number,
): TargetPointingState[] {
  const states = comparisons.map((comparison) => {
    const errorDegrees = getHeadingErrorDegrees(
      comparison.bearingDegrees,
      deviceHeading,
    );

    return {
      ...comparison,
      errorDegrees,
      pointing: false,
    };
  });

  let bestIndex = -1;
  let bestError = Number.POSITIVE_INFINITY;

  states.forEach((state, index) => {
    if (state.errorDegrees < bestError) {
      bestError = state.errorDegrees;
      bestIndex = index;
    }
  });

  return states.map((state, index) => ({
    ...state,
    pointing: index === bestIndex && state.errorDegrees <= allowedErrorDegrees,
  }));
}
