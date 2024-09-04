import { createSignal } from "solid-js";
import { playerStore } from "../stores/players";

const PlayerCursor = (props: { id: string }) => {
	const { eventListener } = playerStore;

	const [position, setPosition] = createSignal({
		x: window.innerWidth / 2,
		y: window.innerHeight / 2,
	});

	const minMax = (value: number, min: number, max: number) => {
		if (value < min) return min;
		if (value > max) return max;
		return value;
	};

	const updatePosition = (id: string, position: { x: number; y: number }) => {
		if (id != props.id) return;

		setPosition((previous) => {
			const newValue = {
				x: minMax(previous.x - position.x * 30, 0, window.innerWidth),
				y: minMax(previous.y - position.y * 30, 0, window.innerHeight),
			};

			return newValue;
		});
	};

	eventListener.on("mousePositionDelta", updatePosition);

	return (
		<div
			style={{
				position: "fixed",
				width: "30px",
				height: "30px",
				background: "hotpink",
				left: `${position().x}px`,
				top: `${position().y}px`,
				transition: "0.2s all ease",
			}}
		></div>
	);
};

export default PlayerCursor;
