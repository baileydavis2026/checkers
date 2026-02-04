import './Piece.css';

const Piece = ({ type }) => {
  const isKing = type.includes('king');
  const color = type.includes('red') ? 'red' : 'black';

  return (
    <div className={`piece ${color}`}>
      <div className="piece-inner">
        {isKing && <span className="crown">&#9813;</span>}
      </div>
    </div>
  );
};

export default Piece;
