import { describe, expect, it } from "vitest";
import { createPositionComparer } from "./position";

describe("createPositionComparer", () => {
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
});
