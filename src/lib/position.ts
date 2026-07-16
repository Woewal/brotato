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

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function normalizeVector(vector: { x: number; y: number; z: number }) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
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
