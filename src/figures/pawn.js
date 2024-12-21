import Figure from "./base_figure.js";
import { SQUARE_SIZE } from "../constants.js";

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
      moves.push({ self, targetSquareOneForward });
    }

    // Check two squares forward from the starting position
    if (this.start_x === this.x && this.start_y === this.y) {
      if (this.isMoveValid(targetSquareTwoForward)) {
        moves.push({ self, targetSquareTwoForward });
      }
    }

    // Check for captures
    if (this.isMoveValid(targetSquareCaptureLeft)) {
      moves.push({ self, targetSquareCaptureLeft });
    }
    if (this.isMoveValid(targetSquareCaptureRight)) {
      moves.push({ self, targetSquareCaptureRight });
    }

    return moves;
  }
}

export default Pawn;