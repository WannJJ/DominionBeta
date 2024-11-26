import React from "react";
import { CardPile } from "../CardPile/CardPile";
import { showCardList, cancelShowCardList } from "../../../Components/display_helper/DeckDisplay";


var playArea = null,
    setAside = null,
    exile = null;

class SideArea extends CardPile{
    constructor(props, name=''){
        super(props);
        this.name = name;
    }
    render(){
        let cardsCount = this.state.cards.length;
        if(cardsCount > 0){
            return <div className='side-area'
                        onMouseEnter={()=>{showCardList(this.state.cards)}}
                        onMouseLeave={()=>{cancelShowCardList()}}>
                        {this.name}
                        <div className="cards-count1">{this.state.cards.length}</div>
            </div>
        } else {
            return (null);
        }
    }
}
class PlayArea extends SideArea{
    constructor(props){
        super(props, 'PlayArea');
        playArea = this;
    }
}
class SetAside extends SideArea{
    constructor(props){
        super(props, 'SetAside');
        setAside = this;
    }
}
class Exile extends SideArea{
    constructor(props){
        super(props, 'Exile');
        exile = this;
    }
}
function getPlayArea(){
    return playArea;
}
function getSetAside(){
    return setAside;
}
function getExile(){
    return exile;
}



export {SideArea, PlayArea, SetAside, Exile,
    getPlayArea, getSetAside, getExile};