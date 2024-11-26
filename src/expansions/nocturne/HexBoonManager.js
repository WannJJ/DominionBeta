
import { Card } from "../cards";
import { getTableSide} from "../../features/TableSide/TableSide";
import { getBasicStats } from "../../features/PlayerSide/PlayerSide";

import { Druid, Pixie, Tracker, Fool, Bard, BlessedVillage, Idol, SacredGrove, } from "./nocturne";
import { Leprechaun, Skulk, CursedVillage, Tormentor, Vampire, Werewolf } from "./nocturne";
import { TheEarthsGift, TheFieldsGift, TheFlamesGift, TheForestsGift, TheMoonsGift, TheMountainsGift, 
    TheRiversGift, TheSeasGift, TheSkysGift, TheSunsGift, TheSwampsGift, TheWindsGift,  } from "./nocturne_boon";
import { BadOmens, Delusion, Envy, Famine, Fear, Greed, Haunting, Locusts, Misery, Plague, Poverty, War } from "./nocturne_hex";
import { generateCardFromMockObject } from "../../game_logic/GameState";


const BOON = 'Boon', 
    HEX = 'Hex';


class NocturneEffectPileController{
    constructor(name, effectList){
        this.name = name;
        this.type = name;
        this.effectList = effectList;
        this.discardList = [];

        this.component = null;
    }
    registerEffectComponent(component){
        this.component = component;
    }
    getName(){
        return this.name;
    }
    getType(){
        return this.type;
    }
    getQuantity(){
        return this.effectList.length;
    }
    getEffectList(){
        return this.effectList;
    }
    getDiscardList(){
        return this.discardList;
    }

    changeComponentQuantity(){
        let quantity = this.getQuantity();
        if(this.component !== null) this.component.setQuantity(quantity);
    }
    getNextCard(){
        if(this.effectList.length <= 0) this.mixFromDiscard();

        if(this.effectList.length > 0){
            let card =  this.effectList[this.effectList.length - 1];
            return card;
        } 
        return undefined;
    }
    mixFromDiscard(){
        if(this.discardList.length > 0){
            this.discardList.push(...this.effectList);
            this.effectList = this.discardList;
            shuffleArray(this.effectList);
            this.discardList = [];

            this.changeComponentQuantity();
        }
    }
    popNextCard(){
        let effectCard = null;
        if(this.effectList.length <= 0){
            this.mixFromDiscard(); 
        }

        if(this.effectList.length > 0){
            effectCard = this.effectList.pop();
        }

        this.changeComponentQuantity();
        return effectCard;
    }
    return_card(card){ //Use for Horse, Way of the horse,  The River's Gift, Bat/ Vampire, Scrounge
        if(card === undefined || card.name === undefined) return false; 
        this.discardList.push(card);
        if(this.effectList.length <= 0) this.mixFromDiscard();
        this.changeComponentQuantity();
        return true;
    }


    createMockObject(){
        return {
            name: this.name,
            effectList: this.effectList.map(effectCard => effectCard.createMockObject()),
            discardList: this.effectList.map(effectCard => effectCard.createMockObject()),
        };
    }
    parseDataFromMockObject(mockObj){
        if(mockObj === undefined || mockObj.name === undefined || mockObj.name !== this.name || !Array.isArray(mockObj.effectList)){
            console.log(mockObj);   
            throw new Error('INVALID Mock Nocturne Pile');
        }

        for(let effectObj of mockObj.effectList){
            let newEffect = generateCardFromMockObject(effectObj)
            this.effectList.push(newEffect);
        }
        for(let effectObj of mockObj.discardList){
            let newEffect = generateCardFromMockObject(effectObj)
            this.discardList.push(newEffect);
        }        

        this.changeComponentQuantity();
    }


}
/**
 *  Boon Holder is used to hold ['TheFieldsGift', 'TheForestsGift', 'TheRiversGift']
 */
const boonHolder = {
    boonList: [],
    getBoonList: function(){
        return this.boonList;
    },
    addBoon: function(boonCard){
        this.boonList.push(boonCard);
    },
    getLength: function(){
        return this.boonList.length;
    },
    pop: function(){
        return this.boonList.pop();
    },
    createMockObject: function(){
        return {
            boonList: this.boonList.map(effectCard => effectCard.createMockObject()),
        };
    },
    parseDataFromMockObject: function(mockObj){
        if(mockObj === undefined || !Array.isArray(mockObj.boonList)){
            console.warn(mockObj);   
            throw new Error('INVALID Mock Nocturne Pile');
        }
        for(let effectObj of mockObj.boonList){
            let newEffect = generateCardFromMockObject(effectObj)
            this.boonList.push(newEffect);
        }
    }
}

const stateHolder = {
    stateList: [],
    getStateList: function(){
        return this.stateList;
    },
    changeComponent: function(){
        getBasicStats().setStateList(this.stateList);
    },
    addState: function(state){
        if((state === undefined || state.id === undefined)) return;
        this.stateList.push(state);
        this.changeComponent();
    },
    getStateByName: function(name){
        for(let state of this.stateList){
            if(state.name === name){
                return state;
            }
        }
    },
    has_card: function(crit_func){
        if(this.stateList.length <= 0){return false;}
        for(let i=0; i<this.stateList.length; i++){
            let card = this.stateList[i];
            if(crit_func(card)){return true;}
        }
        return false;
    },
    removeState: function(state){
        if(state === undefined || state.id === undefined) return undefined;
        let index = this.stateList.indexOf(state);
        if(index !== -1){
            this.stateList.splice(index, 1); 
        }
        this.changeComponent();
    },
    createMockObject: function(){
        return {
            stateList: this.stateList.map(effectCard => effectCard.createMockObject()),
        };
    },
    parseDataFromMockObject: function(mockObj){
        if(mockObj === undefined || !Array.isArray(mockObj.stateList)){
            console.warn(mockObj);   
            throw new Error('INVALID Mock State Holder');
        }
        for(let effectObj of mockObj.stateList){
            let newEffect = generateCardFromMockObject(effectObj)
            this.stateList.push(newEffect);
        }
        this.changeComponent();
    }
};

const boonPileObject = null;
const hexPileObject = null;

const HexBoonManager = {
    boonPile : null,
    hexPile: null,
    boonHolder: boonHolder,
    stateHolder: stateHolder,
    setHexBoonPile: async function(playCardClassList){
        const fate_cards = [Druid, Pixie, Tracker, Fool, Bard, BlessedVillage, Idol, SacredGrove,];
        const doom_cards = [Leprechaun, Skulk, CursedVillage, Tormentor, Vampire, Werewolf];
        const pileList = [];
        if(fate_cards.find(card => playCardClassList.includes(card))){
            this.setBoonPile();
            pileList.push(this.boonPile);
        }
        if(doom_cards.find(card => playCardClassList.includes(card))){
            this.setHexPile();
            pileList.push(this.hexPile);
        }

        if(pileList.length > 0){
            await getTableSide().setHexBoonPileList(pileList);
        }
    },
    getBoonPile: function(){
        return this.boonPile;
    },
    setBoonPile: function(){
        const boonClassList = [TheFieldsGift, TheFlamesGift, TheRiversGift, TheForestsGift, TheSunsGift, TheSwampsGift, TheWindsGift, TheEarthsGift, TheMountainsGift, TheSeasGift, TheSkysGift, TheMoonsGift, ];
        const boonList = boonClassList.map(effectClass => new effectClass());
        shuffleArray(boonList);

        this.boonPile = new NocturneEffectPileController(BOON, boonList);
    },
    getHexPile: function(){
        return this.hexPile;
    },
    setHexPile: function(){
        const hexClassList = [BadOmens, Misery, Delusion, Envy, Famine, Fear, Greed, Haunting, Locusts, Plague, Poverty, War];
        const hexList = hexClassList.map(effectClass => new effectClass());
        shuffleArray(hexList);

        this.hexPile = new NocturneEffectPileController(HEX, hexList);
    },
    getBoonHolder: function(){
        return this.boonHolder;
    },
    getStateHolder: function(){
        return this.stateHolder;
    },
    getNextBoon: function(){
        if(this.boonPile === null) return;
        return this.boonPile.getNextCard();
    },
    receiveBoon: async function(){
        if(this.boonPile === null) return;
        let boonEffect = this.boonPile.popNextCard();
        if(boonEffect !== null){
            await boonEffect.is_received();

            if(['TheFieldsGift', 'TheForestsGift', 'TheRiversGift'].includes(boonEffect.name)){
                this.boonHolder.addBoon(boonEffect);
            } else{
                this.boonPile.return_card(boonEffect);
            }
        }
        return boonEffect;
    },
    getNextHex: function(){
        if(this.hexPile === null) return;
        return this.hexPile.getNextCard();
    },
    receiveHex: async function(){
        if(this.hexPile === null) return;
        let hexEffect = this.hexPile.popNextCard();
        if(hexEffect !== null){
            await hexEffect.is_received();
            this.hexPile.return_card(hexEffect);
        }
        return hexEffect;
    },
    returnAllBoon: function(){ 
        while(this.boonHolder.getLength() > 0){
            let boonCard = this.boonHolder.pop();
            if(boonCard !== undefined) this.boonPile.return_card(boonCard);
        }
    },
    createMockObject: function(){
        return {
            boonPile: this.boonPile===null?null:this.boonPile.createMockObject(),
            hexPile: this.hexPile===null?null:this.hexPile.createMockObject(),
            boonHolder: this.boonHolder.createMockObject(),
            stateHolder: this.stateHolder.createMockObject(),
        };
    },
    parseDataFromMockObjectOwn: function(mockObj){
        if(mockObj === undefined || mockObj.boonPile === undefined || mockObj.hexPile === undefined
            || mockObj.boonHolder === undefined || mockObj.stateHolder === undefined){
            throw new Error('INVALID Mock HexBoonManager');
        }
        if(mockObj.boonPile !== null && this.boonPile !== null){
            this.boonPile.parseDataFromMockObject(mockObj.boonPile);
        }
        if(mockObj.hexPile !== null && this.hexPile !== null){
            this.hexPile.parseDataFromMockObject(mockObj.hexPile);
        }
        this.boonHolder.parseDataFromMockObject(mockObj.boonHolder);
        this.stateHolder.parseDataFromMockObject(mockObj.stateHolder);
    },
    parseDataFromMockObjectGeneral: function(mockObj){
        if(mockObj === undefined || mockObj.boonPile === undefined || mockObj.hexPile === undefined){
            throw new Error('INVALID Mock HexBoonManager');
        }
        if(mockObj.boonPile !== null && this.boonPile !== null){
            this.boonPile.parseDataFromMockObject(mockObj.boonPile);
        }
        if(mockObj.hexPile !== null && this.hexPile !== null){
            this.hexPile.parseDataFromMockObject(mockObj.hexPile);
        }
    },
};


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


export {HexBoonManager, boonHolder, stateHolder};