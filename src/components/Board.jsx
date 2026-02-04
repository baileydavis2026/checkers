import Cell from './Cell';
import './Board.css';

const Board = ({
  board,
  selectedPiece,
  validMoves,
  onCellClick
}) => {
  const isSelected = (row, col) => {
    return selectedPiece?.row === row && selectedPiece?.col === col;
  };

  const getValidMove = (row, col) => {
    return validMoves.find(m => m.toRow === row && m.toCol === col);
  };

  return (
    <div className="board-container">
      <div className="board-labels row-labels">
        {[8, 7, 6, 5, 4, 3, 2, 1].map(n => (
          <div key={n} className="label">{n}</div>
        ))}
      </div>
      <div className="board-wrapper">
        <div className="board">
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const move = getValidMove(rowIdx, colIdx);
              return (
                <Cell
                  key={`${rowIdx}-${colIdx}`}
                  row={rowIdx}
                  col={colIdx}
                  piece={cell}
                  isSelected={isSelected(rowIdx, colIdx)}
                  isValidMove={!!move}
                  isJumpMove={move?.isJump}
                  onClick={() => onCellClick(rowIdx, colIdx)}
                />
              );
            })
          )}
        </div>
        <div className="board-labels col-labels">
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(l => (
            <div key={l} className="label">{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
