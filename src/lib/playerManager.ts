import { createSignal, onCleanup } from "solid-js";
import { createHost } from "./peer";
import EventListener from "./eventListener";

const createPlayerManager = (
	hostEventListener: ReturnType<typeof createHost>
) => {
	const [connectedPlayers, setConnectedPlayers] = createSignal<string[]>([]);

	const addPlayer = (id: string) => {
		setConnectedPlayers((prev) => [...prev, id]);
	};

	const removePlayer = (id: string) => {
		setConnectedPlayers((prev) => prev.filter((x) => x != id));
	};

	hostEventListener.on("connect", addPlayer);
	hostEventListener.on("disconnect", removePlayer);

	onCleanup(() => {
		hostEventListener.off("connect", addPlayer);
		hostEventListener.off("disconnect", removePlayer);
	});

	return { connectedPlayers, eventListener: hostEventListener };
};

export default createPlayerManager;
