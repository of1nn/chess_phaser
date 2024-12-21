import Phaser from "phaser";
import { SQUARE_SIZE, PADDING } from "./constants";
import Rook from "./figures/rook";
import Knight from "./figures/knight";
import Bishop from "./figures/bishop";
import Queen from "./figures/queen";
import King from "./figures/king";
import Pawn from "./figures/pawn";



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
    this.draggedFigure = null;
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
    this.input.on("pointerdown", this.onPointerDown.bind(this));
    this.input.on("pointermove", this.onPointerMove.bind(this));
    this.input.on("pointerup", this.onPointerUp.bind(this));
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
    piece.originalPosition = { x, y };
    this.pieces.push(piece);
    this.pieceGrid[piece.getKeyFromCoordinates(x, y)] = piece;

    if (piece instanceof King) {
      this[color === "white" ? "whiteKing" : "blackKing"] = piece;
    }
  }

  resetFigurePosition(figure) {
    const { x, y } = figure.originalPosition; // Берем сохраненные координаты
    figure.setPosition(x, y); // Возвращаем фигуру в исходное положение
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
      fillStyle: { color: 0x000000, alpha: 0.4 },
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
    if (this.selectedFigure) {
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
  onPointerDown(pointer) {
    const targetSquare = this.getSquareFromCoordinates(pointer.x, pointer.y);
    const clickedFigure = this.getFigureAtCoordinates(
      targetSquare.x,
      targetSquare.y
    );

    if (clickedFigure && clickedFigure.color === this.currentTurn) {
      this.draggedFigure = clickedFigure;
      this.startDragPosition = { x: clickedFigure.x, y: clickedFigure.y };
      this.highlightValidMoves(clickedFigure); // Подсвечиваем доступные клетки
    }
    if (this.selectedFigure) {
      this.handleMove(clickedFigure, targetSquare);
    }
  }

  onPointerMove(pointer) {
    if (this.draggedFigure) {
      this.draggedFigure.setPosition(pointer.x, pointer.y); // Следуем за курсором
    }
  }

  onPointerUp(pointer) {
    if (
      this.draggedFigure &&
      (this.draggedFigure.x !== this.startDragPosition.x ||
        this.draggedFigure.y !== this.startDragPosition.y)
    ) {
      this.selectedFigure = this.draggedFigure;
      const targetSquare = this.getSquareFromCoordinates(pointer.x, pointer.y);
      // Сохраняем текущие координаты фигуры
      const previousPosition = {
        x: this.draggedFigure.x,
        y: this.draggedFigure.y,
      };

      // Возвращаем фигуру на место для корректной проверки
      this.draggedFigure.setPosition(
        this.draggedFigure.originalPosition.x,
        this.draggedFigure.originalPosition.y
      );

      // Проверяем ход через handleMove
      const moveResult = this.handleMove(null, targetSquare);

      if (!moveResult) {
        // Если ход недопустим, возвращаем фигуру в исходное положение
        this.draggedFigure.setPosition(
          this.draggedFigure.originalPosition.x,
          this.draggedFigure.originalPosition.y
        );
      } else {
        // Если ход допустим, обновляем оригинальную позицию
        this.draggedFigure.originalPosition = {
          x: targetSquare.x,
          y: targetSquare.y,
        };
      }

      this.clearHighlights();
      this.draggedFigure = null;
    } else if (
      this.draggedFigure && !this.selectedFigure &&
      (this.draggedFigure.x === this.startDragPosition.x ||
        this.draggedFigure.y === this.startDragPosition.y)
    ) {
      this.selectedFigure = this.draggedFigure;
      this.draggedFigure = null;
    } else {
      // Если нет перетаскивания, сбрасываем выбранную фигуру
      this.draggedFigure = null;
      this.selectedFigure = null;
      this.clearHighlights();
    }
  }

  resetFigurePosition(figure) {
    const { x, y } = figure.originalPosition;
    figure.moveTo(x, y);
  }

  handleMove(clickedFigure, targetSquare) {
    // Проверяем, кликнули ли на ту же фигуру
    if (this.selectedFigure === clickedFigure) {
      console.log("Снятие выделения с фигуры.");
      this.clearHighlights();
      return false; // Выходим из метода
    }
    // Проверяем, может ли выбранная фигура сделать ход на целевую клетку
    if (this.selectedFigure.isMoveValid(targetSquare)) {
      this.executeMove(targetSquare);
      console.log("Ход выполнен.");
      return true
    } else {
      console.log("Этот ход недопустим.");
      return false
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
    this.moveHistoryText.setText("Move History:\n");
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
