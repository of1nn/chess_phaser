import Figure from "./base_figure";
import { SQUARE_SIZE } from "../constants";

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

export default Queen;