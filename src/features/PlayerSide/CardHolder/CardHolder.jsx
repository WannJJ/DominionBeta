import React from 'react';
import { RootCard } from '../../../expansions/cards.js';
import {Card} from './Card.jsx';
//import { getClassFromName } from '../../../setup.js';


const SELECT_TRASH = 'trash',
    SELECT_CHOOSE = 'choose',
    SELECT_DISCARD = 'discard';
var hand = null,
    playField = null;


class CardHolder extends React.Component{
    constructor(props, id=''){
        super(props);
        this.id = id;
        this.state = {
            cards: [],
            selectType: SELECT_CHOOSE,
            unclick: false,
            filterFunc: null,
            onClickFunc: null,
        }
        this.selectedList = [];
    }
    addCard(card){
        if(!(card instanceof RootCard)){
            throw new Error('INVALID Card');
        }
        if(this.hasCardId(card.id)) return false;
        return new Promise((resolve) => {
            this.setState(prevState =>({
                cards: this.arrange([...prevState.cards, card]),
            }), resolve);
        });
    }
    add_card(card){
        if((Array.isArray(card))){
            this.add_card_list(card);
        }
        else{
            if(card==undefined || card.name==undefined || card.type==undefined || card.id==undefined){
                throw new Error('INVALID Card');
            }
            if(!this.hasCardId(card.id)){
                this.setState(prevState =>({
                    cards: [...prevState.cards, card],
                }));
            }
        }
    }
    addCardList(card_list){
        if(!Array.isArray(card_list)) alert('INVALID CARD LIST');
        let addedArray = [];
        for(let i=0; i<card_list.length; i++){
            let card = card_list[i];
            if(!(card instanceof RootCard)) throw new Error('INVALID CARD');
            if(this.hasCardId(card.id)) continue;
            addedArray.push(card);
        }
        return new Promise((resolve)=>{
            this.setState(prevState =>({
                cards: [...prevState.cards, ...addedArray],
            }), resolve);
        });
        
    }
    getLength(){
        return this.state.cards.length;
    }
    length(){
        return this.state.cards.length;
    }
    pop(){
        let card_list = this.state.cards;
        let card = card_list.pop();
        return new Promise((resolve) => {
            this.setState(prevState =>({
                cards: card_list,
            }),
            ()=>{resolve(card)}
            );
        })
    }
    has_card(crit_func){
        if(this.getLength() <= 0){return false;}
        for(let i=0; i<this.state.cards.length; i++){
            let card = this.state.cards[i];
            if(crit_func(card)){return true;}
        }
        return false;
    }
    getCardByQuery(crit_func){
        if(this.getLength() <= 0){return undefined;}
        for(let i=0; i<this.state.cards.length; i++){
            let card = this.state.cards[i];
            if(crit_func(card)){return card;}
        }
        return undefined;
    }
    remove(card){
        if(card == undefined || card.id == undefined) return undefined;
        let card_list = this.state.cards;
        let index = card_list.indexOf(card);
        if (index == -1) {
            index = card_list.map(c => c.id).indexOf(card.id);
            if(index == -1){
                return undefined;
            } else{
                card_list.splice(index, 1);
            }
        }
        else{
            card_list.splice(index, 1); 
        }
        return new Promise((resolve) => {
            this.setState(
                prevState =>({
                    cards: [...card_list],
                }),
                ()=>{resolve(card)},
            );
        })
    }
    getCardAll(){
        return this.state.cards;
    }
    setCardAll(card_list){
        if(!Array.isArray(card_list)) return;
        return new Promise((resolve) =>{
            this.setState(prevState => ({
                cards: card_list,
            }),
            resolve);
        });
    }
    hasCardId(id){
        for(let card of this.state.cards){
            if(card.id == id){
                return true;
            }
        }
        return false;
    }
    getCardById(id){
        for(let card of this.state.cards){
            if(card.id == id){
                return card;
            }
        }
        return undefined;
    }
    removeCardById(id){
        let card = this.getCardById(id);
        if(card != undefined){
            this.remove(card);
        }
        return card;
    }
    makeSelection(card){
        this.selectedList.push(card);
    }
    cancelSelection(card){
        this.selectedList = this.selectedList.filter(c => c != card);
    }
    onContextMenuFunction(){}
    async onChildClickFunction(card){
        await new Promise((resolve) =>{
            this.forceUpdate(resolve);
        });
        await this.state.onClickFunc(card);
    }
    arrange(cardList){
        return cardList;
    }
    render(){
        let card_list = this.state.cards.map(
            (c, index) => <Card card={c} 
                                key={c.id} 
                                selectType={this.state.selectType}
                                filterFunc={this.state.filterFunc}
                                onClickFunc={this.onChildClickFunction.bind(this)}
                                canUnclick={this.state.unclick}
                                makeSelection={this.makeSelection.bind(this)}
                                cancelSelection={this.cancelSelection.bind(this)}
                            />);
        return <div id={this.id}
                onContextMenu={this.onContextMenuFunction.bind(this)}>
                {card_list}
            </div>
    }
    mark_cards(filterFunc, onClickFunc, selectType=SELECT_CHOOSE, unclick=false){
        this.selectedList = [];
        if(!this.has_card(filterFunc)) return false;
        this.setState({
            filterFunc: filterFunc,
            unclick: unclick,
            onClickFunc: onClickFunc,
            selectType: selectType,
        })
        return true;
    }
    remove_mark(){
        //this.selectedList = [];
        return new Promise(resolve =>{
            this.setState(prevState => ({
                filterFunc: null,
                onClickFunc: null,
                selectType: '',
            }),
            resolve);
        });
        
    }
    getSelectedList(){
        return this.selectedList;
    }
    createMockObject(){
        let card_list = [];
        for(let card of this.state.cards){
            if(!card instanceof RootCard) alert('INVALID Card in cardHolder');
            card_list.push(card.createMockObject());
        }
        return {type: this.id,
            name: this.constructor.name,
            cards: card_list};
    }
    async parseDataFromMockObject(mockObj){
        if(mockObj == undefined || mockObj.cards == undefined || mockObj.type == undefined){
            throw new Error('INVALID Mock Card Holder');
        }
        let card_list = [];
        if(CardHolder.generateCardFromMockObject != undefined){
            for(let cardObj of mockObj.cards){
                let new_card = CardHolder.generateCardFromMockObject(cardObj);
                card_list.push(new_card);
            }
        }
        await this.setCardAll(card_list);
    }
}
class PlayField extends CardHolder{
    constructor(props){
        super(props, 'play-field');
        playField = this;
    }
  }
class Hand extends CardHolder{
    constructor(props){
        super(props, 'hand');
        hand = this;
    }
    arrange(cardList){
        cardList.sort((a, b) =>{
            if((a.type.includes('Action')&&b.type.includes('Action')) ||
                (a.type.includes('Treasure')&&b.type.includes('Treasure')) ||
                (a.type.includes('Night')&&b.type.includes('Night')) ||
                (a.type.includes('Reaction')&&b.type.includes('Reaction'))) return a.cost.coin - b.cost.coin;
            if(a.type.includes('Action')){
                return -1;
            } else if(b.type.includes('Action')){
                return 1;
            } else if(a.type.includes('Treasure')){
                return -1;
            } else if(b.type.includes('Treasure')){
                return 1;
            } else if(a.type.includes('Night')){
                return -1;
            } else if(b.type.includes('Night')){
                return 1;
            } else if(a.type.includes('Reaction')){
                return -1;
            } else if(b.type.includes('Reaction')){
                return 1;
            }
            return a.cost.coin - b.cost.coin;
        });
        return cardList;
    }
    onContextMenuFunction(){
        return;
        /*
        if(this.state.filterFunc == null){        
        this.mark_cards(
            function(card){
                return this.selectedList.length < 2;
            }.bind(this),
            function(card){
                if(this.selectedList.length == 3) {
                    let selectedList = this.selectedList;
                    this.remove_mark();
                    let id = setInterval(()=>{
                        let c = selectedList.shift();
                        if(selectedList.length == 0) clearInterval(id);
                    }, 2000);
                }
            }.bind(this),
            'trash',
            true,
        );
        } else {
            this.remove_mark();
        }
        */
    }    
}

function getPlayField(){
    return playField;
}
function getHand(){
    return hand;
}
export {CardHolder, PlayField, Hand, Card, getPlayField, getHand};