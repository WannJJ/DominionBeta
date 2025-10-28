import React from "react";
import './display_helper.css';
import { Card } from "../../expansions/cards";
import { backdropClasses } from "@mui/material";



let cardDisplay = null;
class CardDisplay extends React.Component{
    constructor(props){
        super(props);
        cardDisplay = this;
        this.state = {
            isVisible: true,
            cardSrc: null,
            isPortrait: true,
        }
    }
    showCard(card){
        let isPortrait = card.type.includes(Card.Type.ACTION) || card.type.includes(Card.Type.TREASURE)
                        || card.type.includes(Card.Type.VICTORY) || card.type.includes(Card.Type.DURATION)
                        || card.type.includes(Card.Type.CURSE) || card.type.includes(Card.Type.NIGHT);
        this.setState(prevState => ({
            isVisible: true,
            cardSrc: card.src,
            isPortrait: isPortrait,
        }));
    }
    hide(){
        this.setState(prevState => ({
            isVisible: false,
            cardSrc: null,
            isPortrait: true,
        }));
    }
    render(){
        if(this.state.isVisible && this.state.cardSrc != null){
            const styles = {
                backgroundImage: `url(${this.state.cardSrc})`,
                ...(this.state.isPortrait?{height:"80%"}:{width:"60%"})
            }
            return <div id='card-display' style={styles}></div>
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
        document.onclick = null;
    }
}
function hideCardDisplay(){
    if(cardDisplay == null) return;
    cardDisplay.hide();
}

export {CardDisplay, showCard, hideCardDisplay};