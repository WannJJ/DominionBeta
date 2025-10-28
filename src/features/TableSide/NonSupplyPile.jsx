import React from 'react';
import {Pile} from './Pile.jsx';

let nonSupplyPileList = [];

class NonSupplyPile extends Pile{
    constructor(props){
        let cardClass = props.cardClass,
            quantity = props.quantity,
            cardList = props.cardList,
            name = props.name;
        super(props, cardClass, quantity, cardList, name);

        registerNonSupplyPile(this);
    }
    createMockObject(){
        return super.createMockObject();
    }
    async parseDataFromMockObject(mockObj){
        await super.parseDataFromMockObject(mockObj);
    }
    render(){
        let topCard = this.getNextCard();
        return <div className='non-supply'
                    onContextMenu={(e)=>{e.preventDefault(); this.showCardList(true)}}>
                    {/*onContextMenu={(e)=>{e.preventDefault(); showCard(topCard)}}>*/}
            {this.state.name}
            {this.state.debt_token > 0 
                        && <div className='debt-token'>{this.state.debt_token}</div>}
            <div className='cards-count1'>{this.getQuantity()}</div>
        </div>;
    }
}


const nonSupplyManager = {
    getNonSupplyPileList: function(){
        return nonSupplyPileList;
    },  
    createMockObject: function(){
        let pile_list = [];
        for (let pile of nonSupplyPileList){
            pile_list.push(pile.createMockObject());
        }
        return {pile_list: pile_list};
    },
    parseDataFromMockObject: async function(mockObj){
        if(mockObj == undefined || !Array.isArray(mockObj.pile_list)){
            throw new Error('INVALID Non Supply object');
        }
        for(let mockPile of mockObj.pile_list){
            let pile = findNonSupplyPile(p => p.getName() == mockPile.name);
            if(pile == undefined) {
                console.warn(`Cant find pile: ${mockPile.name}`);
                continue;
            }
            await pile.parseDataFromMockObject(mockPile);
        }
    }
}

function registerNonSupplyPile(pile){
    nonSupplyPileList = nonSupplyPileList.filter(p => p.state.name !== pile.state.name);
    nonSupplyPileList.push(pile);
}
function findNonSupplyPile(func){
    return nonSupplyPileList.find(func);
}

export {NonSupplyPile, findNonSupplyPile, 
    nonSupplyManager
};