import { useState, useCallback, useEffect, useRef } from 'react';
import { getBestMove } from '../ai/checkerAI';

// Constants
const RED = 'red';
const BLACK = 'black';

// Initialize the board with starting positions
const createInitialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: BLACK, isKing: false };
      }
    }
  }

  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: RED, isKing: false };
      }
    }
  }

  return board;
};

const belongsTo = (piece, player) => piece && piece.color === player;
const getOpponent = (player) => (player === RED ? BLACK : RED);
const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

const getPossibleMoves = (board, row, col, player, mustJump = false) => {
  const piece = board[row][col];
  if (!piece || !belongsTo(piece, player)) return [];

  const moves = [];
  const jumps = [];
  const pieceIsKing = piece.isKing;

  const directions = [];
  if (player === RED || pieceIsKing) directions.push([-1, -1], [-1, 1]);
  if (player === BLACK || pieceIsKing) directions.push([1, -1], [1, 1]);

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

// AI helper functions
const getValidMovesForPieceAI = (board, row, col, mustCapture) => {
  const piece = board[row][col];
  if (!piece) return [];
  
  const player = piece.color;
  const moves = [];
  const pieceIsKing = piece.isKing;

  const directions = [];
  if (player === RED || pieceIsKing) directions.push([-1, -1], [-1, 1]);
  if (player === BLACK || pieceIsKing) directions.push([1, -1], [1, 1]);

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

const hasCapturesAI = (board, player) => hasAnyJump(board, player);

const getAdditionalJumps = (board, row, col, player) => {
  const piece = board[row][col];
  if (!piece) return [];

  const jumps = [];
  const pieceIsKing = piece.isKing;

  const directions = [];
  if (player === RED || pieceIsKing) directions.push([-1, -1], [-1, 1]);
  if (player === BLACK || pieceIsKing) directions.push([1, -1], [1, 1]);

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

const toNotation = (row, col) => {
  const colLetter = String.fromCharCode(97 + col);
  const rowNumber = 8 - row;
  return `${colLetter}${rowNumber}`;
};

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
  
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM');
  const [aiThinking, setAiThinking] = useState(false);
  
  const aiTimeoutRef = useRef(null);

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

  // AI turn effect - triggers when it's black's turn and AI is enabled
  useEffect(() => {
    // Clear any pending timeout
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    // Check if AI should move
    if (!aiEnabled || currentPlayer !== BLACK || gameStatus !== 'playing' || aiThinking) {
      return;
    }

    setAiThinking(true);

    aiTimeoutRef.current = setTimeout(() => {
      // Get AI's move
      const aiMove = getBestMove(
        board,
        BLACK,
        aiDifficulty,
        getValidMovesForPieceAI,
        hasCapturesAI
      );

      if (!aiMove) {
        setAiThinking(false);
        return;
      }

      // Execute the move
      let newBoard = board.map(r => r.map(c => c ? { ...c } : null));
      const { from, to, isCapture } = aiMove;
      
      let piece = { ...newBoard[from.row][from.col] };
      newBoard[from.row][from.col] = null;
      
      let notation = toNotation(from.row, from.col);
      let finalPos = { row: to.row, col: to.col };
      
      if (isCapture) {
        const capturedRow = Math.floor((from.row + to.row) / 2);
        const capturedCol = Math.floor((from.col + to.col) / 2);
        newBoard[capturedRow][capturedCol] = null;
        notation += 'x' + toNotation(to.row, to.col);
      } else {
        notation += '-' + toNotation(to.row, to.col);
      }
      
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
          
          piece = { ...newBoard[currentPos.row][currentPos.col] };
          newBoard[currentPos.row][currentPos.col] = null;
          newBoard[nextJump.capturedRow][nextJump.capturedCol] = null;
          
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
      
      // Update all state
      setBoard(newBoard);
      setMoveHistory(prev => [...prev, {
        player: BLACK,
        notation,
        from: { row: from.row, col: from.col },
        to: finalPos
      }]);
      
      const { red, black } = countPieces(newBoard);
      setRedPieces(red);
      setBlackPieces(black);
      
      // Check game end
      const moves = getAllValidMoves(newBoard, RED);
      if (red === 0) {
        setGameStatus('black-wins');
      } else if (moves.length === 0) {
        setGameStatus('black-wins');
      } else {
        setCurrentPlayer(RED);
      }
      
      setAiThinking(false);
    }, 700);

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [aiEnabled, currentPlayer, gameStatus, aiThinking, board, aiDifficulty]);

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

  const makeMove = useCallback((toRow, toCol) => {
    if (!selectedPiece || gameStatus !== 'playing') return;
    if (aiEnabled && currentPlayer === BLACK) return;

    const move = validMoves.find(m => m.toRow === toRow && m.toCol === toCol);
    if (!move) return;

    const { row: fromRow, col: fromCol } = selectedPiece;
    const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
    let piece = { ...newBoard[fromRow][fromCol] };

    newBoard[fromRow][fromCol] = null;

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

  const toggleAI = useCallback((enabled) => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    setAiThinking(false);
    setAiEnabled(enabled);
    // Reset game when toggling
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
