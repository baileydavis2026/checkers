import { useState, useCallback, useEffect, useRef } from 'react';
import { getBestMove } from '../ai/checkerAI';

// Constants
const RED = 'red';
const BLACK = 'black';

// Initialize the board with starting positions
const createInitialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Place black pieces (top of board, rows 0-2)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: BLACK, isKing: false };
      }
    }
  }

  // Place red pieces (bottom of board, rows 5-7)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: RED, isKing: false };
      }
    }
  }

  return board;
};

// Check if a piece belongs to a player
const belongsTo = (piece, player) => {
  if (!piece) return false;
  return piece.color === player;
};

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
  const pieceIsKing = piece.isKing;

  // Determine movement directions
  const directions = [];
  if (player === RED || pieceIsKing) {
    directions.push([-1, -1], [-1, 1]); // Move up
  }
  if (player === BLACK || pieceIsKing) {
    directions.push([1, -1], [1, 1]); // Move down
  }

  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (isValidPosition(newRow, newCol)) {
      if (board[newRow][newCol] === null && !mustJump) {
        moves.push({ toRow: newRow, toCol: newCol, isJump: false });
      } else if (board[newRow][newCol] && belongsTo(board[newRow][newCol], getOpponent(player))) {
        const jumpRow = newRow + dRow;
        const jumpCol = newCol + dCol;
        if (isValidPosition(jumpRow, jumpCol) && board[jumpRow][jumpCol] === null) {
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

// Get valid moves for AI (different format expected by AI module)
const getValidMovesForPieceAI = (board, row, col, mustCapture) => {
  const piece = board[row][col];
  if (!piece) return [];
  
  const player = piece.color;
  const moves = [];
  const pieceIsKing = piece.isKing;

  const directions = [];
  if (player === RED || pieceIsKing) {
    directions.push([-1, -1], [-1, 1]);
  }
  if (player === BLACK || pieceIsKing) {
    directions.push([1, -1], [1, 1]);
  }

  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (isValidPosition(newRow, newCol)) {
      if (!mustCapture && board[newRow][newCol] === null) {
        moves.push({ row: newRow, col: newCol });
      } else if (board[newRow][newCol] && board[newRow][newCol].color !== player) {
        const jumpRow = newRow + dRow;
        const jumpCol = newCol + dCol;
        if (isValidPosition(jumpRow, jumpCol) && board[jumpRow][jumpCol] === null) {
          moves.push({ row: jumpRow, col: jumpCol });
        }
      }
    }
  }

  return moves;
};

// Check if player has captures available (for AI)
const hasCapturesAI = (board, player) => hasAnyJump(board, player);

// Check for additional jumps after a jump
const getAdditionalJumps = (board, row, col, player) => {
  const piece = board[row][col];
  if (!piece) return [];

  const jumps = [];
  const pieceIsKing = piece.isKing;

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
      board[midRow][midCol] &&
      belongsTo(board[midRow][midCol], getOpponent(player)) &&
      board[jumpRow][jumpCol] === null
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
  const colLetter = String.fromCharCode(97 + col);
  const rowNumber = 8 - row;
  return `${colLetter}${rowNumber}`;
};

// Count pieces on board
const countPieces = (board) => {
  let red = 0, black = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (belongsTo(board[row][col], RED)) red++;
      if (belongsTo(board[row][col], BLACK)) black++;
    }
  }
  return { red, black };
};

export const useCheckers = () => {
  const [board, setBoard] = useState(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState(RED);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [jumpInProgress, setJumpInProgress] = useState(null);
  const [redPieces, setRedPieces] = useState(12);
  const [blackPieces, setBlackPieces] = useState(12);
  
  // AI settings
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM');
  const [aiThinking, setAiThinking] = useState(false);
  
  // Refs for AI
  const aiTimeoutRef = useRef(null);
  const boardRef = useRef(board);
  const difficultyRef = useRef(aiDifficulty);
  
  // Keep refs in sync
  useEffect(() => {
    boardRef.current = board;
  }, [board]);
  
  useEffect(() => {
    difficultyRef.current = aiDifficulty;
  }, [aiDifficulty]);

  // Check for game end conditions
  const checkGameEnd = useCallback((newBoard, nextPlayer) => {
    const moves = getAllValidMoves(newBoard, nextPlayer);
    const { red, black } = countPieces(newBoard);

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
      setGameStatus(nextPlayer === RED ? 'black-wins' : 'red-wins');
      return true;
    }

    return false;
  }, []);

  // Execute AI move - called when it's AI's turn
  const executeAIMove = useCallback(() => {
    const currentBoard = boardRef.current;
    const difficulty = difficultyRef.current;
    
    setAiThinking(true);
    
    // Small delay for UX
    aiTimeoutRef.current = setTimeout(() => {
      try {
        const aiMove = getBestMove(
          currentBoard,
          BLACK,
          difficulty,
          getValidMovesForPieceAI,
          hasCapturesAI
        );
        
        if (!aiMove) {
          console.error('AI returned no move');
          setAiThinking(false);
          return;
        }

        // Clone board for modifications
        let newBoard = currentBoard.map(r => r.map(c => c ? { ...c } : null));
        const { from, to, isCapture } = aiMove;
        
        // Get the piece and move it
        let piece = { ...newBoard[from.row][from.col] };
        newBoard[from.row][from.col] = null;
        
        // Build move notation
        let notation = toNotation(from.row, from.col);
        let finalPos = { row: to.row, col: to.col };
        
        // Handle capture
        if (isCapture) {
          const capturedRow = Math.floor((from.row + to.row) / 2);
          const capturedCol = Math.floor((from.col + to.col) / 2);
          newBoard[capturedRow][capturedCol] = null;
          notation += 'x' + toNotation(to.row, to.col);
        } else {
          notation += '-' + toNotation(to.row, to.col);
        }
        
        // King promotion
        if (piece.color === BLACK && to.row === 7) {
          piece.isKing = true;
        }
        
        newBoard[to.row][to.col] = piece;
        
        // Handle multi-jumps
        if (isCapture) {
          let additionalJumps = getAdditionalJumps(newBoard, to.row, to.col, BLACK);
          let currentPos = { row: to.row, col: to.col };
          
          while (additionalJumps.length > 0) {
            const nextJump = additionalJumps[0];
            
            // Move piece
            piece = { ...newBoard[currentPos.row][currentPos.col] };
            newBoard[currentPos.row][currentPos.col] = null;
            newBoard[nextJump.capturedRow][nextJump.capturedCol] = null;
            
            // Check for promotion
            if (piece.color === BLACK && nextJump.toRow === 7) {
              piece.isKing = true;
            }
            
            newBoard[nextJump.toRow][nextJump.toCol] = piece;
            notation += 'x' + toNotation(nextJump.toRow, nextJump.toCol);
            
            currentPos = { row: nextJump.toRow, col: nextJump.toCol };
            finalPos = currentPos;
            
            additionalJumps = getAdditionalJumps(newBoard, currentPos.row, currentPos.col, BLACK);
          }
        }
        
        // Update state
        setBoard(newBoard);
        setMoveHistory(prev => [...prev, {
          player: BLACK,
          notation,
          from: { row: from.row, col: from.col },
          to: finalPos
        }]);
        
        // Check for game end and switch player
        if (!checkGameEnd(newBoard, RED)) {
          setCurrentPlayer(RED);
        }
      } catch (err) {
        console.error('AI error:', err);
      }
      
      setAiThinking(false);
    }, 600);
  }, [checkGameEnd]);

  // Trigger AI when it's black's turn
  useEffect(() => {
    if (aiEnabled && currentPlayer === BLACK && gameStatus === 'playing' && !aiThinking) {
      executeAIMove();
    }
    
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [aiEnabled, currentPlayer, gameStatus, aiThinking, executeAIMove]);

  // Handle piece selection
  const selectPiece = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;
    if (aiEnabled && currentPlayer === BLACK) return;

    const piece = board[row][col];

    if (jumpInProgress) {
      if (row === jumpInProgress.row && col === jumpInProgress.col) {
        setSelectedPiece({ row, col });
        const additionalJumps = getAdditionalJumps(board, row, col, currentPlayer);
        setValidMoves(additionalJumps);
      }
      return;
    }

    if (belongsTo(piece, currentPlayer)) {
      const mustJump = hasAnyJump(board, currentPlayer);
      const moves = getPossibleMoves(board, row, col, currentPlayer, mustJump);
      const filteredMoves = mustJump ? moves.filter(m => m.isJump) : moves;

      if (filteredMoves.length > 0) {
        setSelectedPiece({ row, col });
        setValidMoves(filteredMoves);
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  }, [board, currentPlayer, gameStatus, jumpInProgress, aiEnabled]);

  // Handle move execution
  const makeMove = useCallback((toRow, toCol) => {
    if (!selectedPiece || gameStatus !== 'playing') return;
    if (aiEnabled && currentPlayer === BLACK) return;

    const move = validMoves.find(m => m.toRow === toRow && m.toCol === toCol);
    if (!move) return;

    const { row: fromRow, col: fromCol } = selectedPiece;
    const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
    let piece = { ...newBoard[fromRow][fromCol] };

    newBoard[fromRow][fromCol] = null;

    // King promotion
    if (piece.color === RED && toRow === 0) {
      piece.isKing = true;
    }

    newBoard[toRow][toCol] = piece;

    if (move.isJump) {
      newBoard[move.capturedRow][move.capturedCol] = null;
    }

    const moveNotation = `${toNotation(fromRow, fromCol)}${move.isJump ? 'x' : '-'}${toNotation(toRow, toCol)}`;

    setBoard(newBoard);

    if (move.isJump) {
      const additionalJumps = getAdditionalJumps(newBoard, toRow, toCol, currentPlayer);
      if (additionalJumps.length > 0) {
        setSelectedPiece({ row: toRow, col: toCol });
        setValidMoves(additionalJumps);
        setJumpInProgress({ row: toRow, col: toCol });

        setMoveHistory(prev => {
          const newHistory = [...prev];
          if (jumpInProgress) {
            const lastMove = newHistory[newHistory.length - 1];
            newHistory[newHistory.length - 1] = {
              ...lastMove,
              notation: lastMove.notation + `x${toNotation(toRow, toCol)}`
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
        return;
      }
    }

    setMoveHistory(prev => {
      const newHistory = [...prev];
      if (jumpInProgress) {
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
  }, [board, currentPlayer, selectedPiece, validMoves, gameStatus, jumpInProgress, checkGameEnd, aiEnabled]);

  // Handle cell click
  const handleCellClick = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;
    if (aiEnabled && currentPlayer === BLACK) return;

    const isValidMoveTarget = validMoves.some(m => m.toRow === row && m.toCol === col);

    if (isValidMoveTarget) {
      makeMove(row, col);
    } else {
      selectPiece(row, col);
    }
  }, [gameStatus, validMoves, makeMove, selectPiece, aiEnabled, currentPlayer]);

  // Reset the game
  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    setBoard(createInitialBoard());
    setCurrentPlayer(RED);
    setSelectedPiece(null);
    setValidMoves([]);
    setMoveHistory([]);
    setGameStatus('playing');
    setJumpInProgress(null);
    setRedPieces(12);
    setBlackPieces(12);
    setAiThinking(false);
  }, []);

  // Toggle AI
  const toggleAI = useCallback((enabled) => {
    setAiEnabled(enabled);
    resetGame();
  }, [resetGame]);

  // Set difficulty
  const setDifficulty = useCallback((difficulty) => {
    setAiDifficulty(difficulty);
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
    aiEnabled,
    aiDifficulty,
    aiThinking,
    toggleAI,
    setDifficulty,
    RED,
    BLACK
  };
};
