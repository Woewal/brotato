import { ref } from "vue";
import defineContext from "../lib/context";
import { createHost } from "../lib/peer";

const [injectPlayers, providePlayers] = defineContext(() => {
  const connectedPlayers = ref<Set<string>>(new Set());

  const host = ref<ReturnType<typeof createHost>>();

  const addPlayer = (id: string) => {
    connectedPlayers.value.add(id);
  };

  const removePlayer = (id: string) => {
    connectedPlayers.value.delete(id);
  };

  return { connectedPlayers, addPlayer, removePlayer, host };
});

export { injectPlayers, providePlayers };
