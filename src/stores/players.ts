import { createStore } from "solid-js/store";
import createPlayerManager from "../lib/playerManager";

const [playerStore, setPlayerStore] = createStore<
  ReturnType<typeof createPlayerManager> | undefined
>(undefined);

export { playerStore, setPlayerStore };
