import { useEffect, useRef } from 'react';
import './MoveHistory.css';

const MoveHistory = ({ moves }) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [moves]);

  // Group moves into pairs (red move, black move)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      red: moves[i],
      black: moves[i + 1]
    });
  }

  return (
    <div className="move-history">
      <h3 className="move-history-title">Move History</h3>
      <div className="move-list" ref={listRef}>
        {movePairs.length === 0 ? (
          <div className="no-moves">No moves yet</div>
        ) : (
          movePairs.map((pair, idx) => (
            <div key={idx} className="move-pair">
              <span className="move-number">{pair.number}.</span>
              <span className="move red-move">{pair.red?.notation || ''}</span>
              <span className="move black-move">{pair.black?.notation || ''}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
