import Phaser, { UP } from "phaser";
import MainMenu from "./mainMenu";
import Chess from "./chess";
import "./style.css"; // Импортируйте стили
import { BOARD_SIZE } from "./constants";

const requireAssets = require.context(
  "./assets",
  true,
  /\.(png|jpe?g|gif|svg)$/
);

// Import all matched assets
const assets = requireAssets.keys().map(requireAssets);
export default assets;


const config = {
  width: BOARD_SIZE+250,
  height: BOARD_SIZE,
  scene: [MainMenu, Chess],
  physics: {
    default: "arcade",
    arcade: {
      gravity: 0,
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);
