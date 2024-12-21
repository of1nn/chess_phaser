import Figure from "./base_figure";
import { SQUARE_SIZE } from "../constants";

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


export default Bishop;