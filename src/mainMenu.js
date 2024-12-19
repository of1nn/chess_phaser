import Phaser from "phaser";
import "./constants";

class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: "MainMenu" });
  }
  create() {
    this.add
      .text(525, 300, "Chess Game", { fontSize: "32px", fill: "#fff" })
      .setOrigin(0.5);
    this.startButton = this.add
      .rectangle(525, 400, 200, 50, 0x666666)
      .setOrigin(0.5);
    this.startText = this.add
      .text(525, 400, "Start Game", { fontSize: "24px", fill: "#fff" })
      .setOrigin(0.5);
    this.startButton.setInteractive();

    this.startButton.on("pointerover", () => {
      this.startButton.setFillStyle(0x555555);
    });

    this.startButton.on("pointerout", () => {
      this.startButton.setFillStyle(0x666666);
    });

    this.startButton.on("pointerdown", () => {
      this.startButton.setFillStyle(0x444444);
    });

    this.startButton.on("pointerup", () => {
      this.startButton.setFillStyle(0x555555);
      this.scene.start("Chess");
    });
  }
}

export default MainMenu;