<template>
  <div ref="game-parent"></div>
  <PlayerCursor
    v-if="loaded"
    v-for="player in playerManager.connectedPlayers.value"
    :key="player"
    :id="player"
  />
  <Enemy
    v-if="loaded"
    v-for="enemy in enemies"
    :key="enemy.id"
    :id="enemy.id"
    :x="enemy.x"
    :y="enemy.y"
    :radius="enemy.radius"
    :color="enemy.color"
  />
  <slot></slot>
  <div class="fixed bottom-3 left-3 bg-white p-3 rounded-sm">
    Join now <strong>{{ playerManager.host.value.roomId }}</strong
    >, {{ playerManager.connectedPlayers.value.size }} players connected
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import { injectPlayers } from "../context/connection";
import { provideGame } from "../context/game";
import { provideEnemies } from "../context/enemies";
import PlayerCursor from "./PlayerCursor.vue";
import Enemy from "./Enemy.vue";

const playerManager = injectPlayers();
const gameParent = useTemplateRef("game-parent");
const { loaded } = provideGame({ element: gameParent });
provideEnemies();

const enemies = [
  { id: "enemy-1", x: 280, y: 180, radius: 18, color: 0xff5555 },
  { id: "enemy-2", x: 500, y: 140, radius: 14, color: 0xff8844 },
  { id: "enemy-3", x: 650, y: 260, radius: 20, color: 0xff3333 },
  { id: "enemy-4", x: 420, y: 340, radius: 16, color: 0xff66cc },
];
</script>
