import './GameInfo.css';

const GameInfo = ({ 
  currentPlayer, 
  gameStatus, 
  redPieces, 
  blackPieces, 
  onNewGame,
  aiEnabled,
  aiDifficulty,
  aiThinking,
  onToggleAI,
  onSetDifficulty
}) => {
  const getStatusText = () => {
    switch (gameStatus) {
      case 'red-wins':
        return aiEnabled ? '🎉 You Win!' : '🎉 Red Wins!';
      case 'black-wins':
        return aiEnabled ? '😔 Computer Wins!' : '🎉 Black Wins!';
      case 'draw':
        return "It's a Draw!";
      default:
        if (aiThinking) return '🤔 Computer thinking...';
        if (aiEnabled && currentPlayer === 'black') return 'Computer\'s Turn';
        return `${currentPlayer === 'red' ? 'Red' : 'Black'}'s Turn`;
    }
  };

  const isGameOver = gameStatus !== 'playing';

  return (
    <div className="game-info">
      <h1 className="game-title">Checkers</h1>
      
      <div className="ai-controls">
        <label className="ai-toggle">
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => onToggleAI(e.target.checked)}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">Play vs Computer</span>
        </label>
        
        {aiEnabled && (
          <div className="difficulty-selector">
            <span className="difficulty-label">Difficulty:</span>
            <div className="difficulty-buttons">
              {['EASY', 'MEDIUM', 'HARD'].map((level) => (
                <button
                  key={level}
                  className={`difficulty-btn ${aiDifficulty === level ? 'active' : ''}`}
                  onClick={() => onSetDifficulty(level)}
                >
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className={`turn-indicator ${isGameOver ? 'game-over' : currentPlayer} ${aiThinking ? 'thinking' : ''}`}>
        {getStatusText()}
      </div>
      
      <div className="piece-counts">
        <div className="piece-count red">
          <span className="piece-icon red-piece"></span>
          <span className="count">{redPieces}</span>
          {aiEnabled && <span className="player-label">You</span>}
        </div>
        <span className="vs">vs</span>
        <div className="piece-count black">
          <span className="piece-icon black-piece"></span>
          <span className="count">{blackPieces}</span>
          {aiEnabled && <span className="player-label">CPU</span>}
        </div>
      </div>
      
      <button className="new-game-btn" onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
};

export default GameInfo;
