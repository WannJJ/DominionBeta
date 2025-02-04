
import basicCardsData from "./cardsData/basicCardsData";
import baseCardsData from "./cardsData/baseCardsData";
import seasideCardsData from "./cardsData/seasideCardsData";
import menagerieCardsData from "./cardsData/menagerieCardsData";
import empiresCardsData from "./cardsData/empiresCardsData";
import darkAgesCardsData from "./cardsData/darkAgesCardsData";
import nocturneCardsData from "./cardsData/nocturneCardsData";
import plunderCardsData from "./cardsData/plunderCardsData";

import { getClassFromName } from "../setup";

const allCardsData = [...basicCardsData.cards, ...baseCardsData.cards, ...seasideCardsData.cards, 
    ...menagerieCardsData.cards, ...empiresCardsData.cards, ...darkAgesCardsData.cards,
    ...nocturneCardsData.cards, ...plunderCardsData.cards];

export function test(){
    for(let cardData of allCardsData){
        let name = cardData.name;
        let cardClass = getClassFromName(name),
            card = null;
        try{
            card = new cardClass();
        } catch{
            console.log("Card name not found", name);
        } 
        let haveCost = false;
        
        //compare type
        for(let typ of card.type){
            if(!cardData.type.includes(typ)){
                console.log("wrong type", name, typ);
            }
            if(typ==='Action' || typ==="Treasure" || typ==="Victory" || typ==="Event"){
                haveCost = true;
            }
        }

        //compare cost
        if(haveCost){
            if(card.cost.coin !== cardData.cost.coin || card.cost.debt !== cardData.cost.debt){
                console.log("wrong cost", name, cardData.cost);
            }
        }

    }


    console.info('Cards data test success');

}
