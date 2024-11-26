import React from 'react';
import {Pile} from './Pile.jsx';
import { showCard } from '../../Components/display_helper/CardDisplay.jsx';

let supplyPileList = [];
const ignoreActivateCondition = true;

class SupplyPile extends Pile{
    constructor(props){
        let cardClass = props.cardClass,
            quantity = props.quantity;
        super(props, cardClass, quantity);
        this.state = {
            name: this.state.name,
            card_list: this.state.card_list,
            canSelect: true,
            victory_token: 0,
            debt_token: 0,
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
    setDebtToken(value){
        return new Promise((resolve) =>{
            this.setState(
                prevState => ({
                    debt_token: value,
                }),
                resolve
            );
        })
        
    }
    getDebtToken(){
        return this.state.debt_token;
    }
    toggleSelect(){
        this.popNextCard();
        this.setState(prevState => ({
            canSelect: !prevState.canSelect,
        }));
    }
    render(){
        let topCard = this.getNextCard();
        if(topCard == undefined) topCard = new this.props.cardClass();
        let src = topCard.src,
            quantity = this.getQuantity();
        
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
                    onContextMenu={(e)=>{e.preventDefault();showCard(topCard)}}
                >
                    {this.state.victory_token > 0 
                        && <div className='victory-token'>{this.state.victory_token}</div>}
                    {this.state.debt_token > 0 
                        && <div className='debt-token'>{this.state.debt_token}</div>}
                    {quantity == 0 
                        && <div className='empty' />}
                    <Cost value={topCard.cost.coin}/>
                    <Quantity value={quantity}/>
        </div>
    }
    createMockObject(){
        return {
            name: this.state.name,
            card_list: this.state.card_list.map(c => c.createMockObject(ignoreActivateCondition)),
            victory_token: this.state.victory_token,
            debt_token: this.state.debt_token
        };
    }
    async parseDataFromMockObject(mockObj){
        await super.parseDataFromMockObject(mockObj, ignoreActivateCondition);
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                victory_token: mockObj.victory_token,
                debt_token: mockObj.debt_token
            }),
            resolve);
        });
    }
}
class Cost extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return <div className='cost'>{this.props.value}</div>
    }
}
class Quantity extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return <div className='amount' key={this.props.value}>{this.props.value}</div>
    }
}

function addSupplyPile(pile){
    supplyPileList = supplyPileList.filter(p => p.state.name != pile.state.name);
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