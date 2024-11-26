import React from "react";
import './PlayerSide/PlayerSide.css'
import { CardHolder } from "./PlayerSide/CardHolder/CardHolder";
import { Card } from "./PlayerSide/CardHolder/CardHolder";

let supportHand = null;
class SupportHand extends CardHolder{
    constructor(props){
        super(props, 'support-hand');
        supportHand = this;
    }
    hide(){
        this.setState(prevState => ({
            cards: [],
            filterFunc: null,
            onClickFunc: null,
        }))
    }
    clear(){
        this.setState(prevState => ({
            cards: [],
            filterFunc: null,
            onClickFunc: null,
        }))
    }
    render(){
        if(this.state.cards.length == 0 ){
            return (null);
        } else{
            return super.render();
        }
    }
}
function getSupportHand(){
    return supportHand;
}

export{SupportHand, getSupportHand}