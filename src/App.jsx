import Board from './components/Board';
import MoveHistory from './components/MoveHistory';
import GameInfo from './components/GameInfo';
import { useCheckers } from './hooks/useCheckers';
import './App.css';

function App() {
  const {
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
    setDifficulty
  } = useCheckers();

  return (
    <div className="app">
      <GameInfo
        currentPlayer={currentPlayer}
        gameStatus={gameStatus}
        redPieces={redPieces}
        blackPieces={blackPieces}
        onNewGame={resetGame}
        aiEnabled={aiEnabled}
        aiDifficulty={aiDifficulty}
        aiThinking={aiThinking}
        onToggleAI={toggleAI}
        onSetDifficulty={setDifficulty}
      />
      <div className="game-container">
        <Board
          board={board}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          onCellClick={handleCellClick}
        />
        <MoveHistory moves={moveHistory} />
      </div>
    </div>
  );
}

export default App;
