<template>
  <slot></slot>
  <PlayerOrientation
    v-for="id in playerManager.connectedPlayers.value"
    :key="id"
    :id="id"
  />
  <div class="fixed bottom-3 left-3 bg-white p-3 rounded-sm">
    Join now <strong>{{ playerManager.host.value.roomId }}</strong
    >, {{ playerManager.connectedPlayers.value.size }} players connected
  </div>
</template>

<script setup lang="ts">
import { injectPlayers } from "../context/connection";
import PlayerOrientation from "./PlayerOrientation.vue";

const playerManager = injectPlayers();
</script>
