import { useParams } from "@solidjs/router";
import { createClient } from "../utils/peer";
import { createSignal, onCleanup } from "solid-js";

const Client = () => {
	const params = useParams();
	const { send } = createClient(params.id);

	const [currentPosition, setCurrentPosition] = createSignal({ x: 0, y: 0 });

	const handleOrientation = (event: DeviceOrientationEvent) => {
		const newPosition = { x: event.gamma, y: event.beta };
		const { x: currentX, y: currentY } = currentPosition();

		const deltaPosition = {
			x: currentX - newPosition.x,
			y: currentY - newPosition.y,
		};

		send("mousePositionDelta", deltaPosition);

		setCurrentPosition(newPosition);
	};

	window.addEventListener("deviceorientation", handleOrientation);

	onCleanup(() => {
		window.addEventListener("deviceorientation", handleOrientation);
	});

	return <div>{JSON.stringify(currentPosition())}</div>;
};

export default Client;
