import Peer, { DataConnection } from "peerjs";
import { createSignal, onCleanup } from "solid-js";
import EventListener from "./eventListener";

type ClientCommands = {
	mousePositionDelta: [position: { x: number; y: number }];
	chat: [message: string];
};

type HostCommands = {
	test: [number];
	test2: [string, number];
};

export const createHost = () => {
	const peer = new Peer(Math.floor(Math.random() * 9999).toString());

	const [roomId, setRoomId] = createSignal<string>();

	const [connections, setConnections] = createSignal<DataConnection[]>([]);

	peer.on("open", function (id) {
		console.log("My peer ID is: " + id);
		setRoomId(id);
	});

	peer.on("error", (error) => {
		alert(error.message);
	});

	const eventListener = new EventListener<HostCommands & ClientCommands>();

	peer.on("connection", (conn) => {
		setConnections((connections) => [...connections, conn]);

		conn.on("data", (data) => {
			if (typeof data != "object") return;

			if (!data["key"] || !eventListener.has(data["key"])) return;

			eventListener.invoke(data["key"], ...data["args"]);
		});
	});

	onCleanup(() => peer.disconnect());

	return {
		roomId,
		sendAll: <T extends keyof HostCommands>(
			key: T,
			...args: HostCommands[T]
		) => {
			connections().forEach((connection) => connection.send({ key, args }));
		},
		on: <T extends keyof ClientCommands>(
			key: T,
			handler: (...args: ClientCommands[T]) => void
		) => eventListener.on(key, handler),
		off: <T extends keyof ClientCommands>(
			key: T,
			handler: (...args: ClientCommands[T]) => void
		) => eventListener.off(key, handler),
	};
};

export const createClient = (id: string) => {
	var peer = new Peer();

	const eventListener = new EventListener<HostCommands & ClientCommands>();

	let conn: DataConnection | undefined;

	peer.on("open", () => {
		conn = peer.connect(id);

		conn.on("data", (data) => {
			if (typeof data != "object") return;

			if (!data["key"] || !eventListener.has(data["key"])) return;

			eventListener.invoke(data["key"], ...data["args"]);
		});
	});

	onCleanup(() => peer.disconnect());

	return {
		send: <T extends keyof ClientCommands>(
			key: T,
			...args: ClientCommands[T]
		) => conn.send({ key, args }),
		on: <T extends keyof HostCommands>(
			key: T,
			handler: (...args: HostCommands[T]) => void
		) => eventListener.on(key, handler),
		off: <T extends keyof HostCommands>(
			key: T,
			handler: (...args: HostCommands[T]) => void
		) => eventListener.off(key, handler),
	};
};
