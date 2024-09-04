import { useParams } from "@solidjs/router";
import { createClient } from "../lib/peer";
import { createSignal, onCleanup } from "solid-js";
import { throttle } from "../lib/throttle";

const Client = () => {
  const params = useParams();
  const { send, on } = createClient(params.id);

  const [currentPosition, setCurrentPosition] = createSignal({ x: 0, y: 0 });

  // Function to normalize alpha values to the range [0, 360)
  function normalizeAlpha(alpha: number): number {
    return alpha < 0 ? 360 + alpha : alpha % 360;
  }

  // Function to normalize beta values to the range [-90, 90]
  function normalizeBeta(beta: number): number {
    return Math.max(-90, Math.min(90, beta));
  }

  const handleOrientation = throttle((event: DeviceOrientationEvent) => {
    const alpha = event.alpha || 0; // Use a default value if alpha is undefined
    const beta = event.beta || 0; // Use a default value if beta is undefined

    const newPosition = {
      x: normalizeAlpha(alpha),
      y: normalizeBeta(beta),
    };

    const { x: currentX, y: currentY } = currentPosition();

    const deltaPosition = {
      x: -(currentX - newPosition.x) * 2,
      y: -(currentY - newPosition.y) * 2,
    };

    send("mousePositionDelta", deltaPosition);

    setCurrentPosition(newPosition);
  }, 16.67);

  window.addEventListener("deviceorientation", handleOrientation);

  const [ping, setPing] = createSignal(0);

  on("ping", (dateNumber) => {
    setPing(Math.abs(dateNumber - new Date().getTime()));
  });

  onCleanup(() => {
    window.addEventListener("deviceorientation", handleOrientation);
  });

  return <div>{ping()}</div>;
};

export default Client;
