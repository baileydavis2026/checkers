// Checkers AI using Minimax with Alpha-Beta Pruning

const DIFFICULTY = {
  EASY: { depth: 1, randomness: 0.4 },
  MEDIUM: { depth: 3, randomness: 0.15 },
  HARD: { depth: 5, randomness: 0 }
};

// Piece values for evaluation
const PIECE_VALUE = 100;
const KING_VALUE = 180;
const CENTER_BONUS = 10;
const ADVANCE_BONUS = 5;
const BACK_ROW_BONUS = 15;

// Evaluate board position from perspective of given player
function evaluateBoard(board, player) {
  let score = 0;
  const opponent = player === 'red' ? 'black' : 'red';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      const isOwn = piece.color === player;
      const multiplier = isOwn ? 1 : -1;
      
      // Base piece value
      let pieceScore = piece.isKing ? KING_VALUE : PIECE_VALUE;
      
      // Position bonuses for non-kings
      if (!piece.isKing) {
        // Advance bonus (closer to promotion)
        if (piece.color === 'red') {
          pieceScore += (7 - row) * ADVANCE_BONUS;
        } else {
          pieceScore += row * ADVANCE_BONUS;
        }
        
        // Back row protection bonus
        if ((piece.color === 'red' && row === 7) || (piece.color === 'black' && row === 0)) {
          pieceScore += BACK_ROW_BONUS;
        }
      }
      
      // Center control bonus
      if (col >= 2 && col <= 5 && row >= 2 && row <= 5) {
        pieceScore += CENTER_BONUS;
      }
      
      score += pieceScore * multiplier;
    }
  }
  
  return score;
}

// Deep clone the board
function cloneBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

// Get all valid moves for a player
function getAllMoves(board, player, getValidMovesForPiece, hasCaptures) {
  const moves = [];
  const mustCapture = hasCaptures(board, player);
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === player) {
        const validMoves = getValidMovesForPiece(board, row, col, mustCapture);
        validMoves.forEach(move => {
          moves.push({
            from: { row, col },
            to: move,
            isCapture: Math.abs(move.row - row) === 2
          });
        });
      }
    }
  }
  
  return moves;
}

// Apply a move to the board (returns new board)
function applyMove(board, move) {
  const newBoard = cloneBoard(board);
  const piece = { ...newBoard[move.from.row][move.from.col] };
  
  // Move piece
  newBoard[move.from.row][move.from.col] = null;
  newBoard[move.to.row][move.to.col] = piece;
  
  // Handle capture
  if (move.isCapture) {
    const capturedRow = (move.from.row + move.to.row) / 2;
    const capturedCol = (move.from.col + move.to.col) / 2;
    newBoard[capturedRow][capturedCol] = null;
  }
  
  // Handle king promotion
  if (piece.color === 'red' && move.to.row === 0) {
    newBoard[move.to.row][move.to.col].isKing = true;
  } else if (piece.color === 'black' && move.to.row === 7) {
    newBoard[move.to.row][move.to.col].isKing = true;
  }
  
  return newBoard;
}

// Check for additional captures after a jump
function getAdditionalCaptures(board, row, col, getValidMovesForPiece) {
  const captures = getValidMovesForPiece(board, row, col, true);
  return captures.filter(move => Math.abs(move.row - row) === 2);
}

// Minimax with alpha-beta pruning
function minimax(board, depth, alpha, beta, isMaximizing, player, getValidMovesForPiece, hasCaptures) {
  const opponent = player === 'red' ? 'black' : 'red';
  
  // Terminal conditions
  if (depth === 0) {
    return { score: evaluateBoard(board, player) };
  }
  
  const currentPlayer = isMaximizing ? player : opponent;
  const moves = getAllMoves(board, currentPlayer, getValidMovesForPiece, hasCaptures);
  
  if (moves.length === 0) {
    // No moves = loss for current player
    return { score: isMaximizing ? -10000 : 10000 };
  }
  
  let bestMove = null;
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    
    for (const move of moves) {
      let newBoard = applyMove(board, move);
      
      // Handle multi-jumps
      if (move.isCapture) {
        let additionalCaptures = getAdditionalCaptures(newBoard, move.to.row, move.to.col, getValidMovesForPiece);
        while (additionalCaptures.length > 0) {
          // For AI, pick the first additional capture (could be smarter)
          const nextCapture = additionalCaptures[0];
          const chainMove = {
            from: move.to,
            to: nextCapture,
            isCapture: true
          };
          newBoard = applyMove(newBoard, chainMove);
          move.to = nextCapture; // Update final position
          additionalCaptures = getAdditionalCaptures(newBoard, nextCapture.row, nextCapture.col, getValidMovesForPiece);
        }
      }
      
      const result = minimax(newBoard, depth - 1, alpha, beta, false, player, getValidMovesForPiece, hasCaptures);
      
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break; // Pruning
    }
    
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    
    for (const move of moves) {
      let newBoard = applyMove(board, move);
      
      // Handle multi-jumps
      if (move.isCapture) {
        let additionalCaptures = getAdditionalCaptures(newBoard, move.to.row, move.to.col, getValidMovesForPiece);
        while (additionalCaptures.length > 0) {
          const nextCapture = additionalCaptures[0];
          const chainMove = {
            from: move.to,
            to: nextCapture,
            isCapture: true
          };
          newBoard = applyMove(newBoard, chainMove);
          move.to = nextCapture;
          additionalCaptures = getAdditionalCaptures(newBoard, nextCapture.row, nextCapture.col, getValidMovesForPiece);
        }
      }
      
      const result = minimax(newBoard, depth - 1, alpha, beta, true, player, getValidMovesForPiece, hasCaptures);
      
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break; // Pruning
    }
    
    return { score: minScore, move: bestMove };
  }
}

// Main AI function
export function getBestMove(board, player, difficulty, getValidMovesForPiece, hasCaptures) {
  const config = DIFFICULTY[difficulty] || DIFFICULTY.MEDIUM;
  
  const moves = getAllMoves(board, player, getValidMovesForPiece, hasCaptures);
  
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];
  
  // Add randomness for lower difficulties
  if (Math.random() < config.randomness) {
    return moves[Math.floor(Math.random() * moves.length)];
  }
  
  const result = minimax(
    board,
    config.depth,
    -Infinity,
    Infinity,
    true,
    player,
    getValidMovesForPiece,
    hasCaptures
  );
  
  return result.move || moves[0];
}

export { DIFFICULTY };
