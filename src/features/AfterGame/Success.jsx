import React from 'react';
import './AfterGame.css';

import { Backdrop } from '@mui/material';

function Success({ onPlayAgain }) {
    return (
        <div className="result-page success">
            <h1>Congratulations! You Win!</h1>
            <p>You have successfully completed the game.</p>
            <button onClick={onPlayAgain}>Play Again</button>
        </div>
    );
}

export default Success;