import React from "react";
import './display_helper.css';

let cardDisplay = null;
class CardDisplay extends React.Component{
    constructor(props){
        super(props);
        cardDisplay = this;
        this.state = {
            card: null,
            visible: true,
        }
    }
    showCard(card){
        this.setState(prevState => ({
            card: card,
            visible: true,
        }));
    }
    hide(){
        this.setState(prevState => ({
            card: null,
            visible: false,
        }));
    }
    render(){
        if(this.state.visible && this.state.card != null){
            return <div id='card-display' style={{backgroundImage: `url(${this.state.card.src})`}}></div>
        } else{
            return (null);
        }
    }
}
function getCardDisplay(){
    return cardDisplay;
}
function showCard(card){
    if(cardDisplay == null || card == undefined || card.src == undefined) return;
    cardDisplay.showCard(card);
    document.onclick = function(){
        hideCardDisplay();
    }
}
function hideCardDisplay(){
    if(cardDisplay == null) return;
    cardDisplay.hide();
}

export {CardDisplay, showCard, hideCardDisplay};