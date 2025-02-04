import React from 'react';
import { Pile } from '../Pile.jsx';
import { showCard } from '../../../Components/display_helper/CardDisplay.jsx';
import { showCardList, cancelShowCardList } from '../../../Components/display_helper/DeckDisplay.jsx';

const nocturneEffectList = [];
const boonColor = 'rgb(237, 237, 6)',
    hexColor = 'rgba(138, 43, 266, 0.7)'; 
const HEX = 'Hex',
    BOON = 'Boon';
const boonBack = {
    src: "./img/Nocturne/Boon/Boon-back.JPG",
    type: ['Boon'],
}   
const hexBack = {
    src: "./img/Nocturne/Hex/Hex-back.JPG",
    type: ['Hex'],
}   


class NocturneEffectPile extends Pile{
    constructor(props){
        super(props);
        this.state = {
            name: props.name,
            quantity: props.quantity,

            cards_list: [],
        }
        this.isSplitPile = true;
        
    }
    setQuantity(value, cardList){
        this.setState({
            quantity: value,
            card_list: cardList,
        });
    }
    onContextMenuEvent(e){
        e.preventDefault();
        this.showCardList(true);

        /*
        showCardList(this.state.cards, true);
        window.onclick = function(){
            cancelShowCardList();
            window.onclick = null;
        }
            */
    }
    render(){
        const color = (this.state.name === BOON)?boonColor:hexColor;
        const cardBack = (this.state.name === BOON)?boonBack:hexBack;

        return <div className='non-supply'
                    style={{backgroundColor: color}}
                    /*
                        onMouseEnter={()=>{showCardList(this.state.cards, true)}}
                        onMouseLeave={()=>{cancelShowCardList()}}
                        onContextMenu={(e)=>{e.preventDefault(); showCard(cardBack)}}
                    */
                    onContextMenu={e => this.onContextMenuEvent(e)}
                    >
            {this.state.name}
            <div className='cards-count1'>{this.state.quantity}</div>
        </div>;
    }
}

function registerNocturneEffectPile(pile){
    nocturneEffectList = nocturneEffectList.filter(p => p.state.name != pile.state.name);
    nocturneEffectList.push(pile);
}

function findNocturneEffectPile(func){
    return nocturneEffectList.find(func);
}

export {NocturneEffectPile, findNocturneEffectPile};