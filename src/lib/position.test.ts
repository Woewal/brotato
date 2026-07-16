import { describe, expect, it } from "vitest";
import {
  comparePositionToTargets,
  createPositionComparer,
  getAngularErrorDegrees,
  getHeadingErrorDegrees,
  getHeadingFromVector,
  getTargetPointingStates,
} from "./position";

describe("createPositionComparer", () => {
  it("returns comparisons for each configured target position", () => {
    const comparisons = comparePositionToTargets(
      { latitude: 0, longitude: 0 },
      [
        { name: "Berlin", latitude: 0, longitude: 90 },
        { name: "Amsterdam", latitude: 0, longitude: 45 },
      ],
    );

    expect(comparisons).toHaveLength(2);
    expect(comparisons[0].name).toBe("Berlin");
    expect(comparisons[0].bearingDegrees).toBeCloseTo(90, 5);
    expect(comparisons[1].name).toBe("Amsterdam");
    expect(comparisons[1].bearingDegrees).toBeCloseTo(90, 5);
  });

  it("marks only the closest target as pointing when multiple targets are within tolerance", () => {
    const states = getTargetPointingStates(
      [
        { name: "Berlin", bearingDegrees: 10, distanceKm: 0, direction: { x: 0, y: 0, z: 0 } },
        { name: "Amsterdam", bearingDegrees: 12, distanceKm: 0, direction: { x: 0, y: 0, z: 0 } },
        { name: "New York", bearingDegrees: 15, distanceKm: 0, direction: { x: 0, y: 0, z: 0 } },
      ],
      11,
      15,
    );

    expect(states[0].pointing).toBe(true);
    expect(states[1].pointing).toBe(false);
    expect(states[2].pointing).toBe(false);
    expect(states[0].errorDegrees).toBe(1);
  });

  it("returns distinct heading errors for different target cities from the same position", () => {
    const comparisons = comparePositionToTargets(
      { latitude: 52.3676, longitude: 4.9041 },
      [
        { name: "Berlin", latitude: 52.52, longitude: 13.405 },
        { name: "Amsterdam", latitude: 52.3676, longitude: 4.9041 },
        { name: "New York", latitude: 40.7128, longitude: -74.006 },
      ],
    );

    const states = getTargetPointingStates(comparisons, 0, 10);

    expect(states[0].errorDegrees).not.toBe(states[1].errorDegrees);
    expect(states[0].errorDegrees).not.toBe(states[2].errorDegrees);
    expect(states[1].errorDegrees).not.toBe(states[2].errorDegrees);
  });

  it("returns zero distance and zero bearing for the same position", () => {
    const compare = createPositionComparer({ latitude: 52.52, longitude: 13.405 });

    const result = compare({ latitude: 52.52, longitude: 13.405 });

    expect(result.distanceKm).toBe(0);
    expect(result.bearingDegrees).toBe(0);
  });

  it("computes an eastward bearing from the equator to 90 degrees east", () => {
    const compare = createPositionComparer({ latitude: 0, longitude: 0 });

    const result = compare({ latitude: 0, longitude: 90 });

    expect(result.bearingDegrees).toBeCloseTo(90, 5);
    expect(result.distanceKm).toBeCloseTo(10007.5, 0);
  });

  it("returns a normalized direction vector for a target position", () => {
    const compare = createPositionComparer({ latitude: 0, longitude: 0 });

    const result = compare({ latitude: 0, longitude: 90 });

    const length = Math.hypot(result.direction.x, result.direction.y, result.direction.z);

    expect(length).toBeCloseTo(1, 5);
    expect(result.direction.x).toBeGreaterThan(0);
    expect(result.direction.y).toBeCloseTo(0, 5);
  });

  it("computes the short angular distance between headings", () => {
    expect(getHeadingErrorDegrees(10, 350)).toBe(20);
    expect(getHeadingErrorDegrees(0, 180)).toBe(180);
    expect(getHeadingErrorDegrees(90, 90)).toBe(0);
  });

  it("derives a finite heading from a vector", () => {
    expect(getHeadingFromVector({ x: 0, y: 1, z: 0 })).toBe(0);
    expect(getHeadingFromVector({ x: 1, y: 0, z: 0 })).toBe(90);
  });

  it("treats a device quaternion as pointed at the sun when the angular error is within tolerance", () => {
    const sunDirection = { x: 0, y: 1, z: 0 };
    const deviceQuaternion = { x: 0, y: 0, z: 0, w: 1 };
    const errorDegrees = getAngularErrorDegrees(sunDirection, deviceQuaternion);

    expect(errorDegrees).toBe(0);
    expect(errorDegrees <= 10).toBe(true);
  });

  it("falls back to a heading-based error when the target vector contains invalid values", () => {
    const errorDegrees = getAngularErrorDegrees(
      { x: 0, y: 1, z: Number.NaN },
      { x: 0, y: 0, z: 0.7071067811865475, w: 0.7071067811865475 },
    );

    expect(Number.isFinite(errorDegrees)).toBe(true);
    expect(errorDegrees).toBe(90);
  });

  it("computes a finite 3D angular error from a quaternion", () => {
    expect(
      getAngularErrorDegrees({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }),
    ).toBe(0);
    expect(
      getAngularErrorDegrees({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1, w: 0 }),
    ).toBe(180);
  });
});
