import React from 'react';
import {Pile} from './Pile.jsx';
import { RootCard } from '../../expansions/cards.js';
import { generateCardFromMockObject } from '../../game_logic/GameState.js';
import { getCost } from '../../game_logic/basicCardFunctions.js';

let supplyPileList = [];
const ignoreActivateCondition = true;
const splitPile = ["Encampment", "Catapult", "Gladiator", "Patrician", "Settlers",
                "HumbleCastle",
];

class SupplyPile extends Pile{
    constructor(props){
        let cardClass = props.cardClass,
            quantity = props.quantity;
        let card = new cardClass();
        if(splitPile.includes(card.name)){
            let cardList = card.createSplitPile();
            super(props, null, cardList.length, cardList, card.name);
        } else{
            super(props, cardClass, quantity);
        }
        

        this.state = {
            ...this.state,
            victory_token: 0,
            trait_card: null,
        }

        

        addSupplyPile(this);
    }
    setVictoryToken(value){
        return new Promise(resolve =>{
            this.setState(
                prevState => ({
                    victory_token: value,
                }),
                resolve
            );
        })
        
    }
    getVictoryToken(){
        return this.state.victory_token;
    }
   
    toggleSelect(){
        this.popNextCard();
        this.setState(prevState => ({
            canSelect: !prevState.canSelect,
        }));
    }
    setTraitCard(card){
        if(!card || !(card instanceof RootCard)) throw new Error();
        return new Promise(resolve =>{
            this.setState(
                prevState => ({
                    trait_card: card,
                }),
                resolve
            );
        })
    }
    getTraitCard(){
        return this.state.trait_card;
    }
    onContextMenuEvent(e){
        e.preventDefault();
        this.showCardList();
        
    }
    render(){
        let topCard = this.getNextCard();
        if(!topCard) topCard = new this.props.cardClass();
        let src = topCard.src,
            quantity = this.getQuantity(),
            cost = getCost(topCard);
            //cost = topCard.getCost();
        
        let canSelect = false,
            onClickFunction = null;
        if(this.props.filterFunc != null && this.props.onClickFunc != null){ 
            if(this.props.filterFunc(this)){
                canSelect = true;
                onClickFunction = () => this.props.onClickFunc(this);
            } else {
                canSelect = false;
            }
        }
        let canSelectClass = (canSelect && quantity>0)?' canSelect':'';

        return <div className={'pile'+' '+canSelectClass} 
                    style={{backgroundImage: `url(${src})`}}
                    onClick={onClickFunction}
                    onContextMenu={(e)=>{this.onContextMenuEvent(e)}}
                >
                    {this.state.victory_token > 0 
                        && <div className='victory-token'>{this.state.victory_token}</div>}
                    {this.state.debt_token > 0 
                        && <div className='debt-token'>{this.state.debt_token}</div>}
                    {quantity === 0 
                        && <div className='empty' />}
                    <Cost coin={cost.coin} debt={cost.debt} potion={cost.potion }/>
                    <Quantity value={quantity}/>
                    {this.state.trait_card
                        && <div className="trait"
                        style={{backgroundImage: `url(${this.state.trait_card.src})`}}>
                    </div>
                    }
                    
        </div>
    }
    createMockObject(){
        return {
            name: this.state.name,
            card_list: this.state.card_list.map(c => c.createMockObject(ignoreActivateCondition)),
            victory_token: this.state.victory_token,
            debt_token: this.state.debt_token,
            trait_card: this.state.trait_card?this.state.trait_card.createMockObject(): null,
        };
    }
    async parseDataFromMockObject(mockObj){
        await super.parseDataFromMockObject(mockObj, ignoreActivateCondition);
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                victory_token: mockObj.victory_token,
                debt_token: mockObj.debt_token,
                trait_card: mockObj.trait_card?generateCardFromMockObject(mockObj.trait_card): null,
            }),
            resolve);
        });
    }
}
class Cost extends React.Component{
    render(){
        const coin = this.props.coin,
            debt = this.props.debt,
            potion = this.props.potion;
        return <div className='cost'>
            {(coin !== 0 || (debt === 0 && potion === 0))
            && <div className='cost-coin'>{coin}</div>}
            {debt !== 0
            && <div className='cost-debt'>{debt}</div>}
            {potion!== 0
            && <div className='cost-potion'>{potion}</div>}
        </div>
    }
}
class Quantity extends React.Component{
    render(){
        return <div className='amount' key={this.props.value}>{this.props.value}</div>
    }
}

function addSupplyPile(pile){
    supplyPileList = supplyPileList.filter(p => p.state.name !== pile.state.name);
    supplyPileList.push(pile);
}
function findSupplyPile(func){
    return supplyPileList.find(func);
}
function findSupplyPileAll(func){
    let result = [];
    for(let pile of supplyPileList){
        if(func(pile)){
            result.push(pile);
        }
    }
    return result;
}
export{SupplyPile, findSupplyPile, findSupplyPileAll};