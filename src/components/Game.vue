<template>
  <div ref="game-parent"></div>
  <PlayerCursor
    v-if="loaded"
    v-for="player in playerManager.connectedPlayers.value"
    :id="player"
  />
  <slot></slot>
  <div class="fixed bottom-3 left-3 bg-white p-3 rounded-sm">
    Join now, {{ playerManager.connectedPlayers.value.size }} players connected
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import { injectPlayers } from "../context/players";
import { provideGame } from "../context/game";
import PlayerCursor from "./PlayerCursor.vue";

const playerManager = injectPlayers();

const gameParent = useTemplateRef("game-parent");

const { loaded } = provideGame({ element: gameParent });
</script>
