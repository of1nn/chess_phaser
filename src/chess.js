import Phaser from "phaser";
import { BOARD_SIZE } from "./constants";
const SQUARE_SIZE = 94;
const PADDING = 24;


class Figure extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, color, type) {
    super(scene, x, y, `${color}${type}`);
    this.scene = scene; // Сохраняем ссылку на сцену
    this.color = color;
    this.type = type;
    this.setOrigin(0.5, 0.5).setInteractive().setScale(0.15);
    scene.add.existing(this);
    this.hasMoved = false;
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

class King extends Figure {
  constructor(scene, x, y, color) {
    super(scene, x, y, color, "King");
    this.setScale(0.035);
    this.hasMoved = false;
  }

  isMoveValid(targetSquare) {
    const dx = Math.abs(targetSquare.x - this.x);
    const dy = Math.abs(targetSquare.y - this.y);

    // Если это обычный ход короля (на одну клетку в любом направлении)
    const isOneSquareMove =
      dx <= SQUARE_SIZE && dy <= SQUARE_SIZE && !(dx === 0 && dy === 0);

    // Если это рокировка
    if (this.isCastlingMove(targetSquare)) {
      return this.canCastle(targetSquare);
    }

    // Возвращаем True для обычных ходов короля (одна клетка)
    return (
      isOneSquareMove &&
      (this.isSquareEmpty(targetSquare) ||
        this.getFigureAtCoordinates(targetSquare.x, targetSquare.y).color !==
          this.color)
    );
  }

  isCastlingMove(targetSquare) {
    const dx = Math.abs(targetSquare.x - this.x);
    return (
      dx === 2 * SQUARE_SIZE &&
      targetSquare.y === this.y &&
      this.type === "King" &&
      !this.hasMoved
    );
  }

  canCastle(targetSquare) {
    const direction = targetSquare.x > this.x ? 1 : -1; // Направление движения
    const rook =
      direction > 0
        ? this.findRook(this.x + 3 * SQUARE_SIZE, this.y)
        : this.findRook(this.x - 4 * SQUARE_SIZE, this.y);

    if (!rook || rook.hasMoved) return false; // Ладья не найдена или уже двигалась

    // Проверяем, что между королём и ладьёй нет других фигур
    const betweenSquares = this.getBetweenSquares(this.x, rook.x, this.y);
    for (const square of betweenSquares) {
      if (!this.isSquareEmpty(square)) return false;
    }

    // Проверяем безопасность рокировки
    if (!this.isCastlingSafe(targetSquare)) {
      return false;
    }

    return true;
  }

  performCastling(targetSquare) {
    const direction = targetSquare.x > this.x ? 1 : -1;
    const rook =
      direction > 0
        ? this.findRook(this.x + 3 * SQUARE_SIZE, this.y)
        : this.findRook(this.x - 4 * SQUARE_SIZE, this.y);

    if (rook && !rook.hasMoved) {
      // Перемещаем короля
      this.moveTo(targetSquare.x, targetSquare.y);

      // Перемещаем ладью
      const rookTargetX =
        direction > 0
          ? targetSquare.x - SQUARE_SIZE
          : targetSquare.x + SQUARE_SIZE;
      rook.moveTo(rookTargetX, this.y);

      // Обновляем состояние рокировки
      this.hasMoved = true;
      rook.hasMoved = true;
    } else {
      console.log("Cannot castle with this rook.");
    }
  }

  findRook(x, y) {
    const rook = this.getFigureAtCoordinates(x, y);

    console.log(rook, x, y);
    return rook instanceof Rook ? rook : null;
  }

  getBetweenSquares(startX, endX, y) {
    const step = endX > startX ? SQUARE_SIZE : -SQUARE_SIZE;
    const squares = [];
    for (let x = startX + step; x !== endX; x += step) {
      squares.push({ x, y });
    }
    return squares;
  }
  isCastlingSafe(targetSquare) {
    if (!this.isCastlingMove(targetSquare)) {
      return false; // Если это не рокировка, возвращаем false
    }

    const direction = targetSquare.x > this.x ? 1 : -1; // Направление движения
    const kingStartX = this.x;
    const kingEndX = targetSquare.x;

    // Проверяем каждую клетку, через которую проходит король
    for (
      let x = kingStartX;
      x !== kingEndX + direction * SQUARE_SIZE;
      x += direction * SQUARE_SIZE
    ) {
      this.moveTo(x, this.y); // Перемещаем короля временно

      if (this.scene.isKingInCheck(this.color)) {
        this.moveTo(kingStartX, this.y); // Возвращаем короля на начальную позицию
        this.hasMoved = false;
        return false;
      }
    }

    this.moveTo(kingStartX, this.y); // Возвращаем короля на начальную позицию
    this.hasMoved = false;
    return true;
  }
}

class Pawn extends Figure {
  constructor(scene, x, y, color) {
    super(scene, x, y, color, "Pawn");
    this.start_x = x;
    this.start_y = y;
  }

  isMoveValid(targetSquare) {
    const direction = this.color === "white" ? -1 : 1; // Direction of pawn movement

    const validMoves = {
      oneSquareForward:
        targetSquare.y === this.y + direction * SQUARE_SIZE &&
        targetSquare.x === this.x &&
        this.isSquareEmpty(targetSquare),
      twoSquaresForward:
        this.start_x === this.x &&
        this.start_y === this.y &&
        targetSquare.y === this.y + direction * 2 * SQUARE_SIZE &&
        targetSquare.x === this.x &&
        this.isSquareEmpty({
          x: this.x,
          y: this.y + direction * SQUARE_SIZE,
        }) &&
        this.isSquareEmpty(targetSquare),
      captureDiagonal:
        targetSquare.y === this.y + direction * SQUARE_SIZE &&
        Math.abs(targetSquare.x - this.x) === SQUARE_SIZE &&
        !this.isSquareEmpty(targetSquare) &&
        this.getFigureAtCoordinates(targetSquare.x, targetSquare.y).color !==
          this.color,
    };

    return (
      validMoves.oneSquareForward ||
      validMoves.twoSquaresForward ||
      validMoves.captureDiagonal
    );
  }
  getPossibleMoves(gameState) {
    const moves = [];
    const direction = this.color === "white" ? -1 : 1; // Determine direction based on color
    const targetSquareOneForward = {
      x: this.x,
      y: this.y + direction * SQUARE_SIZE,
    };
    const targetSquareTwoForward = {
      x: this.x,
      y: this.y + direction * 2 * SQUARE_SIZE,
    };
    const targetSquareCaptureLeft = {
      x: this.x - SQUARE_SIZE,
      y: this.y + direction * SQUARE_SIZE,
    };
    const targetSquareCaptureRight = {
      x: this.x + SQUARE_SIZE,
      y: this.y + direction * SQUARE_SIZE,
    };

    // Check one square forward
    if (this.isMoveValid(targetSquareOneForward)) {
      moves.push({self, targetSquareOneForward});
    }

    // Check two squares forward from the starting position
    if (this.start_x === this.x && this.start_y === this.y) {
      if (this.isMoveValid(targetSquareTwoForward)) {
        moves.push({ self, targetSquareTwoForward});
      }
    }

    // Check for captures
    if (this.isMoveValid(targetSquareCaptureLeft)) {
      moves.push({self, targetSquareCaptureLeft});
    }
    if (this.isMoveValid(targetSquareCaptureRight)) {
      moves.push({self, targetSquareCaptureRight});
    }

    return moves;
  }
}

class Rook extends Figure {
  constructor(scene, x, y, color) {
    super(scene, x, y, color, "Rook");
  }

  isMoveValid(targetSquare) {
    const isStraightMove =
      (targetSquare.x === this.x && targetSquare.y !== this.y) ||
      (targetSquare.y === this.y && targetSquare.x !== this.x);

    if (!isStraightMove) return false; // Check if the move is straight

    const directionX = Math.sign(targetSquare.x - this.x);
    const directionY = Math.sign(targetSquare.y - this.y);

    let currentX = this.x + directionX * SQUARE_SIZE;
    let currentY = this.y + directionY * SQUARE_SIZE;

    while (currentX !== targetSquare.x || currentY !== targetSquare.y) {
      if (!this.isSquareEmpty({ x: currentX, y: currentY })) {
        return false; // If any square in the path is occupied, the move is invalid
      }
      currentX += directionX * SQUARE_SIZE;
      currentY += directionY * SQUARE_SIZE;
    }

    const targetPiece = this.getFigureAtCoordinates(
      targetSquare.x,
      targetSquare.y
    );
    return !targetPiece || targetPiece.color !== this.color; // Target square must be empty or occupied by the opponent
  }
  getPossibleMoves(gameState) {
    const moves = [];
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    for (const direction of directions) {
      for (let step = 1; step < 8; step++) {
        const targetSquare = gameState.getSquareFromCoordinates(
          this.x + direction.x * step * SQUARE_SIZE,
          this.y + direction.y * step * SQUARE_SIZE
        );
        if (!targetSquare) break; // Out of bounds
        if (targetSquare.piece) {
          if (targetSquare.piece.color !== this.color) {
            moves.push({ self, targetSquare }); // Capture
          }
          break; // Blocked by own piece
        }
        moves.push({self, targetSquare}); // Empty square
      }
    }

    return moves;
  }
}

class Knight extends Figure {
  constructor(scene, x, y, color) {
    super(scene, x, y, color, "Knight");
    this.setScale(0.07);
  }

  isMoveValid(targetSquare) {
    const dx = Math.abs(targetSquare.x - this.x);
    const dy = Math.abs(targetSquare.y - this.y);

    const isLShape =
      (dx === SQUARE_SIZE * 2 && dy === SQUARE_SIZE) ||
      (dx === SQUARE_SIZE && dy === SQUARE_SIZE * 2);

    if (!isLShape) return false;

    const targetPiece = this.getFigureAtCoordinates(
      targetSquare.x,
      targetSquare.y
    );
    return !targetPiece || targetPiece.color !== this.color;
  }
  getPossibleMoves(gameState) {
    const moves = [];
    const knightMoves = [
      { x: 2, y: 1 },
      { x: 2, y: -1 },
      { x: -2, y: 1 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
      { x: 1, y: -2 },
      { x: -1, y: 2 },
      { x: -1, y: -2 },
    ];

    for (const move of knightMoves) {
      const targetSquare = gameState.getSquareFromCoordinates(
        this.x + move.x * SQUARE_SIZE,
        this.y + move.y * SQUARE_SIZE
      );
      if (targetSquare) {
        if (!targetSquare.piece || targetSquare.piece.color !== this.color) {
          moves.push({ self, targetSquare });
        }
      }
    }

    return moves;
  }
}

class Bishop extends Figure {
  constructor(scene, x, y, color) {
    super(scene, x, y, color, "Bishop");
  }

  isMoveValid(targetSquare) {
    const dx = Math.abs(targetSquare.x - this.x);
    const dy = Math.abs(targetSquare.y - this.y);

    if (dx !== dy) return false;

    const directionX = Math.sign(targetSquare.x - this.x);
    const directionY = Math.sign(targetSquare.y - this.y);

    let currentX = this.x + directionX * SQUARE_SIZE;
    let currentY = this.y + directionY * SQUARE_SIZE;

    while (currentX !== targetSquare.x || currentY !== targetSquare.y) {
      if (!this.isSquareEmpty({ x: currentX, y: currentY })) {
        return false;
      }
      currentX += directionX * SQUARE_SIZE;
      currentY += directionY * SQUARE_SIZE;
    }

    const targetPiece = this.getFigureAtCoordinates(
      targetSquare.x,
      targetSquare.y
    );
    return !targetPiece || targetPiece.color !== this.color;
  }
  getPossibleMoves(gameState) {
    const moves = [];
    const directions = [
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 },
    ];

    for (const direction of directions) {
      for (let step = 1; step < 8; step++) {
        const targetSquare = gameState.getSquareFromCoordinates(
          this.x + direction.x * step * SQUARE_SIZE,
          this.y + direction.y * step * SQUARE_SIZE
        );
        if (!targetSquare) break; // Out of bounds
        if (targetSquare.piece) {
          if (targetSquare.piece.color !== this.color) {
            moves.push({ self, targetSquare }); // Capture
          }
          break; // Blocked by own piece
        }
        moves.push({ self, targetSquare }); // Empty square
      }
    }

    return moves;
  }
}

class Queen extends Figure {
  constructor(scene, x, y, color) {
    super(scene, x, y, color, "Queen");
  }

  isMoveValid(targetSquare) {
    const dx = targetSquare.x - this.x;
    const dy = targetSquare.y - this.y;

    // Check if the move is vertical, horizontal, or diagonal
    const isVertical = dx === 0 && dy !== 0;
    const isHorizontal = dy === 0 && dx !== 0;
    const isDiagonal = Math.abs(dx) === Math.abs(dy);

    // The move must be in one of these directions
    if (!(isVertical || isHorizontal || isDiagonal)) {
      return false; // Invalid move
    }

    // Determine the step direction for iteration
    const stepX = dx === 0 ? 0 : dx > 0 ? SQUARE_SIZE : -SQUARE_SIZE; // Step in X direction
    const stepY = dy === 0 ? 0 : dy > 0 ? SQUARE_SIZE : -SQUARE_SIZE; // Step in Y direction

    // Check all squares between the current position and the target square
    let x = this.x + stepX;
    let y = this.y + stepY;

    while (x !== targetSquare.x || y !== targetSquare.y) {
      if (!this.isSquareEmpty({ x, y })) {
        return false; // A piece is blocking the path
      }
      x += stepX;
      y += stepY;
    }

    // Check if the target square is occupied by the same color
    const targetPiece = this.getFigureAtCoordinates(
      targetSquare.x,
      targetSquare.y
    );
    return !targetPiece || targetPiece.color !== this.color; // Can capture if it's an enemy piece
  }
  getPossibleMoves(gameState) {
    const moves = [];
    const kingMoves = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 },
    ];

    for (const move of kingMoves) {
      const targetSquare = gameState.getSquareFromCoordinates(
        this.x + move.x * SQUARE_SIZE,
        this.y + move.y * SQUARE_SIZE
      );
      if (targetSquare) {
        if (!targetSquare.piece || targetSquare.piece.color !== this.color) {
          moves.push({ self, targetSquare });
        }
      }
    }

    return moves;
  }
}

class Chess extends Phaser.Scene {
  constructor() {
    super({ key: "Chess" });
    this.selectedFigure = null;
    this.pieces = [];
    this.currentTurn = "white";
    this.pieceGrid = {};
    this.highlightGraphics = [];
    this.moveNumber = 1;
    this.moveHistory = [];
    this.promotionMenu = null;
  }

  preload() {
    const requireAssets = require.context(
      "./assets/",
      true,
      /\.(png|jpe?g|gif|svg)$/
    );
    requireAssets.keys().forEach((filePath) => {
      const fileName = filePath.split("/").pop();
      const key = fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-](.)/g, (_, char) => char.toUpperCase());
      this.load.image(key, `assets/${fileName}`);
    });
  }

  create() {
    this.add
      .image(400, 400, "chessboard")
      .setScale(800 / this.add.image(400, 400, "chessboard").width);
    this.createPieces();
    this.input.on("pointerdown", this.onClick.bind(this));
    this.rightMenuContainer = this.add.container(800, 0); // Position at (550, 0)
    this.rightMenu = this.add
      .rectangle(0, 0, 250, 800, 0x333333)
      .setOrigin(0, 0); // Set origin to top-left

    // Move history text
    this.moveHistoryText = this.add.text(10, 10, "Move History:\n", {
      fontSize: "14px",
      fill: "#fff",
    }); // Set origin to top-left
    this.rightMenuContainer.add(this.rightMenu);
    this.rightMenuContainer.add(this.moveHistoryText);
  }

  createPieces() {
    const colors = ["white", "black"];
    const pawnsRow = [6, 1];
    const majorPiecesRow = [7, 0];

    colors.forEach((color, colorIndex) => {
      const pawnY = pawnsRow[colorIndex];
      for (let i = 0; i < 8; i++) {
        this.createPiece(
          Pawn,
          color,
          PADDING + i * SQUARE_SIZE + SQUARE_SIZE / 2,
          PADDING + pawnY * SQUARE_SIZE + SQUARE_SIZE / 2
        );
      }

      const majorY = majorPiecesRow[colorIndex];
      this.createMajorPieces(color, majorY);
    });
  }

  createMajorPieces(color, majorY) {
    const pieceTypes = [
      Rook,
      Knight,
      Bishop,
      Queen,
      King,
      Bishop,
      Knight,
      Rook,
    ];
    pieceTypes.forEach((PieceClass, index) => {
      this.createPiece(
        PieceClass,
        color,
        PADDING + index * SQUARE_SIZE + SQUARE_SIZE / 2,
        PADDING + majorY * SQUARE_SIZE + SQUARE_SIZE / 2
      );
    });
  }

  createPiece(PieceClass, color, x, y) {
    const piece = new PieceClass(this, x, y, color);
    this.pieces.push(piece);
    this.pieceGrid[piece.getKeyFromCoordinates(x, y)] = piece;

    if (piece instanceof King) {
      this[color === "white" ? "whiteKing" : "blackKing"] = piece;
    }
  }

  getFigureAtCoordinates(x, y) {
    return this.pieceGrid[this.getKeyFromCoordinates(x, y)] || null;
  }

  getSquareFromCoordinates(x, y) {
    return this.adjustCoordinates(x, y);
  }

  getKeyFromCoordinates(x, y) {
    const adjustedSquare = this.adjustCoordinates(x, y);
    return `${adjustedSquare.x},${adjustedSquare.y}`;
  }

  adjustCoordinates(x, y) {
    const adjustedX = x - PADDING;
    const adjustedY = y - PADDING;
    return {
      x:
        Math.floor(adjustedX / SQUARE_SIZE) * SQUARE_SIZE +
        SQUARE_SIZE / 2 +
        PADDING,
      y:
        Math.floor(adjustedY / SQUARE_SIZE) * SQUARE_SIZE +
        SQUARE_SIZE / 2 +
        PADDING,
    };
  }

  isSquareEmpty(targetSquare) {
    const key = this.getKeyFromCoordinates(targetSquare.x, targetSquare.y);
    return !this.pieceGrid[key];
  }

  removeFigure(figure) {
    const index = this.pieces.indexOf(figure);
    if (index !== -1) {
      this.pieces.splice(index, 1);
      figure.destroy();
    }
  }

  switchTurn() {
    this.currentTurn = this.currentTurn === "white" ? "black" : "white";
    if (this.checkGameState()) {
      this.restartGame();
    }
  }

  highlightValidMoves(figure) {
    this.clearHighlights();
    const graphics = this.add.graphics({
      fillStyle: { color: 0x00ff00, alpha: 0.5 },
    });

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const targetSquare = this.getSquareFromCoordinates(
          x * SQUARE_SIZE + PADDING,
          y * SQUARE_SIZE + PADDING
        );

        if (
          figure.isMoveValid(targetSquare) &&
          this.isMoveSafe(figure, targetSquare)
        ) {
          graphics.fillRect(
            targetSquare.x - SQUARE_SIZE / 2,
            targetSquare.y - SQUARE_SIZE / 2,
            SQUARE_SIZE,
            SQUARE_SIZE
          );
        }
      }
    }
    this.highlightGraphics.push(graphics);
  }

  clearHighlights() {
    this.highlightGraphics.forEach((highlight) => highlight.destroy());
    this.highlightGraphics = [];
  }

  onClick(pointer) {
    const targetSquare = this.getSquareFromCoordinates(pointer.x, pointer.y);
    const clickedFigure = this.getFigureAtCoordinates(
      targetSquare.x,
      targetSquare.y
    );

    if (!this.selectedFigure) {
      this.selectFigure(clickedFigure, targetSquare);
    } else {
      this.handleMove(clickedFigure, targetSquare);
    }
  }

  selectFigure(clickedFigure, targetSquare) {
    // Проверяем, принадлежит ли кликнутая фигура текущему игроку
    if (clickedFigure && clickedFigure.color === this.currentTurn) {
      console.log(
        `Выбрана фигура: ${clickedFigure.type} на ${targetSquare.x}, ${targetSquare.y}`
      );
      this.selectedFigure = clickedFigure;
      this.highlightValidMoves(clickedFigure); // Подсвечиваем допустимые ходы
    }
  }

  handleMove(clickedFigure, targetSquare) {
    // Проверяем, кликнули ли на ту же фигуру
    if (this.selectedFigure === clickedFigure) {
      console.log("Снятие выделения с фигуры.");
      this.clearHighlights();
      this.selectedFigure = null; // Сбрасываем выбор
      return; // Выходим из метода
    }
    console.log(this.selectedFigure.isMoveValid(targetSquare));
    // Проверяем, может ли выбранная фигура сделать ход на целевую клетку
    if (this.selectedFigure.isMoveValid(targetSquare)) {
      this.executeMove(targetSquare);
      console.log("Ход выполнен.");
    } else {
      console.log("Этот ход недопустим.");
      this.clearHighlights();
      this.selectedFigure = null; // Снимаем выделение с фигуры
    }
  }

  executeMove(targetSquare) {
    const targetPiece = this.getFigureAtCoordinates(
      targetSquare.x,
      targetSquare.y
    );

    // Проверяем, допустим ли ход выбранной фигуры
    if (
      this.selectedFigure.isMoveValid(targetSquare) &&
      this.isMoveSafe(this.selectedFigure, targetSquare)
    ) {
      // Если это рокировка, выполняем её
      if (
        this.selectedFigure.type === "King" &&
        this.selectedFigure.isCastlingMove(targetSquare)
      ) {
        this.selectedFigure.performCastling(targetSquare);
      } else {
        // Иначе обычный ход
        this.selectedFigure.moveTo(targetSquare.x, targetSquare.y);
      }

      // Если это пешка, проверяем на возможность превращения в ферзя
      if (
        this.selectedFigure.type === "Pawn" &&
        this.isPawnPromotion(this.selectedFigure, targetSquare)
      ) {
        this.promotePawn(this.selectedFigure, targetSquare);
      }

      // Обновление истории ходов
      const moveNotation = this.getChessNotation(
        targetSquare.x,
        targetSquare.y
      );
      if (this.currentTurn === "white") {
        this.moveHistory.push(`${this.moveNumber}. ${moveNotation}`);
      } else {
        this.moveHistory[this.moveHistory.length - 1] += ` ${moveNotation}`;
        this.moveNumber++;
      }

      // Обновляем текст с историей ходов на экране
      this.moveHistoryText.setText(
        "Move History:\n" + this.moveHistory.join("\n")
      );

      // Переключаем ход
      this.switchTurn();
    } else {
      console.log("Этот ход недопустим.");
    }

    // Очищаем подсветку и сбрасываем выбранную фигуру
    this.clearHighlights();
    this.selectedFigure = null;
  }

  getChessNotation(x, y) {
    const col = Math.floor((x - PADDING) / SQUARE_SIZE);
    const row = 7 - Math.floor((y - PADDING) / SQUARE_SIZE);
    const file = String.fromCharCode(97 + col);
    const rank = row + 1;
    return file + rank;
  }

  isPawnPromotion(pawn, targetSquare) {
    if (pawn.type !== "Pawn") return false;
    const promotionRow = pawn.color === "white" ? 0 : 7;
    return (
      targetSquare.y === PADDING + promotionRow * SQUARE_SIZE + SQUARE_SIZE / 2
    );
  }

  promotePawn(pawn, targetSquare) {
    // Показываем меню выбора фигуры
    this.showPromotionMenu(pawn, targetSquare);
  }

  update() {}

  isKingInCheck(color) {
    const king = color === "white" ? this.whiteKing : this.blackKing;
    const kingSquare = { x: king.x, y: king.y };

    return this.pieces.some((piece) => {
      if (piece.color !== color) {
        return piece.isMoveValid(kingSquare);
      }
      return false;
    });
  }

  checkGameState() {
    const inCheck = this.isKingInCheck(this.currentTurn);
    const hasMoves = this.hasValidMoves(this.currentTurn);

    console.log(
      `inCheck: ${inCheck}, hasMoves: ${hasMoves}, move number: ${this.moveNumber}`
    );

    if (inCheck && !hasMoves) {
      console.log(`${this.currentTurn.toUpperCase()} is in checkmate!`);
      return true; // Игра завершена (мат)
    } else if (!hasMoves) {
      console.log("Stalemate! It's a draw.");
      return true; // Игра завершена (пат)
    }

    return false; // Игра продолжается
  }
  showPromotionMenu(pawn, targetSquare) {
    // Удаляем пешку из игры
    this.removeFigure(pawn);

    // Определяем позицию меню относительно пешки
    const menuWidth = 100; // Ширина меню
    const menuHeight = 240; // Высота меню (4 фигуры по 60px)
    const padding = 10; // Отступ между меню и пешкой

    let menuX = targetSquare.x;
    let menuY;

    // Если пешка находится ближе к нижней части доски
    if (targetSquare.y > PADDING + SQUARE_SIZE * 4) {
      menuY = targetSquare.y - menuHeight / 2 - SQUARE_SIZE / 2 - padding;
    } else {
      menuY = targetSquare.y + menuHeight / 2 + SQUARE_SIZE / 2 + padding;
    }

    // Создаем контейнер для меню выбора фигуры
    this.promotionMenu = this.add.container(menuX, menuY);

    // Создаем темный полупрозрачный фон для меню
    const background = this.add
      .rectangle(0, 0, menuWidth, menuHeight, 0x000000, 0.8) // Фон относительно центра контейнера
      .setOrigin(0.5)
      .setInteractive();

    this.promotionMenu.add(background);

    // Добавляем изображения фигур для выбора
    const pieceTypes = ["Queen", "Rook", "Bishop", "Knight"];
    const pieceImages = pieceTypes.map((type, index) => {
      const image = this.add
        .image(0, (index - 1.5) * 60, `${pawn.color}${type}`) // Расположение с интервалом 60px
        .setDisplaySize(50, 50)
        .setInteractive();

      // Обработчик клика на фигуру
      image.on("pointerdown", () => {
        this.handlePromotionChoice(type, pawn.color, targetSquare);
        this.promotionMenu.destroy(); // Удаляем меню после выбора
      });

      return image;
    });

    // Добавляем изображения в контейнер
    this.promotionMenu.add(pieceImages);
  }

  handlePromotionChoice(type, color, targetSquare) {
    // Создаем новую фигуру на основе выбора
    let newPiece;
    switch (type) {
      case "Queen":
        newPiece = new Queen(this, targetSquare.x, targetSquare.y, color);
        break;
      case "Rook":
        newPiece = new Rook(this, targetSquare.x, targetSquare.y, color);
        break;
      case "Bishop":
        newPiece = new Bishop(this, targetSquare.x, targetSquare.y, color);
        break;
      case "Knight":
        newPiece = new Knight(this, targetSquare.x, targetSquare.y, color);
        break;
    }

    // Добавляем новую фигуру в игру
    this.pieces.push(newPiece);
    this.pieceGrid[newPiece.getKeyFromCoordinates(newPiece.x, newPiece.y)] =
      newPiece;

    // Обновляем историю ходов
    const moveNotation = this.getChessNotation(targetSquare.x, targetSquare.y);
    if (this.currentTurn === "white") {
      this.moveHistory.push(`${this.moveNumber}. ${moveNotation}`);
    } else {
      this.moveHistory[this.moveHistory.length - 1] += ` ${moveNotation}`;
      this.moveNumber++;
    }

    // Обновляем текст с историей ходов на экране
    this.moveHistoryText.setText(
      "Move History:\n" + this.moveHistory.join("\n")
    );
  }

  restartGame() {
    // Clear the existing pieces
    this.pieces.forEach((piece) => piece.destroy());
    this.pieces = [];
    this.pieceGrid = {};
    this.selectedFigure = null;
    this.highlightGraphics.forEach((highlight) => highlight.destroy());
    this.highlightGraphics = [];
    this.moveHistory = [];
    this.moveNumber = 0;
    // Recreate the chess pieces
    this.createPieces();
    this.currentTurn = "white"; // Reset to white's turn
    console.log("Game has been reset.");
  }

  isMoveSafe(piece, targetSquare) {
    const originalPosition = { x: piece.x, y: piece.y };
    const targetPiece = this.getFigureAtCoordinates(
      targetSquare.x,
      targetSquare.y
    );
    let capMoved = null;
    let capturedPiece = null;
    let originMoved = piece.hasMoved;

    // Если на целевой клетке есть фигура, временно перемещаем её
    if (targetPiece) {
      capturedPiece = targetPiece;
      capMoved = capturedPiece.hasMoved;
      capturedPiece.moveTo(10000, 10000); // Убираем фигуру с доски
    }

    // Если это рокировка, выполняем специальную проверку
    if (
      piece.type === "King" &&
      Math.abs(targetSquare.x - piece.x) === 2 * SQUARE_SIZE
    ) {
      return piece.isCastlingSafe(targetSquare);
    }

    // Перемещаем фигуру на целевую клетку
    piece.moveTo(targetSquare.x, targetSquare.y);
    const isSafe = !this.isKingInCheck(piece.color);

    // Возвращаем фигуру на исходную позицию
    piece.moveTo(originalPosition.x, originalPosition.y);
    piece.hasMoved = originMoved;

    // Возвращаем захваченную фигуру на место
    if (capturedPiece) {
      capturedPiece.moveTo(targetSquare.x, targetSquare.y);
      capturedPiece.hasMoved = capMoved;
    }

    return isSafe;
  }

  hasValidMoves(playerColor) {
    for (let piece of this.pieces) {
      if (piece.color === playerColor) {
        for (let x = 0; x < 8; x++) {
          for (let y = 0; y < 8; y++) {
            const targetSquare = this.getSquareFromCoordinates(
              x * SQUARE_SIZE + PADDING,
              y * SQUARE_SIZE + PADDING
            );
            const targetPiece = this.getFigureAtCoordinates(
              targetSquare.x,
              targetSquare.y
            );

            if (
              (targetPiece === null || targetPiece.color !== playerColor) &&
              piece.isMoveValid(targetSquare) &&
              this.isMoveSafe(piece, targetSquare)
            ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

}

export default Chess;
