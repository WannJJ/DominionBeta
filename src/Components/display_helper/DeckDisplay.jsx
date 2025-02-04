import React from "react";
import './display_helper.css';
import { shuffleArray } from "../../utils/helpers";

let deckDisplay  = null;
class DeckDisplay extends React.Component{
    constructor(props){
        super(props);
        deckDisplay = this;
        this.CSSid = 'deck-display';
        this.state = {
            visible: false,
            cardList: [],
        }
    }
    showCardList(cardList, shuffle=false){
        this.setState(prevState => ({
            visible: true,
            cardList: shuffle?shuffleArray(cardList):cardList,
        }));
    }
    cancelShowCardList(){
        this.setState(prevState => ({
            visible: false,
            cardList: [],
        }));
    }
    render(){
        let isLandscape = function(card){
            return card.type.includes('Boon') || card.type.includes("Hex");
        }
        if(this.state.visible){
            let cardComponentList = this.state.cardList.map((card, index) => 
                <div key={index} 
                    style={{
                        backgroundImage: `url(${card.src})`,
                        aspectRatio: `${isLandscape(card)?"8/5":"5/8"}`,
                        }}>

                    </div>);
            return <div id={this.CSSid}>
                {cardComponentList}
            </div>
        } else {
            return (null);
        }
    }
    componentDidUpdate(){
        if(this.state.visible) slowlyScrollDeckDisplay();
    }
}


function getDeckDisplay(){
    return deckDisplay;
}
function showCardList(cardList, shuffle=false){
    if(deckDisplay == null || !Array.isArray(cardList)) return;
    deckDisplay.showCardList(cardList, shuffle);
}
function cancelShowCardList(){
    if(deckDisplay == null) return;
    deckDisplay.cancelShowCardList();
}
function slowlyScrollDeckDisplay(){
    let html_element_display = document.getElementById('deck-display');
    if(html_element_display == null) return;
    if(html_element_display.scrollHeight > html_element_display.clientHeight){
        html_element_display.scrollTop = 0;
        let delayCount = 0;
        let intervalId = setInterval(() => {
            html_element_display = document.getElementById('deck-display');
            if(html_element_display == null) {clearInterval(intervalId); return;}
            html_element_display.scrollTop += 10;
            if(html_element_display.scrollTop + html_element_display.clientHeight >= html_element_display.scrollHeight){
                delayCount += 1;
                if(delayCount > 10){
                    html_element_display.scrollTop = 0;
                    delayCount = 0;
                }
            }
        }, 100);
    }
}


export {DeckDisplay, showCardList, cancelShowCardList};