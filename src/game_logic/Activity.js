import { Cost } from "../expansions/cards";
import { Logger, getLogger } from "../Components/Logger";
import { GameState, getGameState } from "./GameState";
import { getPlayField, getHand } from "../features/PlayerSide/CardHolder/CardHolder";
import { getButtonPanel } from "../features/PlayerSide/ButtonPanel";
import { getDiscard, getDeck, getTrash } from "../features/PlayerSide/CardPile/CardPile";
import { getBasicStats } from "../features/PlayerSide/PlayerSide";
import { getPlayArea, getExile, getSetAside } from "../features/PlayerSide/BottomLeftCorner/SideArea";
import { getPlayer } from "../player";
import { findSupplyPile } from "../features/TableSide/SupplyPile";
import { findNonSupplyPile } from "../features/TableSide/NonSupplyPile";
import { report_save_activity, report_save_activity2 } from "./report_save_activity";

import audioManager from "../Audio/audioManager";
import { opponentManager } from "../features/OpponentSide/Opponent";
import { reactionEffectManager } from "./ReactionEffectManager";
import { HexBoonManager, stateHolder } from "../expansions/nocturne/HexBoonManager";
import { getClassFromName } from "../setup";




const  ACTIVITY_PLAY = 'Play',
        ACTIVITY_BUY = 'Buy',
        ACTIVITY_GAIN = 'Gain',
        ACTIVITY_BUY_GAIN = 'Buy and Gain',
        ACTIVITY_EXILE = 'Exile',
        ACTIVITY_RECEIVE = 'Receive',     
        ACTIVITY_DISCARD = 'Discard',
        ACTIVITY_TRASH = 'Trash',
        ACTIVITY_REVEAL = 'Reveal',
        ACTIVITY_DRAW = 'Draw',
        ACTIVITY_SHUFFLE = 'Shuffle',
        ACTIVITY_AUTOPLAY_TREASURES = 'Autoplay Treasures',
        ACTIVITY_ATTACK = 'Attack',
        ACTIVITY_END_REACT = 'END_REACT',
        ACTIVITY_ACTIVATE = 'Activate',
        ACTIVITY_SET_ASIDE = 'Set aside';

const PHASE_ACTION = 'action',
        PHASE_BUY = 'buy',
        PHASE_NIGHT = 'night',
        PHASE_REACTION = 'reaction',
        PHASE_WAITING = 'waiting',
        PHASE_START_TURN = 'start turn',
        PHASE_CLEAN_UP = 'clean up',
        PHASE_END_TURN = 'end turn';

class Activity{
    current = null;
    constructor(username, name, card=null, card_list=[]){
        this.username = username;
        this.name = name;
        this.card = card;
        this.card_list = card_list;
        this.child_activity_list = [];
        this.origin = Activity.current; // 'Play in action phase, Play in buy phase, Buy in buy phase, Gain in buy phase, Play in night phase, other Activity, ...'
        Activity.current = this;
    }
    getCard(){
        return this.card;
    }
    getCardList(){
        return this.card_list;
    }
    createMockObject(){
        return {
            username: this.username,
            name: this.name,
            card: this.card.createMockObject(),
            card_list: this.card_list.map(card => card.createMockObject()),
        }
    }
}


async function draw1(){ 
    //draw 1 card from deck
    let new_card = undefined;
    if(getDeck().length() <= 0){
        await mix_discard_to_deck();
    }
    if(getDeck().length() > 0){
        new_card = await getDeck().pop();
        await getHand().addCard(new_card);
        report_save_activity(ACTIVITY_DRAW, new_card);
    }
    return new_card;
}  
async function drawNCards(n){
    let cardList = [], 
        newCard = null;
    let deck = getDeck(),
        discard = getDiscard(),
        hand = getHand();
    if(n <= 0) return cardList;
    while(n > 0 && deck.length() > 0){
        newCard = await deck.pop();
        await hand.addCard(newCard);
        cardList.push(newCard);
        n -= 1;
    }
    if(cardList.length > 0){
        report_save_activity(ACTIVITY_DRAW, null, cardList);
        cardList = [];
    } 

    if(n > 0 && deck.length() <= 0 && discard.length() > 0) {
        await mix_discard_to_deck();
    }
    while(n > 0 && deck.length() > 0){
        newCard = await deck.pop();
        await hand.addCard(newCard);
        cardList.push(newCard);
        n -= 1;
    }
    if(cardList.length > 0) report_save_activity(ACTIVITY_DRAW, null, cardList);
    return cardList;
}
async function mix_discard_to_deck(){
    if(getDiscard().length() > 0){
        await report_save_activity(ACTIVITY_SHUFFLE, undefined);
        let addedCards = getDiscard().getCardAll()
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
        
        await getDeck().setCardAll([...addedCards, ...getDeck().getCardAll()]);
        await getDiscard().setCardAll([]);
        audioManager.playSound('shuffle');
        //TODO: solve effects when shuffling
        //await reactionEffectManager.solve_cards_when_shuffle();
    }
}
async function play_card(card, play_in_playField=true){
    if(play_in_playField){
        await getPlayField().addCard(card);
    }    
    report_save_activity(ACTIVITY_PLAY, card);
    getLogger().indent_();
    // do the card's job
    await card.play();
    await report_save_activity2(ACTIVITY_PLAY, card); 
    getLogger().deindent();
    await reactionEffectManager.solve_cards_when_play(card);
}
async function playCard(card){
    report_save_activity(ACTIVITY_PLAY, card);
    getLogger().indent_();
    // do the card's job
    await card.play();
    await report_save_activity2(ACTIVITY_PLAY, card); 
    getLogger().deindent();
}
async function playCardInPlayField(card){
    await getPlayField().addCard(card);
    await playCard(card);
}
async function playCardFromHandInPlayField(card){
    let removed = await getHand().remove(card);
    if(removed == undefined) return;
    await playCardInPlayField(card);
}
async function autoplay_treasures(){
    let treasure_list = [];
    let totalValue = 0;
    getPlayer().move += 1;

    for(let i=0; i<getHand().length(); i++){
        let card = getHand().getCardAll()[i];
        if(card.type.includes('Treasure') && ['Copper', 'Silver', 'Gold', 'Platinum'].includes(card.name)){
            treasure_list.push(card);
            totalValue += card.value;
        }
    }
    if(treasure_list.length > 0){
        report_save_activity(ACTIVITY_AUTOPLAY_TREASURES, null, treasure_list, `(+$${totalValue})`);
        getLogger().indent_();

        for(let i=0; i<treasure_list.length; i++){
            let card = treasure_list[i];
            await getHand().remove(card);
            await getPlayField().addCard(card)
            await card.play();
            await reactionEffectManager.solve_cards_when_play(card);
        }
        getLogger().deindent();
        await report_save_activity2(ACTIVITY_AUTOPLAY_TREASURES, treasure_list);  
    }
    //getGameState().update_state();
    getPlayer().update_buy_phase();
}
async function pay_cost_when_buy(cost){
    let property = new Cost(getBasicStats().getCoin() + getBasicStats().getCoffer(), 0);
    if( getBasicStats().getDebt() > 0 || !property.sufficientToBuy(cost)){
         throw new Error("ERROR BUYING"); 
    }
    getBasicStats().addBuy(-1);
    if(getBasicStats().getCoin() >= cost.getCoin()){
        await getBasicStats().setCoin(getBasicStats().getCoin() - cost.getCoin());
    }else{
        await getBasicStats().setCoffer(getBasicStats().getCoffer() - cost.getCoin() + getBasicStats().getCoin());
        await getBasicStats().setCoin(0);            
    }   

    await getBasicStats().addDebt(cost.getDebt());     
}
//DEPRECATED
async function buy_card(pile, to_discard=true){//TODO
    if(getPlayer().phase != "buy" || getBasicStats().buy<=0 || pile.getQuantity() <=0) {return false;}
    await pay_cost_when_buy(pile.getCost());
    let new_card = await pile.popNextCard();
    new_card.setPlayer(getPlayer());
    report_save_activity('Buy', new_card);
    getLogger().indent_();
    await new_card.is_buyed();
    getLogger().deindent();
    await report_save_activity2('Buy', new_card);
    await gain_card(pile, to_discard); 
    if(getBasicStats().getBuy() <= 0){
        await getPlayer().end_buy_phase();
    }
    else{
        getPlayer().update_buy_phase();
    }  
}  
async function buy_landscape_card(effect_card){
    if(getPlayer().phase != PHASE_BUY || getBasicStats().buy<=0 ) {return false;}
    await pay_cost_when_buy(effect_card.cost);

    report_save_activity(ACTIVITY_BUY, effect_card);
    getLogger().indent_();
    await effect_card.is_buyed();
    getLogger().deindent();
    await report_save_activity2(ACTIVITY_BUY, effect_card);
} 
async function gain_card(pile, to_discard=true){
    if(pile==undefined || pile.getQuantity()==undefined || pile.getQuantity()<=0) {return undefined;}
    let new_card = await pile.popNextCard();
    new_card.setPlayer(getPlayer());
    if(new_card == undefined) alert('INVALID GAIN');
    report_save_activity(ACTIVITY_GAIN, new_card);
    getLogger().indent_();

    await new_card.is_gained();
    getPlayer().all_cards.push(new_card);
    
    if(getExile().length() > 0 && getExile().has_card(c => c.name==new_card.name)){
        await remove_from_exile(new_card.name);
    }
    
    if(new_card.name == 'Villa'){
        await getHand().addCard(new_card);
    } else{
        if(to_discard){
            if(['Den_of_Sin', 'GhostTown', 'Guardian', 'NightWatchman'].includes(new_card.name)){
                await getHand().addCard(new_card);
            } else getDiscard().addCard(new_card);
        } else{

        }
    }

    await getPlayer().update_score();
    await report_save_activity2(ACTIVITY_GAIN, new_card);
    await reactionEffectManager.solve_cards_when_gain(new_card);
    getLogger().deindent();
    return new_card;
}
async function gainCard(){

}
async function gainCardFromPile(pile){

}
async function gain_card_name(name, to_discard=true){
    let pile = findSupplyPile(function(pile){return pile.getQuantity()>0 && pile.getName() == name});
    if(pile != undefined){
        return await gain_card(pile, to_discard);
    } else {
        pile = findNonSupplyPile(function(pile){return pile.getQuantity()>0 && pile.getName() == name});
        if(pile != undefined){
            return await gain_card(pile, to_discard);
        }
    }
        return undefined;
}
async function gain_card_from_trash(card, to_discard=true){
    if(card == undefined) return undefined;

    card.setPlayer(getPlayer());
    report_save_activity(ACTIVITY_GAIN, card);
    getLogger().indent_();

    await card.is_gained();
    getPlayer().all_cards.push(card);
    
    if(getExile().length() > 0 && getExile().has_card(c => c.name==card.name)){
        await remove_from_exile(card.name);
    }
    
    await getPlayer().update_score();
    await report_save_activity2(ACTIVITY_GAIN, card);
    await reactionEffectManager.solve_cards_when_gain(card);
    getLogger().deindent();
    return card;
}
async function buy_and_gain_card(pile, to_discard=true){
    if(getPlayer().phase != PHASE_BUY || getBasicStats().getBuy()<=0 || pile==undefined || pile.getQuantity()==undefined || pile.quantity<=0) {return false;}
    await pay_cost_when_buy(pile.getCost());

    let new_card = await pile.popNextCard();
    new_card.setPlayer(getPlayer());
    if(new_card == undefined) alert('INVALID GAIN');
    report_save_activity(ACTIVITY_BUY_GAIN, new_card);
    getLogger().indent_();        
    await new_card.is_buyed();
    await new_card.is_gained();

    getPlayer().all_cards.push(new_card);
    
    if(getExile().length() > 0 && getExile().has_card(c => c.name==new_card.name)){
        await remove_from_exile(new_card.name);
    }
    
    if(new_card.name == 'Villa'){
        await getHand().addCard(new_card);
    } else{
        if(to_discard){
            if(['Den_of_Sin', 'GhostTown', 'Guardian', 'NightWatchman'].includes(new_card.name)){
                await getHand().addCard(new_card);
            } else await getDiscard().addCard(new_card);
        } else{

        }
    }

    await getPlayer().update_score();
    await report_save_activity2(ACTIVITY_BUY_GAIN, new_card);
    await reactionEffectManager.solve_cards_when_gain(new_card);
    getLogger().deindent();
}
/**
 * Use for Boon, Hex
 * @param {String} name 
 */


async function receive_boon(){
    let nextCard = HexBoonManager.getNextBoon();
    if(nextCard === undefined) return undefined;
    report_save_activity(ACTIVITY_RECEIVE, nextCard);
    getLogger().indent_();

    let newCard = await HexBoonManager.receiveBoon();

    getLogger().deindent();
    await report_save_activity2(ACTIVITY_RECEIVE, newCard);
    return newCard;
}

async function receive_hex(){
    let nextCard = HexBoonManager.getNextHex();
    if(nextCard === undefined) return undefined;
    report_save_activity(ACTIVITY_RECEIVE, nextCard);
    getLogger().indent_();

    let newCard = await HexBoonManager.receiveHex();

    getLogger().deindent();
    await report_save_activity2(ACTIVITY_RECEIVE, newCard);
    return newCard;
}

async function receive_state(state_card){
    if(state_card === undefined) return;
    report_save_activity(ACTIVITY_RECEIVE, state_card);
    getLogger().indent_();

    await state_card.is_received();
    stateHolder.addState(state_card);
    await getPlayer().update_score();

    getLogger().deindent();
    await report_save_activity2(ACTIVITY_RECEIVE, state_card);
}

async function discard_card(card, from_hand=true){
    if(from_hand){
        if(!await getHand().remove(card)){
            alert('CANT REMOVE FROM HNAD');
            return false;
        }
    }
    report_save_activity(ACTIVITY_DISCARD, card);
    getLogger().indent_();
    await getDiscard().addCard(card);
    await card.is_discarded();        
    await report_save_activity2(ACTIVITY_DISCARD, card);
    await reactionEffectManager.solve_cards_when_discard(card);
    getLogger().deindent();
    return true;
}
async function discardCard(card){
    report_save_activity(ACTIVITY_DISCARD, card);
    getLogger().indent_();
    await getDiscard().addCard(card);
    await card.is_discarded();        
    await report_save_activity2(ACTIVITY_DISCARD, card);
    await reactionEffectManager.solve_cards_when_discard(card);
    getLogger().deindent();
    return true;
}
async function discardCardFromHand(card){
    let removed = await getHand().remove(card);
    if(removed == undefined) throw new Error('Cant remove from hand');
    await discardCard(card);
}
async function discardCardFromPlayField(card){
    let removed = await getPlayField().remove(card);
    if(removed == undefined) throw new Error('Cant remove from play');
    await discardCard(card);
}
async function trash_card(card, from_hand=true){
    if(from_hand){
        if(!await getHand().remove(card)){
            alert('CANT TRASH');
            return false;
        }
    }
    report_save_activity(ACTIVITY_TRASH, card);
    getLogger().indent_();
    await getTrash().addCard(card);
    await card.is_trashed();

    await getPlayer().update_score();
    await report_save_activity2(ACTIVITY_TRASH, card);
    await reactionEffectManager.solve_cards_when_trash(card);
    getLogger().deindent();
    return true;
}
async function trashCard(card){
    report_save_activity(ACTIVITY_TRASH, card);
    getLogger().indent_();
    await getTrash().addCard(card);
    await card.is_trashed();

    await getPlayer().update_score();
    await report_save_activity2(ACTIVITY_TRASH, card);
    await reactionEffectManager.solve_cards_when_trash(card);
    getLogger().deindent();
    return card;
}
async function trashCardFromHand(card){
    let removed = await getHand().remove(card);
    if(removed == undefined) throw new Error('Cant remove from hand');
    await trashCard(card);
}
async function trashCardFromPlayField(card){
    let removed = await getPlayField().remove(card);
    if(removed == undefined) throw new Error('Cant remove from play');
    await trashCard(card);
}

async function activate_card(duration_card, reason, card){
    report_save_activity(ACTIVITY_ACTIVATE, duration_card); 
    await duration_card.activate(reason, card);
    await report_save_activity2(ACTIVITY_ACTIVATE, duration_card);
}
async function reveal_card(card){
    if(card==undefined || card.name==undefined || card.type==undefined) return;
    //TODO
    if(Array.isArray(card)){
        getLogger().writeMessage('Reveal ' + card.map(c => c.name).join(', '));
    } else{
        report_save_activity(ACTIVITY_REVEAL, card); 
    }        
}
async function revealCardList(cardList){
    if(!Array.isArray(cardList)) return;
    getLogger().writeMessage('Reveal ' + cardList.map(card => card.name).join(', '));
}
function reveal_deck(n){
    //reveal n cards from deck
    let new_cards = [];
    if(getDeck().length() < n){
        mix_discard_to_deck();
    }
    while(getDeck().length() > 0 && new_cards.length < n){
        new_cards.push(getDeck().pop());
    }
    return new_cards;
}
async function exile_card(card){
    if(card == undefined || card.name==undefined || card.type==undefined ) return undefined;
    report_save_activity(ACTIVITY_EXILE, card);   
    getLogger().indent_();
    await getExile().addCard(card);   
    getLogger().deindent();

    await getPlayer().update_score();
    await report_save_activity2(ACTIVITY_EXILE, card);   
    return true;
}
async function set_aside_card(card){
    report_save_activity(ACTIVITY_SET_ASIDE, card); 
    await getSetAside().addCard(card);
}
function remove_from_exile(name){
    return new Promise((resolve) => {
        if(getExile().getCardAll().filter(c => c.name==name).length <= 0){
            resolve();
            return;
        }
        getButtonPanel().clear_buttons();
        getButtonPanel().add_button(`Discard ${name} from exile`, async function(){
            getButtonPanel().clear_buttons();
            let i = 0;
            while(i < getExile().length()){
                let card = getExile().getCardAll()[i];  
                if(card.name == name){
                    await getExile().remove(card);
                    await getDiscard().addCard(card);
                    continue;
                }    
                i += 1;
            }
            resolve();
        }.bind(this));
        getButtonPanel().add_button('Cancel', function(){
            getButtonPanel().clear_buttons();
            resolve();
        });
    });
}
async function attack_other(card, additional_info){
    if(card == undefined || card.name == 'undefined') return;
        if(opponentManager.getOpponentList().length <= 0){
            await is_attacked(card, additional_info);
        } else{
            let report = getGameState().create_report(),
            message = additional_info;
            const category = 'PLAYING'
            let activity = {name: ACTIVITY_ATTACK, card: card.name};
            report_save_activity(ACTIVITY_ATTACK, card.name);
            await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, true);
        }   

}
async function react_other(username, JSONactivity, message){
    getPlayer().phase = PHASE_REACTION;
    let activity = JSON.parse(JSONactivity);
    let card_class = null;
    let card = null, 
        cardList = [];
    if(Array.isArray(activity.card)){
        card_class = activity.card.map(c => getClassFromName(c));
        cardList = card_class.map(c => new c(this));
    } else{
        card_class = getClassFromName(activity.card);
        card = new card_class(this);
    }               
    let new_activity = new Activity(username, activity.name, card, cardList);  
    getLogger().writeActivity(new_activity);
    if(activity.name == ACTIVITY_ATTACK){
        await is_attacked(card);
    } else if(activity.name == ACTIVITY_GAIN || activity.name == ACTIVITY_BUY_GAIN){
        await reactionEffectManager.solve_cards_when_another_gains(card);
    }else if(activity.name == ACTIVITY_PLAY){
        await do_passive(card);
    }
    getPlayer().phase = PHASE_WAITING;
    let report = getGameState().create_report();

    await getPlayer().report_ingame(ACTIVITY_END_REACT, report, 'Agree with '+activity+'by '+username, 'REACTING', false);

}
async function do_passive(card){
    await card.do_passive();
}
async function is_attacked(card, additional_info){
    let player = getPlayer();
    player.can_not_be_attacked = false;
    await reactionEffectManager.solve_cards_when_another_attacks(card);
    if(!player.can_not_be_attacked){
        await card.is_attacked(additional_info);
    }        
}

export {Activity,
        draw1, drawNCards, mix_discard_to_deck, play_card, autoplay_treasures, buy_card, buy_and_gain_card, buy_landscape_card, 
        gain_card, gain_card_name, gain_card_from_trash, receive_boon, receive_hex, receive_state, discard_card, trash_card, activate_card, reveal_card, revealCardList, reveal_deck,
        exile_card, set_aside_card, remove_from_exile, attack_other, react_other, do_passive, is_attacked};

