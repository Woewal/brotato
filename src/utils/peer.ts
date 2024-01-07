import Peer from "peerjs";
import { createSignal, onCleanup } from "solid-js";

type Command<T> = {
  from: "client" | "host";
  key: string;
  onReceive: (data: T) => void;
};

const commands: Command<any>[] = [];

export const createHost = () => {
  const peer = new Peer(Math.floor(Math.random() * 9999).toString());

  const [roomId, setRoomId] = createSignal<string>();

  peer.on("open", function (id) {
    console.log("My peer ID is: " + id);
    setRoomId(id);
  });

  peer.on("error", (error) => {
    alert(error.message);
  });

  peer.on("connection", (conn) => {
    console.log(conn.connectionId);
    conn.on("data", (data) => {
      console.log(data);
    });
  });

  onCleanup(() => peer.disconnect());

  return { roomId };
};

export const createClient = (id: string) => {
  var peer = new Peer();

  peer.on("open", () => {
    var conn = peer.connect(id);
  });

  onCleanup(() => peer.disconnect());
};
