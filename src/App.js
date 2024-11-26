import React from 'react';
import './App.css';
import { OpponentSide } from './features/OpponentSide/OpponentSide.jsx';
import {PlayerSide} from './features/PlayerSide/PlayerSide.jsx';
import {TableSide} from './features/TableSide/TableSide.jsx';
import { Logger } from './Components/Logger.jsx';
import { SupportHand } from './features/SupportHand.jsx';
import { CardDisplay } from './Components/display_helper/CardDisplay.jsx';
import { DeckDisplay } from './Components/display_helper/DeckDisplay.jsx';
import { SettingButton } from './features/SettingButton.jsx';

import Result from './features/AfterGame/Result.jsx';
import { GameEngine } from './main.js';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';




class App extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      headerShow: true,
      rightSideShow: true,
    };
  }
  openNav(){
    this.setState((prevState) => ({
      headerShow: !prevState.headerShow
    }));
  }
  toggleChat(){
    this.setState((prevState) => ({
      rightSideShow: !prevState.rightSideShow
    }));
  }
  render(){
    let headerHeight = (this.state  .headerShow)?"10%":"0%",
        body2Height = (this.state.headerShow)?"90%":"100%",
        leftSideWidth = (this.state.rightSideShow)?"85%":"100%",
        rightSideWidth = (this.state.rightSideShow)?"15%":"0%";
    return <div id='body1' >
              
              <Result />
              <DeckDisplay />
              <CardDisplay />
              <SupportHand />

              
            <OpponentSide headerHeight={headerHeight} />
            <div id='body2' style={{height: body2Height, top: headerHeight}}>
              <div style={{position: "absolute", left: "20%", fontSize:"20px",cursor:"pointer", zIndex:3}} 
                  onClick={this.openNav.bind(this)}>&#9776;</div>
              <div id='left-side' style={{width: leftSideWidth}}>
                  <TableSide />
                  <PlayerSide />
              </div>
              <div style={{position:'absolute', right:"1%", bottom:"5%", cursor:"pointer", zIndex:3}} 
                      onClick={this.toggleChat.bind(this)}>&#9776;</div>
              <div id='right-side' style={{width: rightSideWidth}}>
                  <Logger />
                  <SettingButton />
              </div>
            </div>
        </div>; 
  }
  async componentDidMount(){
    let engine = new GameEngine();
    await engine.run();
  }
}
  


export default App;
