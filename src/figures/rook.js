import Figure from "./base_figure";
import { SQUARE_SIZE } from "../constants";

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
        moves.push({ self, targetSquare }); // Empty square
      }
    }

    return moves;
  }
}

export default Rook;