import React, { useState } from 'react';
import Success from './Success';
import Lose from './Lose';
import './AfterGame.css';


let setVisible = null;
let setWin = null;

export function openResultBoard(isWinner=true) {
    if (setVisible) setVisible(true);
    if (setWin) setWin(isWinner)
}

export function closeResultBoard() {
  if (setVisible) setVisible(false);
}

const Result = () => {
    const [visible, setVisibleState] = useState(false);
    const [winStatus, setWinStatus] = useState(true);
  
    // Gán hàm setVisible từ useState vào biến toàn cục setVisible để có thể gọi từ ngoài
    setVisible = setVisibleState;
    setWin = setWinStatus;
  
    //if (!visible) return null; // Ẩn component nếu visible là false
    if (!visible) return null;
  
    return (
        <>
            {winStatus ? <Success /> : <Lose /> }
        </>
    );
  };
  
  export default Result;