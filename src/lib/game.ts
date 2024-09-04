import Phaser = require("phaser");

class MainScene extends Phaser.Scene {}

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  parent: "phaser-example",
  scene: MainScene,
};

const game = new Phaser.Game(config);
