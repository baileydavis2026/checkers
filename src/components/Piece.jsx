import './Piece.css';

const Piece = ({ piece }) => {
  if (!piece) return null;
  
  const { color, isKing } = piece;

  return (
    <div className={`piece ${color}`}>
      <div className="piece-inner">
        {isKing && <span className="crown">&#9813;</span>}
      </div>
    </div>
  );
};

export default Piece;
