import { onMounted, Ref } from "vue";
import defineContext from "../lib/context";
import * as Phaser from "phaser";

const [useGame, provideGame] = defineContext(
  (config: { element: Ref<HTMLDivElement> }) => {
    class MainScene extends Phaser.Scene {}

    let game: Phaser.Game;

    onMounted(() => {
      const gameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: config.element.value,
        scene: MainScene,
      };

      game = new Phaser.Game(gameConfig);
    });

    return { game, scene: game.scene.getScene("MainScene") };
  }
);

export { useGame, provideGame };
