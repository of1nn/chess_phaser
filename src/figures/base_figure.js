class Figure extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, color, type) {
    super(scene, x, y, `${color}${type}`);
    this.scene = scene; // Сохраняем ссылку на сцену
    this.color = color;
    this.type = type;
    this.setOrigin(0.5, 0.5).setInteractive().setScale(0.15);
    scene.add.existing(this);
    this.hasMoved = false;
    this.originalPosition = { x, y };
  }

  moveTo(x, y) {
    const oldKey = this.getKeyFromCoordinates(this.x, this.y);
    const targetKey = this.getKeyFromCoordinates(x, y);
    const targetPiece = this.getFigureAtCoordinates(x, y);

    // Обновляем позицию фигуры
    delete this.scene.pieceGrid[oldKey];
    this.scene.pieceGrid[targetKey] = this;
    this.setPosition(x, y);
    this.hasMoved = true;
    this.originalPosition = { x, y };
    // Если на целевой клетке есть фигура и она принадлежит сопернику, её нужно захватить
    if (targetPiece && targetPiece.color !== this.color) {
      this.capture(targetPiece);
    }
  }

  isMoveValid(targetSquare) {
    return false; // Default behavior, should be overridden by subclasses
  }

  isSquareEmpty(square) {
    return !this.getFigureAtCoordinates(square.x, square.y);
  }

  getFigureAtCoordinates(x, y) {
    return this.scene.getFigureAtCoordinates(x, y);
  }

  getKeyFromCoordinates(x, y) {
    return `${x},${y}`;
  }
  getValidMoves(grid) {
    // Базовая логика (должна быть переопределена в подклассах)
    return [];
  }

  capture(targetFigure) {
    if (targetFigure) {
      this.scene.removeFigure(targetFigure);
    }
  }
  isWithinBounds(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
  }
}

export default Figure;