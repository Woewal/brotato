import * as Phaser from "phaser";
import { useGame } from "../context/game";
import { onMounted, onUnmounted } from "vue";

const useGameObject = <T extends Phaser.GameObjects.GameObject>(config: {
  factory: (
    factory: Phaser.GameObjects.GameObjectFactory,
    scene: Phaser.Scene
  ) => T;
  update?: (gameObject: T, delta: number) => void;
}) => {
  const gameManager = useGame();

  let gameObject: T;

  onMounted(() => {
    const scene = gameManager.scene.value;

    const gameObject = config.factory(scene.add, scene);

    scene.add.existing(gameObject);

    if (config.update) {
      scene.events.on("update", config.update);
    }
  });

  onUnmounted(() => {
    const scene = gameManager.scene.value;

    gameObject.destroy();

    if (config.update) {
      scene.events.off("update", config.update);
    }
  });
};

export default useGameObject;
