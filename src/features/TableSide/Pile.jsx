import React from 'react';
import { getClassFromName } from '../../setup';
import { RootCard } from '../../expansions/cards';
import { showCard } from '../../Components/display_helper/CardDisplay';
import { cancelShowCardList, showCardList } from '../../Components/display_helper/DeckDisplay';

const ignoreActivateCondition = true;

class Pile extends React.Component{
    constructor(props, cardClass=null, quantity=1, cardList=[], name_=''){
        super(props);
        
        let card_list = [],
            name = '';
        this.isSplitPile = false;
        
        if(cardClass){
            card_list = [];
            quantity = new cardClass().getInitAmount();
            for(let i=0; i<quantity; i++){
                card_list.push(new cardClass());
            }
            let card = card_list[card_list.length - 1];
            name = card.name;
        } else{
            card_list = cardList;
            name = name_;
        }
        
        this.state = {
            name: name,
            card_list: card_list,
            canSelect: true,
        }   
        this.originalCardNames = new Set(card_list.map(card => card.name));
        this.representCard = card_list[card_list.length - 1];
        this.isSplitPile = this.originalCardNames.size > 1;
        //this.originalCardList = card_list.map(card => card);
    }
    async setup(player){
        let topCard = this.getNextCard();
        if(!topCard) return;
        topCard.setPlayer(player);
        await topCard.setup();
    }
    getName(){
        /*
        let topCard = this.getNextCard();
        if(!topCard) return this.state.name;
        return topCard.name;
        */
        return this.state.name;
    }
    getQuantity(){
        return this.state.card_list.length;
    }
    getNextCard(){
        if(this.state.card_list.length > 0){
            let card =  this.state.card_list[this.state.card_list.length - 1];
            return card;
        }
        return undefined;
    }
    getCost(){
        let topCard = this.getNextCard();
        if(!topCard) return undefined;
        return topCard.cost;
    }
    getType(){
        let topCard = this.getNextCard();
        if(!topCard) return [];
        return topCard.type;
    }
    getCardAll(){
        return this.state.card_list;
    }
    popNextCard(){
        if(this.getQuantity() <= 0) return undefined;
        let card_list = this.state.card_list;
        if(card_list.length > 0){
            return new Promise((resolve) =>{
                    let card = card_list.pop();
                    this.setState(prevState =>({
                            card_list: card_list,
                            quantity: card_list.length,
                        }),
                        ()=>{resolve(card)},
                    );
                    return card;
            });
        }
        
        return undefined;
    }
    gain_card(player){
        if(this.getQuantity() <= 0 || !player) return undefined;
        let new_card = this.popNextCard(player);
        new_card.setPlayer(player);
        return new_card;
    }
    showCardList(shuffle=false){
        let topCard = this.getNextCard();
        if(!topCard) topCard = this.representCard;

        if(this.isSplitPile){
            /*
            let cardList = [...this.originalCardNames].map(cardName => getClassFromName(cardName))
                                                .map(cardClass => new cardClass());
            showCardList(cardList);
            */
            showCardList(this.state.card_list, shuffle);
            window.onclick = function(){
                cancelShowCardList();
                window.onclick = null;
            }
        } else{
            showCard(topCard);
        }
    }
    return_card(card){ //Use for Horse, Way of the horse,  The River's Gift, Bat/ Vampire, Scrounge, Encampment
        if(!this.isOriginOf(card)) throw new Error('');
        let card_list = this.state.card_list; 
        //card_list.unshift(card);
        card_list.push(card);

        return new Promise((resolve) =>{
            this.setState(prevState =>({
                card_list: card_list,
            }), 
            resolve(card));
        });
    }
    /***
     * Check if card originates from this.pile
     */
    isOriginOf(card){ // Use for Search, Tower, Obelisk
        if(!(card instanceof RootCard)) return false;
        return this.originalCardNames.has(card.name);
        //return this.originalCardList.map(card => card.name).includes(card.name);
    }
    createMockObject(){
        return {
            name: this.state.name,
            card_list: this.state.card_list.map(c => c.createMockObject(ignoreActivateCondition)),
        };
    }
    parseDataFromMockObject(mockObj){
        
        if(!mockObj|| !mockObj.name || mockObj.name !== this.state.name || !Array.isArray(mockObj.card_list)){
            console.error(mockObj);   
            throw new Error('INVALID Mock Pile');
        }
        return new Promise((resolve) =>{
            this.setState(prevState =>({    
                card_list: mockObj.card_list.map(mockCard => {
                    let new_card_class = getClassFromName(mockCard.name);
                    let new_card = new new_card_class();
                    new_card.parseDataFromMockObject(mockCard, ignoreActivateCondition);
                    return new_card;
                })
            }),
            resolve);
        });
        
    }
}

export{Pile};