import Peer, { DataConnection } from "peerjs";
import EventListener from "./eventListener";
import { ref } from "vue";

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

  const roomId = ref<string>("");

  const connections = ref(new Set<DataConnection>());

  peer.on("open", function (id) {
    console.log("My peer ID is: " + id);
    roomId.value = id;
  });

  peer.on("error", (error) => {
    alert(error.message);
  });

  const eventListener = new EventListener<
    HostMessages & {
      [K in keyof ClientMessages]: [id: string, ...ClientMessages[K]];
    }
  >();

  const addDevPlayer = () => {
    eventListener.invoke("connect", "dev");

    const updateInputs = () => {
      document.addEventListener("keydown", (event) => {
        let horizontal = 0;
        let vertical = 0;
        switch (event.code) {
          case "KeyW":
            vertical = -1;
            // Add logic for W key
            break;
          case "KeyA":
            horizontal = -1;
            // Add logic for A key
            break;
          case "KeyS":
            vertical = 1;
            // Add logic for S key
            break;
          case "KeyD":
            horizontal = 1;
            // Add logic for D key
            break;
        }

        eventListener.invoke("mousePositionDelta", "dev", {
          x: horizontal,
          y: vertical,
        }); //add deltatime
      });
      requestAnimationFrame(updateInputs);
    };
    updateInputs();
  };

  setTimeout(() => {
    addDevPlayer();
  }, 1000);

  peer.on("connection", (conn) => {
    connections.value.add(conn);

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

  return {
    roomId,
    sendAll: <T extends keyof HostMessages>(
      key: T,
      ...args: HostMessages[T]
    ) => {
      connections.value.forEach((connection) => connection.send({ key, args }));
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
