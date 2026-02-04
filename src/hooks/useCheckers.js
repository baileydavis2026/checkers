import { useState, useCallback } from 'react';

// Constants
const EMPTY = null;
const RED = 'red';
const BLACK = 'black';
const RED_KING = 'red-king';
const BLACK_KING = 'black-king';

// Initialize the board with starting positions
const createInitialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(EMPTY));

  // Place black pieces (top of board, rows 0-2)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = BLACK;
      }
    }
  }

  // Place red pieces (bottom of board, rows 5-7)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = RED;
      }
    }
  }

  return board;
};

// Check if a piece belongs to a player
const belongsTo = (piece, player) => {
  if (!piece) return false;
  if (player === RED) return piece === RED || piece === RED_KING;
  if (player === BLACK) return piece === BLACK || piece === BLACK_KING;
  return false;
};

// Check if a piece is a king
const isKing = (piece) => piece === RED_KING || piece === BLACK_KING;

// Get the opponent
const getOpponent = (player) => (player === RED ? BLACK : RED);

// Check if a position is valid on the board
const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

// Get all possible moves for a piece (including jumps)
const getPossibleMoves = (board, row, col, player, mustJump = false) => {
  const piece = board[row][col];
  if (!piece || !belongsTo(piece, player)) return [];

  const moves = [];
  const jumps = [];
  const pieceIsKing = isKing(piece);

  // Determine movement directions
  const directions = [];
  if (player === RED || pieceIsKing) {
    directions.push([-1, -1], [-1, 1]); // Move up
  }
  if (player === BLACK || pieceIsKing) {
    directions.push([1, -1], [1, 1]); // Move down
  }

  // Check each direction
  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (isValidPosition(newRow, newCol)) {
      if (board[newRow][newCol] === EMPTY && !mustJump) {
        // Simple move
        moves.push({ toRow: newRow, toCol: newCol, isJump: false });
      } else if (belongsTo(board[newRow][newCol], getOpponent(player))) {
        // Potential jump
        const jumpRow = newRow + dRow;
        const jumpCol = newCol + dCol;
        if (isValidPosition(jumpRow, jumpCol) && board[jumpRow][jumpCol] === EMPTY) {
          jumps.push({
            toRow: jumpRow,
            toCol: jumpCol,
            isJump: true,
            capturedRow: newRow,
            capturedCol: newCol
          });
        }
      }
    }
  }

  // If there are jumps available, return only jumps (mandatory capture rule)
  return jumps.length > 0 ? jumps : moves;
};

// Check if any piece of a player has a jump available
const hasAnyJump = (board, player) => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (belongsTo(board[row][col], player)) {
        const moves = getPossibleMoves(board, row, col, player);
        if (moves.some(m => m.isJump)) return true;
      }
    }
  }
  return false;
};

// Get all valid moves for a player
const getAllValidMoves = (board, player) => {
  const allMoves = [];
  const mustJump = hasAnyJump(board, player);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (belongsTo(board[row][col], player)) {
        const moves = getPossibleMoves(board, row, col, player, mustJump);
        for (const move of moves) {
          if (!mustJump || move.isJump) {
            allMoves.push({ fromRow: row, fromCol: col, ...move });
          }
        }
      }
    }
  }

  return allMoves;
};

// Check for additional jumps after a jump
const getAdditionalJumps = (board, row, col, player) => {
  const piece = board[row][col];
  if (!piece) return [];

  const jumps = [];
  const pieceIsKing = isKing(piece);

  const directions = [];
  if (player === RED || pieceIsKing) {
    directions.push([-1, -1], [-1, 1]);
  }
  if (player === BLACK || pieceIsKing) {
    directions.push([1, -1], [1, 1]);
  }

  for (const [dRow, dCol] of directions) {
    const midRow = row + dRow;
    const midCol = col + dCol;
    const jumpRow = row + 2 * dRow;
    const jumpCol = col + 2 * dCol;

    if (
      isValidPosition(jumpRow, jumpCol) &&
      belongsTo(board[midRow][midCol], getOpponent(player)) &&
      board[jumpRow][jumpCol] === EMPTY
    ) {
      jumps.push({
        toRow: jumpRow,
        toCol: jumpCol,
        isJump: true,
        capturedRow: midRow,
        capturedCol: midCol
      });
    }
  }

  return jumps;
};

// Convert position to algebraic notation
const toNotation = (row, col) => {
  const colLetter = String.fromCharCode(97 + col); // a-h
  const rowNumber = 8 - row; // 1-8
  return `${colLetter}${rowNumber}`;
};

export const useCheckers = () => {
  const [board, setBoard] = useState(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState(RED);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'red-wins', 'black-wins', 'draw'
  const [jumpInProgress, setJumpInProgress] = useState(null);
  const [redPieces, setRedPieces] = useState(12);
  const [blackPieces, setBlackPieces] = useState(12);

  // Check for game end conditions
  const checkGameEnd = useCallback((newBoard, nextPlayer) => {
    const moves = getAllValidMoves(newBoard, nextPlayer);

    // Count pieces
    let red = 0, black = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (belongsTo(newBoard[row][col], RED)) red++;
        if (belongsTo(newBoard[row][col], BLACK)) black++;
      }
    }

    setRedPieces(red);
    setBlackPieces(black);

    if (red === 0) {
      setGameStatus('black-wins');
      return true;
    }
    if (black === 0) {
      setGameStatus('red-wins');
      return true;
    }
    if (moves.length === 0) {
      // Current player can't move - they lose
      setGameStatus(nextPlayer === RED ? 'black-wins' : 'red-wins');
      return true;
    }

    return false;
  }, []);

  // Handle piece selection
  const selectPiece = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;

    const piece = board[row][col];

    // If a jump is in progress, only allow selecting the jumping piece
    if (jumpInProgress) {
      if (row === jumpInProgress.row && col === jumpInProgress.col) {
        setSelectedPiece({ row, col });
        const additionalJumps = getAdditionalJumps(board, row, col, currentPlayer);
        setValidMoves(additionalJumps);
      }
      return;
    }

    // Check if clicking on own piece
    if (belongsTo(piece, currentPlayer)) {
      const mustJump = hasAnyJump(board, currentPlayer);
      const moves = getPossibleMoves(board, row, col, currentPlayer, mustJump);

      // Filter to only jumps if jumps are available
      const filteredMoves = mustJump ? moves.filter(m => m.isJump) : moves;

      if (filteredMoves.length > 0) {
        setSelectedPiece({ row, col });
        setValidMoves(filteredMoves);
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  }, [board, currentPlayer, gameStatus, jumpInProgress]);

  // Handle move execution
  const makeMove = useCallback((toRow, toCol) => {
    if (!selectedPiece || gameStatus !== 'playing') return;

    const move = validMoves.find(m => m.toRow === toRow && m.toCol === toCol);
    if (!move) return;

    const { row: fromRow, col: fromCol } = selectedPiece;
    const newBoard = board.map(r => [...r]);
    let piece = newBoard[fromRow][fromCol];

    // Move the piece
    newBoard[fromRow][fromCol] = EMPTY;

    // Check for king promotion
    if (piece === RED && toRow === 0) {
      piece = RED_KING;
    } else if (piece === BLACK && toRow === 7) {
      piece = BLACK_KING;
    }

    newBoard[toRow][toCol] = piece;

    // Handle capture
    if (move.isJump) {
      newBoard[move.capturedRow][move.capturedCol] = EMPTY;
    }

    // Record the move
    const moveNotation = `${toNotation(fromRow, fromCol)}${move.isJump ? 'x' : '-'}${toNotation(toRow, toCol)}`;

    setBoard(newBoard);

    // Check for additional jumps
    if (move.isJump) {
      const additionalJumps = getAdditionalJumps(newBoard, toRow, toCol, currentPlayer);
      if (additionalJumps.length > 0) {
        // Continue the multi-jump
        setSelectedPiece({ row: toRow, col: toCol });
        setValidMoves(additionalJumps);
        setJumpInProgress({ row: toRow, col: toCol });

        // Update move history for partial jump
        setMoveHistory(prev => {
          const newHistory = [...prev];
          if (jumpInProgress) {
            // Append to existing jump sequence
            const lastMove = newHistory[newHistory.length - 1];
            newHistory[newHistory.length - 1] = {
              ...lastMove,
              notation: lastMove.notation + `x${toNotation(toRow, toCol)}`
            };
          } else {
            // Start new jump sequence
            newHistory.push({
              player: currentPlayer,
              notation: moveNotation,
              from: { row: fromRow, col: fromCol },
              to: { row: toRow, col: toCol }
            });
          }
          return newHistory;
        });
        return;
      }
    }

    // Complete the move
    setMoveHistory(prev => {
      const newHistory = [...prev];
      if (jumpInProgress) {
        // Complete multi-jump
        const lastMove = newHistory[newHistory.length - 1];
        newHistory[newHistory.length - 1] = {
          ...lastMove,
          notation: lastMove.notation + `x${toNotation(toRow, toCol)}`,
          to: { row: toRow, col: toCol }
        };
      } else {
        newHistory.push({
          player: currentPlayer,
          notation: moveNotation,
          from: { row: fromRow, col: fromCol },
          to: { row: toRow, col: toCol }
        });
      }
      return newHistory;
    });

    setSelectedPiece(null);
    setValidMoves([]);
    setJumpInProgress(null);

    const nextPlayer = getOpponent(currentPlayer);
    if (!checkGameEnd(newBoard, nextPlayer)) {
      setCurrentPlayer(nextPlayer);
    }
  }, [board, currentPlayer, selectedPiece, validMoves, gameStatus, jumpInProgress, checkGameEnd]);

  // Handle cell click (either select piece or make move)
  const handleCellClick = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;

    // Check if this is a valid move destination
    const isValidMoveTarget = validMoves.some(m => m.toRow === row && m.toCol === col);

    if (isValidMoveTarget) {
      makeMove(row, col);
    } else {
      selectPiece(row, col);
    }
  }, [gameStatus, validMoves, makeMove, selectPiece]);

  // Reset the game
  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setCurrentPlayer(RED);
    setSelectedPiece(null);
    setValidMoves([]);
    setMoveHistory([]);
    setGameStatus('playing');
    setJumpInProgress(null);
    setRedPieces(12);
    setBlackPieces(12);
  }, []);

  return {
    board,
    currentPlayer,
    selectedPiece,
    validMoves,
    moveHistory,
    gameStatus,
    redPieces,
    blackPieces,
    handleCellClick,
    resetGame,
    RED,
    BLACK,
    RED_KING,
    BLACK_KING
  };
};
