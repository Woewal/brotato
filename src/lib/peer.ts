import Peer, { DataConnection } from "peerjs";
import { createSignal, onCleanup } from "solid-js";
import EventListener from "./eventListener";

type ClientMessages = {
  mousePositionDelta: [position: { x: number; y: number }];
  chat: [message: string];
  connect: [];
  disconnect: [];
};

type HostMessages = {
  ping: [dateNumber: number];
};

export const createHost = () => {
  const peer = new Peer(Math.floor(Math.random() * 9999).toString(), {});

  const [roomId, setRoomId] = createSignal<string>();

  const [connections, setConnections] = createSignal<DataConnection[]>([]);

  peer.on("open", function (id) {
    console.log("My peer ID is: " + id);
    setRoomId(id);
  });

  peer.on("error", (error) => {
    alert(error.message);
  });

  const eventListener = new EventListener<
    HostMessages & {
      [K in keyof ClientMessages]: [id: string, ...ClientMessages[K]];
    }
  >();

  eventListener.on("mousePositionDelta", (id, string) => {});

  peer.on("connection", (conn) => {
    setConnections((connections) => [...connections, conn]);

    eventListener.invoke("connect", conn.connectionId);

    conn.on("data", (data) => {
      if (typeof data != "object") return;

      if (!data["key"] || !eventListener.has(data["key"])) return;

      eventListener.invoke(data["key"], conn.connectionId, ...data["args"]);
    });
  });

  peer.on("disconnected", (connectedId) =>
    eventListener.invoke("disconnect", connectedId)
  );

  onCleanup(() => {
    peer.disconnect();
  });

  return {
    roomId,
    sendAll: <T extends keyof HostMessages>(
      key: T,
      ...args: HostMessages[T]
    ) => {
      connections().forEach((connection) => connection.send({ key, args }));
    },
    on: <T extends keyof ClientMessages>(
      key: T,
      handler: (id: string, ...args: ClientMessages[T]) => void
    ) =>
      eventListener.on(key, (id: string, ...args) =>
        handler(id, ...(args as any))
      ),
    off: <T extends keyof ClientMessages>(
      key: T,
      handler: (id: string, ...args: ClientMessages[T]) => void
    ) =>
      eventListener.off(key, (id: string, ...args) =>
        handler(id, ...(args as any))
      ),
  };
};

export const createClient = (id: string) => {
  var peer = new Peer();

  const eventListener = new EventListener<HostMessages & ClientMessages>();

  let conn: DataConnection;

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
    send: <T extends keyof ClientMessages>(
      key: T,
      ...args: ClientMessages[T]
    ) => conn?.send({ key, args }),
    on: <T extends keyof HostMessages>(
      key: T,
      handler: (...args: HostMessages[T]) => void
    ) => eventListener.on(key, handler),
    off: <T extends keyof HostMessages>(
      key: T,
      handler: (...args: HostMessages[T]) => void
    ) => eventListener.off(key, handler),
  };
};
