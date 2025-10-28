import React from 'react';
import styles from './OpponentSide.module.css';

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
        return <header className={styles.header} style={{height: this.props.headerHeight}}>
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
        const handCardList = this.state.hand.map((card, index) => <div key={index}
            className={styles.hand_card}
            style={{backgroundImage: `url(./img/Basic/Back.JPG)`}}>
        </div>);
        return <div className={styles.opponent_side}>
            <div>{this.state.name}</div>

            <div className={`${styles.opponent_discard} tooltip`}
                style={discardBackgroundImageStyle}> 
                <div className="tooltiptext">DISCARD</div>
                <div className={styles.cards_count}>{this.state.discard.length}</div>
            </div>

            <div className={`${styles.opponent_deck} tooltip`}
                 style={{backgroundImage: `url(./img/Basic/Back.JPG)`}}>
                <div className="tooltiptext">DECK</div>
                <div className={styles.cards_count}>{this.state.deck.length}</div>

            </div>

            <div className={`${styles.opponent_hand} tooltip`}>
                {handCardList}
                <div className="tooltiptext">HAND</div>
                <div className={styles.cards_count}>{this.state.hand.length}</div>
            </div>

            <div className={`${styles.opponent_score} tooltip`}
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