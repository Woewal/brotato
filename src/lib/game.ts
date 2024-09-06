import * as Phaser from "phaser";
class MainScene extends Phaser.Scene {}

const useGame = ({ element }: { element: HTMLElement }) => {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: element,
    scene: MainScene,
  };

  const game = new Phaser.Game(config);
  return game;
};

export default useGame;
