import { onMounted, ref, Ref } from "vue";
import defineContext from "../lib/context";
import * as Phaser from "phaser";

const [useGame, provideGame] = defineContext(
  (config: { element: Ref<HTMLDivElement> }) => {
    class MainScene extends Phaser.Scene {}

    let game = ref<Phaser.Game>();
    let scene = ref<Phaser.Scene>();

    const loaded = ref(false);

    onMounted(() => {
      const gameConfig: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: config.element.value,
        scene: MainScene,
        physics: { default: "arcade" },
      };

      const _game = new Phaser.Game(gameConfig);

      _game.events.once("ready", () => {
        const _scene = _game.scene.scenes[0];
        game.value = _game;
        scene.value = _scene;

        loaded.value = true;
      });
    });

    return { game, scene, loaded };
  }
);

export { useGame, provideGame };
