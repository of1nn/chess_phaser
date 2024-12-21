import Figure from "./base_figure";
import { SQUARE_SIZE } from "../constants";

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

export default Knight;