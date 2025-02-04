import { useEffect, useState } from "react";
import './styles.css';

import { PlayerSide } from "../PlayerSide/PlayerSide";
import { TableSide } from "../TableSide/TableSide";
import { OpponentSide } from "../OpponentSide/OpponentSide";
import { SettingButton } from "../SettingButton";
import { Logger } from "../../Components/Logger";

import { SupportHand } from "../SupportHand";
import { CardDisplay } from "../../Components/display_helper/CardDisplay";
import { DeckDisplay } from "../../Components/display_helper/DeckDisplay";
import Result from "../AfterGame/Result";

import { GameEngine } from "../../main";



function MainPage(){
    
  const [headerShow, setHeaderShow] = useState(true);
  const [rightSideShow, setRightSideShow] = useState(true);

  function openNav(){
    setHeaderShow(!headerShow);
  }
  function toggleChat(){
    setRightSideShow(!rightSideShow);
  }

  let headerHeight = (headerShow)?"10%":"0%",
        body2Height = (headerShow)?"90%":"100%",
        leftSideWidth = (rightSideShow)?"85%":"100%",
        rightSideWidth = (rightSideShow)?"15%":"0%";

  useEffect(() => {
    let engine = new GameEngine();
    engine.run();
  });
  
  return (
    <div id='body1' >
              
            <Result />
            <DeckDisplay />
            <CardDisplay />
            <SupportHand />

            
          <OpponentSide headerHeight={headerHeight} />
          <div id='body2' style={{height: body2Height, top: headerHeight}}>
            <div style={{position: "absolute", left: "20%", fontSize:"20px",cursor:"pointer", zIndex:3}} 
                onClick={openNav}>&#9776;</div>
            <div id='left-side' style={{width: leftSideWidth}}>
                <TableSide />
                <PlayerSide />
            </div>
            <div style={{position:'absolute', right:"1%", bottom:"5%", cursor:"pointer", zIndex:3}} 
                    onClick={toggleChat}>&#9776;</div>
            <div id='right-side' style={{width: rightSideWidth}}>
                <Logger />
                <SettingButton />
            </div>
          </div>
      </div>
    
  );
}

export default MainPage;