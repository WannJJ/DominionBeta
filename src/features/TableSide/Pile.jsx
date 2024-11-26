import React from 'react';
import { getClassFromName } from '../../setup';

const ignoreActivateCondition = true;

class Pile extends React.   Component{
    constructor(props, cardClass=null, quantity=1, cardList=[], name_=''){
        super(props);
        let card_list = [],
            name = '';
        if(cardClass!=null){
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
        
        
    }
    setup(player){
        let topCard = this.getNextCard();
        if(topCard === undefined) return;
        topCard.setPlayer(player);
        topCard.setup();
    }
    getName(){
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
        if(topCard === undefined) return undefined;
        return topCard.cost;
    }
    getType(){
        let topCard = this.getNextCard();
        if(topCard === undefined) return [];
        return topCard.type;
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
        if(this.getQuantity() <= 0 || player===undefined) return undefined;
        let new_card = this.popNextCard(player);
        new_card.setPlayer(player);
        return new_card;
    }
    return_card(card){ //Use for Horse, Way of the horse,  The River's Gift, Bat/ Vampire, Scrounge
        if(card === undefined || card.name === undefined) return;
        let card_list = this.state.card_list; 
        card_list.unshift(card);
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                card_list: card_list,
            }), 
            resolve(card));
        });
    }
    createMockObject(){
        return {
            name: this.state.name,
            card_list: this.state.card_list.map(c => c.createMockObject(ignoreActivateCondition)),
        };
    }
    parseDataFromMockObject(mockObj){
        
        if(mockObj === undefined || mockObj.name === undefined || mockObj.name !== this.state.name || !Array.isArray(mockObj.card_list)){
            console.log(mockObj);   
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