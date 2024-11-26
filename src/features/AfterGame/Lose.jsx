import React from 'react';
import './AfterGame.css';

function Lose({ onPlayAgain }) {
    return (
        <div className="result-page lose">
            <h1>Game Over</h1>
            <p>Better luck next time!</p>
            <button onClick={onPlayAgain}>Try Again</button>
        </div>
    );
}

export default Lose;