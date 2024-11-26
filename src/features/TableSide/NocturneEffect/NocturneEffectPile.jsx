import React from 'react';
import { Pile } from '../Pile.jsx';
import { showCard } from '../../../Components/display_helper/CardDisplay.jsx';

const nocturneEffectList = [];
const boonColor = 'rgb(237, 237, 6)',
    hexColor = 'rgba(138, 43, 266, 0.7)'; 
const HEX = 'Hex',
    BOON = 'Boon';
const boonBack = {
    src: "./img/Nocturne/Boon/Boon-back.JPG",
}   
const hexBack = {
    src: "./img/Nocturne/Hex/Hex-back.JPG",
}   


class NocturneEffectPile extends Pile{
    constructor(props){
        super(props);
        this.state = {
            name: props.name,
            quantity: props.quantity,
        }
        
    }
    setQuantity(value){
        this.setState({quantity: value});
    }
    render(){
        const color = (this.state.name === BOON)?boonColor:hexColor;
        const cardBack = (this.state.name === BOON)?boonBack:hexBack;

        return <div className='non-supply'
                    style={{backgroundColor: color}}
                    onContextMenu={(e)=>{e.preventDefault(); showCard(cardBack)}}>
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