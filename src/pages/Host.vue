<template>
  <!-- <div>
    Players connected: {{ playerManager.connectedPlayers.value.size }}, room id:
    {{ roomId }}
  </div> -->
  <Game />
</template>

<script setup lang="ts">
import { createHost } from "../lib/peer";
import { providePlayers } from "../context/connection";
import Game from "../components/Game.vue";

const playerManager = providePlayers();

const host = createHost();

host.on("connect", (id) => playerManager.addPlayer(id));
host.on("disconnect", (id) => playerManager.removePlayer(id));

playerManager.host.value = host;

setInterval(() => {
  host.sendAll("ping", new Date().getTime());
}, 1000);
</script>
