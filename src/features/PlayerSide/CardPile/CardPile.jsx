import React from 'react';
import Tooltip from '@mui/material/Tooltip';

import './CardPile.css';
import { RootCard } from '../../../expansions/cards.js';
import { showCardList, cancelShowCardList } from '../../../Components/display_helper/DeckDisplay.jsx';


let discard = null,
    deck = null,
    trash = null;

class CardPile extends React.Component{
    constructor(props, id='', src=''){
        super(props);
        this.id = id;
        this.state = {
            id: id,
            src: src,
            cards: [],
            canBeSelected: false,
        };
        this.onClickFunction = null;// function(){console.log('hallo')};
    }
    addCard(card){
        if(!(card instanceof RootCard)){
            throw new Error('INVALID Card');
        }
        if(this.hasCardId(card.id)) return false;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                    cards: [...prevState.cards, card],
                }),
                ()=>{resolve(true)},
            );
        });
    }
    add_card(card){
        if((Array.isArray(card))){
            this.add_card_list(card);
        }
        else{
            if(!card|| !card.name|| !card.type|| card.id == undefined){
                console.warn(card)
                throw new Error('INVALID Card');
            }
            if(!this.hasCardId(card.id)){
                return new Promise((resolve)=>{
                    this.setState(prevState =>({
                        cards: [...prevState.cards, card],
                    }),
                    resolve);
                })
                
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
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                    cards: [...prevState.cards, ...addedArray],
                }),
                resolve,
            );
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
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                    cards: card_list,
                }),
                ()=>{resolve(card)},
            );
        });
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
        if(!card || card.id == undefined) return undefined;
        let card_list = this.state.cards;
        let index = card_list.indexOf(card);
        if (index === -1) {
            index = card_list.map(c => c.id).indexOf(card.id);
            if(index === -1){
                return undefined;
            } else{
                card_list.splice(index, 1);
            }
        }
        else{
            card_list.splice(index, 1); 
        }
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                    cards: [...card_list],
                }),
                ()=>{resolve(card)},
            );
        });
    }
    getTopCard(){
        let len = this.length();
        if(len <= 0) return undefined;
        return this.state.cards[len - 1];
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
                resolve,
            );
        });
    }
    hasCardId(id){
        for(let card of this.state.cards){
            if(card.id === id){
                return true;
            }
        }
        return false;
    }
    getCardById(id){
        for(let card of this.state.cards){
            if(card.id === id){
                return card;
            }
        }
        return undefined;
    }
    async removeCardById(id){
        let card = this.getCardById(id);
        let removed = undefined;
        if(card){
            removed = await this.remove(card);
        }
        return removed;
    }
    setCanSelect(callback, canSelect=true){
        this.onClickFunction = callback;
        this.setState({
            canBeSelected: canSelect,
        });
    }
    removeCanSelect(){
        this.onClickFunction = null;
        this.setState({
            canBeSelected: false,
        })
    }
    onClickEvent(e){
        let callback = this.onClickFunction;
        this.removeCanSelect();
        if(callback){
            callback();
        }
    }

    render(){
        return <Tooltip title={this.state.id.toUpperCase()} followCursor leaveDelay={200}>
                    <div id={this.state.id} 
                            style={{
                                backgroundImage: `url(${this.state.src})`,
                                ...(this.state.canBeSelected && {
                                    //boxShadow: "inset 0px 0px 5vh 0.1vh cyan, 0px 0px 5vh 0.1vh cyan",
                                    animation: 'canBeSelected 1s infinite',
                                }),
                            }}
                            onClick={e => this.onClickEvent(e)}
                            onMouseEnter={()=>{showCardList(this.state.cards)}}
                            onMouseLeave={()=>{cancelShowCardList()}}>
                    <div className="cards-count">{this.state.cards.length}</div>
                </div>
            </Tooltip>
    }
    createMockObject(ignoreActivateCondition=true){
        let card_list = [];
        for(let card of this.state.cards){
            if(!(card instanceof RootCard)) alert('INVALID Card in CardPile');
            card_list.push(card.createMockObject(ignoreActivateCondition));
        }
        return {type: this.state.id,
            name: this.constructor.name,
            cards: card_list};
    }
    //async parseDataFromMockObject(mockObj, player, ignoreActivateCondition=true){
    async parseDataFromMockObject(mockObj, ignoreActivateCondition=true){
        if(!mockObj || !mockObj.cards || !mockObj.type){
            throw new Error('INVALID Mock Card Pile');
        }
        let card_list = [];
        if(CardPile.generateCardFromMockObject){
            for(let cardObj of mockObj.cards){  
                let new_card = CardPile.generateCardFromMockObject(cardObj, ignoreActivateCondition); 
                card_list.push(new_card);
            }
        } 

        await this.setCardAll(card_list);
    }
}
class Discard extends CardPile{
    constructor(props){
        super(props, 'discard');
        discard = this;
    }
    static getDerivedStateFromProps(props, state) {
        let len = state.cards.length;
        return {
            id: 'discard',
            src: len>0?state.cards[len-1].src:'',
            cards: state.cards,
        };
    }
}
class Deck extends CardPile{
    constructor(props){
        super(props, 'deck', './img/Basic/Back.JPG');
        /*
        this.state = {
            id: 'deck',
            src: './img/Basic/Back.JPG',
            cards: [],
        }
            */
        deck = this;
    }
    static getDerivedStateFromProps(props, state) {
        let len = state.cards.length;
        return {
            id: 'deck',
            src: len>0?'./img/Basic/Back.JPG':'',
            cards: state.cards,
        };
    }
    async topDeck(card){
        await this.addCard(card);
    }
    bottomDeck(card){
        if(!(card instanceof RootCard)){
            throw new Error('INVALID Card');
        }
        if(this.hasCardId(card.id)) return false;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                    cards: [card, ...prevState.cards],
                }),
                ()=>{resolve(true)},
            );
        })
    }
    shuffleDeck(){ //use for Famine, Annex, Donate
        throw new Error('Khong dung shuffle deck nua');
        let cardList = this.state.cards;
        if(cardList.length === 0) return;
        for (let i = cardList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
        }
        return new Promise((resolve) =>{
            this.setState(
                prevState => ({cards: cardList}),
                ()=>{resolve(true)},
            )
        });
    }
}
class Trash extends CardPile{
    constructor(props){
        super(props, 'trash', './img/Basic/Trash.png');
        /*
        this.state = {
            id: 'trash',
            src: './img/Basic/Trash.png',
            cards: [],
        }
            */
        trash = this;
    }
}

function getDiscard(){
    return discard;
}
function getDeck(){
    return deck;
}
function getTrash(){
    return trash;
}

export{CardPile, Discard, Deck, Trash, getDiscard, getDeck, getTrash};