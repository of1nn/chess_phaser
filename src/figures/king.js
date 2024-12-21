import Figure from "./base_figure.js";
import Rook from "./rook.js";
import { SQUARE_SIZE } from "../constants.js";


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

export default King;