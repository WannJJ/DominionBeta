import {Landmark} from '../landscape_effect.js';
import { REASON_START_BUY, REASON_END_TURN, 
    REASON_WHEN_GAIN,  REASON_WHEN_TRASH } from '../../game_logic/ReactionEffectManager.js';

import { findSupplyPile } from '../../features/TableSide/SupplyPile.jsx';
import { getPlayer } from '../../player.js';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getBasicSupply, getKingdomSupply } from '../../features/TableSide/Supply.jsx';
import { getGameState } from '../../game_logic/GameState.js';

import { opponentManager } from '../../features/OpponentSide/Opponent.js';

import { discard_card} from '../../game_logic/Activity.js';
import { Card } from '../cards.js';
import { PHASE_BUY } from '../../utils/constants.js';
import { setInstruction } from '../../features/PlayerSide/Instruction.jsx';


/*
class  extends Landmark{
    constructor(player){
        super('', "Empires/Landmark/", player);
    }
    add_score(){

    }
}
*/
class Aqueduct extends Landmark{
    constructor(player){
        super('Aqueduct', "Empires/Landmark/", player);
        this.activate_when_gain = true;
        this.activate_permanently = true;
        this.description = "When you gain a Treasure, move 1 VP from its pile to this. When you gain a Victory card, take the  VP from this.Setup: Put 8 VP on the Silver and Gold piles."
    }
    async setup(){
        let gold_pile = findSupplyPile(p => p.getName() === 'Gold');
        if(gold_pile){
            await gold_pile.setVictoryToken(gold_pile.getVictoryToken() + 8);
        }
        let silver_pile = findSupplyPile(p => p.getName() === 'Silver');
        if(silver_pile){
            await silver_pile.setVictoryToken(silver_pile.getVictoryToken() + 8);
        }
    }
    add_score(){}
    should_activate(reason, card){
        return reason === REASON_WHEN_GAIN && card
                && ((card.type.includes(Card.Type.TREASURE) && findSupplyPile(p => p.isOriginOf(card)))
                    || (card.type.includes(Card.Type.VICTORY) && this.getVictoryToken() > 0));
    }
    async activate(reason, card){
        if(card.type.includes(Card.Type.TREASURE)){
            let pile = findSupplyPile(p => p.isOriginOf(card));
            if(!pile) return;
            if(pile.getVictoryToken() > 0){
                await this.setVictoryToken(this.getVictoryToken() + 1);
                await pile.setVictoryToken(pile.getVictoryToken() - 1);
            }
        } else if(card.type.includes(Card.Type.VICTORY)){
            await getBasicStats().setVictoryToken(this.getVictoryToken());
            await this.setVictoryToken(0);
        }
    }
}
class Arena extends Landmark{
    constructor(player){
        super('Arena', "Empires/Landmark/", player);
        this.activate_when_start_buy_phase = true;
        this.activate_permanently = true;
        this.victory_token = 6 * 2;
        this.description = "At the start of your Buy phase, you may discard an Action card. If you do, take 2 VP from here. Setup: Put 6 VP here per player."
    }
    async setup(){
        await this.setVictoryToken(6 * (opponentManager.getOpponentList().length + 1));
    }
    add_score(){
    }
    should_activate(reason, card){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return false;
        }
        return reason === REASON_START_BUY && getPlayer().phase === PHASE_BUY;
    }    
    activate(reason, card){ 
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        return new Promise((resolve) =>{
            let chosen = 0;
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
                getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            setInstruction('Arena: You may discard an Action card.')

            getButtonPanel().add_button('Cancel', async function(){
                clearFunc();
                resolve('Arena');
            });
            let is_marked = getHand().mark_cards(
                function(card){return card.type.includes(Card.Type.ACTION) && chosen === 0},
                async function(c){
                    chosen += 1;
                    clearFunc();
                    await discard_card(c);
                    await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + 2);
                    await this.setVictoryToken(this.getVictoryToken() - 2);
                    resolve('Arena');
                }.bind(this),
                'discard'
            );
            if(!is_marked){
                clearFunc();
                resolve();
            }
        });
    }
}
class Bandit_Fort extends Landmark{
    constructor(player){
        super('Bandit_Fort', "Empires/Landmark/", player);
        this.description = "When scoring, -2 VP for each Silver and each Gold you have."
    }
    async add_score(){
        let silver_count = 0,
            gold_count = 0;
        for(let i=0; i< getPlayer().all_cards.length; i++){
            let card =  getPlayer().all_cards[i];
            if(card.name === 'Silver'){
                silver_count += 1;
            } else if(card.name === 'Gold'){
                gold_count += 1;
            }
        }
        let n = silver_count + gold_count;
        await getBasicStats().setVictoryToken(-2 * n);
    }
}
class Basilica extends Landmark{
    constructor(player){
        super('Basilica', "Empires/Landmark/", player);
        this.activate_when_gain = true;
        this.activate_permanently = true;
        this.victory_token = 6 * 2;
        this.description = "When you gain a card in your Buy phase, if you have $2 or more, take 2 VP from here. Setup: Put 6 VP here per player."
    }
    async setup(){
        await this.setVictoryToken(6 * (opponentManager.getOpponentList().length + 1));
    }
    add_score(){
        
    }
    should_activate(reason, card){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return false;
        }
        return reason === REASON_WHEN_GAIN
                && getPlayer().phase === PHASE_BUY
                && getBasicStats().getCoin() >= 2
                && card;
    }
    async activate(){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        if(getBasicStats().getCoin() >= 2){
            if(this.getVictoryToken() >= 2){
                await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + 2);
                await this.setVictoryToken(this.getVictoryToken() -2 );
            }
        }
    }
}
class Baths extends Landmark{
    constructor(player){
        super('Baths', "Empires/Landmark/", player);
        this.activate_when_end_turn = true;
        this.activate_permanently = true;
        this.victory_token = 6 * 2;
        this.description = "When you end your turn without having gained a card, take 2 VP from here. Setup: Put 6 VP here per player."
    }
    async setup(){
        await this.setVictoryToken(6 * (opponentManager.getOpponentList().length + 1));
    }
    add_score(){
    }
    should_activate(reason, card){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return false;
        }
        return reason === REASON_END_TURN && getGameState().cards_gained_this_turn.length === 0;
    }
    async activate(){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        if(getGameState().cards_gained_this_turn.length <= 0){
            if(this.getVictoryToken() >= 2){
                await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + 2);
                await this.setVictoryToken(this.getVictoryToken() - 2);
            }
        }
    }
}
class Battlefield extends Landmark{
    constructor(player){
        super('Battlefield', "Empires/Landmark/", player);
        this.activate_when_gain = true;
        this.activate_permanently = true;
        this.victory_token = 6 * 2;
        this.description = 'When you gain a Victory card, take 2 VP from here. Setup: Put 6 VP here per player.'
    }
    async setup(){
        await this.setVictoryToken(6 * (opponentManager.getOpponentList().length + 1));
    }
    add_score(){
    }
    should_activate(reason, card){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return false;
        }
        return reason === REASON_WHEN_GAIN && card && card.type.includes(Card.Type.VICTORY);
    }
    async activate(reason, card){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        if(card && card.type.includes(Card.Type.VICTORY)){
            await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + 2);
            await this.setVictoryToken(this.getVictoryToken() - 2);
        }
    }
}
class Colonnade extends Landmark{
    constructor(player){
        super('Colonnade', "Empires/Landmark/", player);
        this.activate_when_gain = true;
        this.activate_permanently = true;
        this.victory_token = 6 * 2;
        this.description = "When you gain an Action card in your Buy phase, if you have a copy of it in play, take 2 VP from here.Setup: Put 6 VP here per player."
    }
    async setup(){
        await this.setVictoryToken(6 * (opponentManager.getOpponentList().length + 1));
    }
    add_score(){
        
    }
    should_activate(reason, card){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return false;
        }
        return reason === REASON_WHEN_GAIN && getPlayer().phase === PHASE_BUY 
                && card && card.type.includes(Card.Type.ACTION)
                && getPlayField().getCardAll().map(c => c.name).includes(card.name);
    }
    async activate(){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        if(getPlayer().phase !== PHASE_BUY) return;
        if(getGameState().cards_gained_this_turn.length > 0){
            let last_gain = getGameState().cards_gained_this_turn[getGameState().cards_gained_this_turn.length - 1];
            if(last_gain.type.includes('Action') 
                && getPlayField().has_card(c => c.name===last_gain.name)){
                await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + 2);
                await this.setVictoryToken(this.getVictoryToken() - 2);
            }
        }
    }
}
class Defiled_Shrine extends Landmark{
    constructor(player){
        super('Defiled_Shrine', "Empires/Landmark/", player);
        this.activate_when_gain = true;
        this.activate_permanently = true;
        this.victory_token = 0;
        this.description = "When you gain an Action, move 1 VP from its pile to this. When you gain a Curse in your Buy phase, take the  VP from this. Setup: Put 2 VP on each non-Gathering Action Supply pile."
        //TODO: Defiled_Shrine ket hop Aqueduct, voi split pile (Gladiator, Encampment, Catapult);
    }
    async setup(){
        getKingdomSupply().pile_list.forEach(async p => {
            if(!p.getType().includes(Card.Type.GATHERING) && p.getType().includes(Card.Type.ACTION)){
                await p.setVictoryToken(p.getVictoryToken() + 2);
            }
        });
    }
    add_score(){
    }
    should_activate(reason, card){
        return reason === REASON_WHEN_GAIN
                && card
                &&((card.type.includes(Card.Type.ACTION) && findSupplyPile(p => p.isOriginOf(card)) 
                && findSupplyPile(p => p.isOriginOf(card)).getVictoryToken() > 0)
                    || (card.name === 'Curse' && getPlayer().phase === PHASE_BUY && this.getVictoryToken() > 0));
    }
    async activate(reason, card){
        if(card.type.includes(Card.Type.ACTION)){
            let pile = findSupplyPile(p => p.isOriginOf(card));
            if(!pile) return;
            if(pile.getVictoryToken() > 0){
                await this.setVictoryToken(this.getVictoryToken() + 1);
                await pile.setVictoryToken(pile.getVictoryToken() - 1);
            }
        } else if(card.name === 'Curse' && getPlayer().phase === PHASE_BUY && this.getVictoryToken() > 0){
            await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + this.getVictoryToken());
            await this.setVictoryToken(0);
        }
    }
    
}
class Fountain extends Landmark{
    constructor(player){
        super('Fountain', "Empires/Landmark/", player);
        this.description = 'When scoring, 15 VP if you have at least 10 Coppers.'
    }
    async add_score(){
        let copper_count = 0;
        for(let i=0; i < getPlayer().all_cards.length; i++){
            let card = getPlayer().all_cards[i];
            if(card.name === 'Copper'){
                copper_count += 1;
            }
        }     
        if(copper_count >= 10){
            await getBasicStats().addScore(15)
        }           
    }
}
class Keep extends Landmark{
    constructor(player){
        super('Keep', "Empires/Landmark/", player);
        this.description  = "When scoring, 5 VP per differently named Treasure you have, that you have more copies of than each other player, or tied for most."
    }
    async add_score(){
        let nameList = [];
        let cardCount = [];
        let properCount = 0;

        for(let card of getPlayer().all_cards){
            if(!card.type.includes(Card.Type.TREASURE)) continue;
            if(nameList.includes(card.name)){
                let index = nameList.indexOf(card.name);
                if(index !== -1){
                    cardCount[index] += 1;
                }
            } else{
                nameList.push(card.name);
                cardCount.push(1);
            }
        }

        for(let i=0; i<nameList.length; i++){
            let name = nameList[i];
            let count = cardCount[i];
            let isProper = true;
            for(let opponent of opponentManager.getOpponentList()){
                let opponentCardCount = opponent.all_cards.filter(card => card.name === name).length;
                if(opponentCardCount > count){
                    isProper = false;
                    break;
                }
            }
            
            if(isProper){
                properCount += 1;
            }
        }

        await getBasicStats().addScore(5 * properCount);
    }
}

class Labyrinth extends Landmark{
    constructor(player){
        super('Labyrinth', "Empires/Landmark/", player);
        this.activate_when_gain = true;
        this.activate_permanently = true;
        this.victory_token = 6 * 2;
        this.description = 'When you gain a 2nd card in one of your turns, take 2 VP from here.Setup: Put 6 VP here per player.'
    }
    async setup(){
        await this.setVictoryToken(6 * (opponentManager.getOpponentList().length + 1));
    }
    add_score(){
        
    }
    should_activate(reason, card){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return false;
        }
        return reason === REASON_WHEN_GAIN && getGameState().cards_gained_this_turn.length === 2;
    }
    async activate(){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        if(getGameState().cards_gained_this_turn.length >= 2){
            await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + 2);
            await this.setVictoryToken(this.getVictoryToken() - 2);
        }
    }
}
class Mountain_Pass extends Landmark{
    constructor(player){
        super('Mountain_Pass', "Empires/Landmark/", player);
        this.turn = -1;
        this.activate_when_gain = true;
        this.activate_permanently = true;
        this.description = 'When you are the first player to gain a Province, each player bids once, up to 40D, ending with you. High bidder gets +8 VP and takes the D they bid.'
    }
    add_score(){
        //TODO        
    }
    should_activate(reason, card){
        if(this.turn !== -1){
            this.activate_permanently = false;
            return false;
        }
        return reason === REASON_WHEN_GAIN && card && card.name === 'Province';
    }
    activate(reason, card){
        this.turn = getPlayer().turn;
        this.activate_permanently = false;
    }
}
class Museum extends Landmark{
    constructor(player){
        super('Museum', "Empires/Landmark/", player);
        this.description = 'When scoring, 2 VP per differently named card you have.'
    }
    async add_score(){
        let name_list = [];
        for(let i=0; i<getPlayer().all_cards.length; i++){
            let card = getPlayer().all_cards[i];
            if(!name_list.includes(card.name)){
                name_list.push(card.name);
                await getBasicStats().addScore(2);
            }
        }
    }
}
class Obelisk extends Landmark{
    constructor(player){
        super('Obelisk', "Empires/Landmark/", player);
        this.description = 'When scoring, 2 VP per card you have from the chosen pile. Setup: Choose a random Action Supply pile.'
        this.chosen_pile_name = '';
    }
    setup(){
        let action_pile = getKingdomSupply().pile_list.filter(p => p.getType().includes('Action'));
        if(action_pile.length === 0) return;
        let min = 0,
            max = action_pile.length - 1;
        const index = Math.floor(Math.random() * (max - min + 1)) + min;
        let chosenPile = action_pile[index];
        this.chosen_pile_name = chosenPile.getName();
        console.log("Obelisk chose", this.chosen_pile_name);
    }
    async add_score(){
        let chosenPile = findSupplyPile(pile => pile.getName() === this.chosen_pile_name);
        if(!chosenPile) throw new Error("Couldnt find chosen pile "+this.chosen_pile_name);

        let cardCount = 0;
        for(let card of getPlayer().all_cards){
            if(chosenPile.isOriginOf(card)){
                cardCount += 1;
            }
        }
        await getBasicStats().addScore(2 * cardCount);
    }
}
class Orchard extends Landmark{
    constructor(player){
        super('Orchard', "Empires/Landmark/", player);
        this.description = 'When scoring, 4 VP per differently named Action card you have 3 or more copies of.'
    }
    async add_score(){
        let action_list = [];
        let action_name_list = [];
        for(let i=0; i<getPlayer().all_cards.length; i++){
            let card = getPlayer().all_cards[i];
            if(Array.isArray(card.type) && card.type.includes(Card.Type.ACTION)){
                if(action_name_list.includes(card.name)){
                    for(let j=0; j<action_list.length; j++){
                        let count_object = action_list[j];
                        if(count_object.name === card.name){
                            count_object.count += 1;
                            break;
                        }
                    }
                } else{
                    action_name_list.push(card.name);
                    action_list.push({name: card.name, count: 1});
                }
            }
        }  
        let n = 0
        for(let i=0; i<action_list.length; i++){
            let count_object = action_list[i]; 
            if(count_object.count >= 3){
                n += 1;
            }
        }
        await getBasicStats().addScore(4 * n);
    }
}
class Palace extends Landmark{
    constructor(player){
        super('Palace', "Empires/Landmark/", player);
        this.description = 'When scoring, 3 VP per set you have of Copper - Silver - Gold.'
    }
    async add_score(){
        let copper_count = 0,
        silver_count = 0,
        gold_count = 0;
        for(let i=0; i<getPlayer().all_cards.length; i++){
            let card = getPlayer().all_cards[i];
            if(card.name === 'Copper'){
                copper_count += 1;
            } else if(card.name === 'Silver'){
                silver_count += 1;
            } else if(card.name === 'Gold'){
                gold_count += 1;
            }
        }
        let n = Math.min(copper_count, silver_count, gold_count);
        await getBasicStats().addScore(3 * n);
    }
}
class Tomb extends Landmark{
    constructor(player){
        super('Tomb', "Empires/Landmark/", player);
        this.activate_when_trash = true;
        this.activate_permanently = true;
        this.description = 'When you trash a card, +1 VP.'
    }
    add_score(){
        
    }
    shoudl_activate(reason, card){
        return reason === REASON_WHEN_TRASH && card;
    }
    async activate(){
        await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + 1);
    }
}
class Tower extends Landmark{
    constructor(player){
        super('Tower', "Empires/Landmark/", player);
        this.description = 'When scoring, 1 VP per non-Victory card you have from an empty Supply pile.'
    }
    async add_score(){
        let emptyBasicPileList = getBasicSupply().pile_list.filter(pile => pile.getQuantity()<=0);
        let emptyKingdomPileList = getKingdomSupply().pile_list.filter(pile => pile.getQuantity()<=0);
        let emptySupplyPileList = emptyBasicPileList.concat(emptyKingdomPileList);
        let properCount = 0;
        for(let card of getPlayer().all_cards){
            if(card.type.includes(Card.Type.VICTORY)) continue;
            for(let pile of emptySupplyPileList){
                if(pile.isOriginOf(card)){
                    properCount += 1;
                    break;
                }
            }
        }
        await getBasicStats().addScore(1 * properCount);
    }
}
class Triumphal_Arch extends Landmark{
    constructor(player){
        super('Triumphal_Arch', "Empires/Landmark/", player);
        this.description = 'When scoring, 3 VP per copy you have of the 2nd most common Action card among your cards (if it’s a tie, count either)'
    }
    async add_score(){
        let name_list = [],
            count_list = [];

        for(let i=0; i<getPlayer().all_cards.length; i++){
            let card = getPlayer().all_cards[i];
            if(!card.type.includes('Action')) continue;
            if(name_list.includes(card.name)){
                let index = name_list.indexOf(card.name);
                count_list[index] += 1;
            } else{
                name_list.push(card.name);
                count_list.push(1);
            }
        }     
        count_list.sort().reverse();
        if(count_list.length >= 2){
            let second_most_count = count_list[1];
            await getBasicStats().addScore(3 * second_most_count);
        } 
    }
}
class Wall extends Landmark{
    constructor(player){
        super('Wall', "Empires/Landmark/", player);
        this.description = 'When scoring, -1 VP per card you have after the first 15.'
    }
    async add_score(){
        if(getPlayer().all_cards.length > 15){
            await getBasicStats().addScore(-1 * (getPlayer().all_cards.length - 15));
        }
               
    }
}
class Wolf_Den extends Landmark{
    constructor(player){
        super('Wolf_Den', "Empires/Landmark/", player);
        this.description = 'When scoring, -3 VP per card you have exactly one copy of.'
    }
    async add_score(){
        let name_list = [];
        let count_list = [];
        for(let i=0; i<getPlayer().all_cards.length; i++){
            let card = getPlayer().all_cards[i];
            if(name_list.includes(card.name)){
                let index = name_list.indexOf(card.name);
                count_list[index] = count_list[index] + 1;
            } else{
                name_list.push(card.name);
                count_list.push(1);
            }
        }
        let one_copy_count = count_list.filter(c => c===1).length;
        await getBasicStats().addScore(-3 * one_copy_count);
    }
}

export{
        Aqueduct, Arena, Bandit_Fort, Basilica, Baths, Battlefield, Colonnade, Defiled_Shrine, Fountain, Keep, Labyrinth, Mountain_Pass,
        Museum, Obelisk, Orchard, Palace, Tomb, Tower, Triumphal_Arch, Wall, Wolf_Den,
};