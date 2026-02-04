import './GameInfo.css';

const GameInfo = ({ currentPlayer, gameStatus, redPieces, blackPieces, onNewGame }) => {
  const getStatusText = () => {
    switch (gameStatus) {
      case 'red-wins':
        return '🎉 Red Wins!';
      case 'black-wins':
        return '🎉 Black Wins!';
      case 'draw':
        return "It's a Draw!";
      default:
        return `${currentPlayer === 'red' ? 'Red' : 'Black'}'s Turn`;
    }
  };

  const isGameOver = gameStatus !== 'playing';

  return (
    <div className="game-info">
      <h1 className="game-title">Checkers</h1>
      
      <div className={`turn-indicator ${isGameOver ? 'game-over' : currentPlayer}`}>
        {getStatusText()}
      </div>
      
      <div className="piece-counts">
        <div className="piece-count red">
          <span className="piece-icon red-piece"></span>
          <span className="count">{redPieces}</span>
        </div>
        <span className="vs">vs</span>
        <div className="piece-count black">
          <span className="piece-icon black-piece"></span>
          <span className="count">{blackPieces}</span>
        </div>
      </div>
      
      <button className="new-game-btn" onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
};

export default GameInfo;
