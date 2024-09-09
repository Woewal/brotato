<template>
  <div ref="game-parent"></div>
  <PlayerCursor
    v-for="player in playerManager.connectedPlayers.value"
    :id="player"
  />
  <slot></slot>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import { injectPlayers } from "../context/players";
import { provideGame } from "../context/game";
import PlayerCursor from "./PlayerCursor.vue";

const playerManager = injectPlayers();

const gameParent = useTemplateRef("game-parent");

provideGame({ element: gameParent });
</script>
