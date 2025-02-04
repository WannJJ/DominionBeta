import React from 'react';
import './OpponentSide.css';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';


let opponentSide = null,
    opponentComponentList = [];


class OpponentSide extends React.Component{
    constructor(props){ 
        super(props);
        this.state = {
            opponentList: [],
        }

        opponentSide = this;
    }
    addOpponent(name){
        return new Promise((resolve)=>{
            this.setState(prevState =>({
                opponentList: [...prevState.opponentList, {name: name}],
            }),
            resolve);
        })
    }
    render(){
        let opponentList = this.state.opponentList.map((opponent, index) => <OpponentBoard name={opponent.name} key={index}/>);
        return <header className='header' style={{height: this.props.headerHeight}}>
            {opponentList}
        </header>;
    }
}

class OpponentBoard extends React.Component{
    constructor(props){
        super(props);
        let name = this.props.name;
        this.state = {
            name: name,
            discard: [],//[{src: './img/Base/Sentry.JPG'}],
            deck: [],
            hand: [],
            score: 0,
        };
        opponentComponentList.push(this);
    }
    getName(){
        return this.state.name;
    }
    updateStatus(newState){
        return new Promise((resolve)=>{
            this.setState(prevState =>({
                discard: newState.discard,
                deck: newState.deck,
                hand: newState.hand,
                score: newState.score,
            }),
            resolve);
        })
    }
    render(){
        const discardBackgroundImageStyle = (this.state.discard.length > 0)
                ?{backgroundImage: `url(${this.state.discard[this.state.discard.length-1].src})`}
                :{};
        return <div className='opponent-side'>
            <div>{this.state.name}</div>

            <div className='opponent-discard tooltip' 
                style={discardBackgroundImageStyle}> 
                <div className="tooltiptext">DISCARD</div>
                <div className="cards-count">{this.state.discard.length}</div>
            </div>

            <div className='opponent-deck tooltip'
                 style={{backgroundImage: `url(./img/Basic/Back.JPG)`}}>
                <div className="tooltiptext">DECK</div>
                <div className="cards-count">{this.state.deck.length}</div>

            </div>

            <div className="opponent-hand tooltip">
                <div className="hand-card"></div>
                <div className="hand-card"></div>
                <div className="hand-card"></div>
                <div className="tooltiptext">HAND</div>
                <div className="cards-count">{this.state.hand.length}</div>
            </div>

            <div className="opponent-score tooltip"
                 style={{backgroundImage: `url(./img/Basic/VP1.png)`}}>
                <div className="tooltiptext">SCORE</div>
                <span>{this.state.score}</span>
            </div>
                
        </div>
    }
}

function getOpponentSide(){
    return opponentSide;    
}
function getOpponentComponentList(){
    return opponentComponentList;
}

export {OpponentSide, getOpponentSide, getOpponentComponentList};