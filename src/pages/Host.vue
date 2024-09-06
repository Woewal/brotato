<template>
  <div>
    Players connected: {{ playerManager.connectedPlayers.value.size }}, room id:
    {{ roomId }}
  </div>

  <PlayerCursor
    v-for="player in playerManager.connectedPlayers.value"
    :id="player"
  />
</template>

<script setup lang="ts">
import { createHost } from "../lib/peer";
import PlayerCursor from "../components/PlayerCursor.vue";
import { providePlayers } from "../context/players";

const playerManager = providePlayers();

const host = createHost();
const { roomId } = host;

host.on("connect", (id) => playerManager.addPlayer(id));
host.on("disconnect", (id) => playerManager.removePlayer(id));

playerManager.host.value = host;

setInterval(() => {
  host.sendAll("ping", new Date().getTime());
}, 1000);
</script>
