import Piece from './Piece';
import './Cell.css';

const Cell = ({
  row,
  col,
  piece,
  isSelected,
  isValidMove,
  isJumpMove,
  onClick
}) => {
  const isDark = (row + col) % 2 === 1;

  return (
    <div
      className={`cell ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''} ${isJumpMove ? 'jump-move' : ''}`}
      onClick={onClick}
    >
      {piece && <Piece piece={piece} />}
      {isValidMove && !piece && (
        <div className={`move-indicator ${isJumpMove ? 'jump' : ''}`} />
      )}
    </div>
  );
};

export default Cell;
