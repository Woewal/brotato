import { Peer } from "peerjs";
import { createHost } from "../lib/peer";
import { For, createEffect, createSignal } from "solid-js";
import createPlayerManager from "../lib/playerManager";
import PlayerCursor from "../components/PlayerCursor";
import { setPlayerStore } from "../stores/players";

const Host = () => {
  const host = createHost();
  const { roomId } = host;

  const playerManager = createPlayerManager(host);
  setPlayerStore(playerManager);

  setInterval(() => {
    host.sendAll("ping", new Date().getTime());
  }, 1000);

  return (
    <>
      <div>
        Players connected: {playerManager.connectedPlayers().length}, room id:{" "}
        {roomId()}
      </div>
      <For each={playerManager.connectedPlayers()}>
        {(playerId) => <PlayerCursor id={playerId} />}
      </For>
    </>
  );
};

export default Host;
