import {Landmark} from '../landscape_effect.js';
import {REASON_START_BUY, REASON_END_TURN, 
    REASON_WHEN_GAIN,  REASON_WHEN_TRASH} from '../../reaction_effect_manager.js';
import { findSupplyPile } from '../../features/TableSide/SupplyPile.jsx';
import { getPlayer } from '../../player.js';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getBasicSupply, getKingdomSupply } from '../../features/TableSide/Supply.jsx';
import { getGameState } from '../../game_logic/GameState.js';

import { opponentManager } from '../../features/OpponentSide/Opponent.js';

import { draw1, drawNCards, mix_discard_to_deck, play_card,
    gain_card, gain_card_name, discard_card, trash_card, reveal_card, exile_card,
    attack_other} from '../../game_logic/Activity.js';


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
        let gold_pile = findSupplyPile(p => p.getName() == 'Gold');
        if(gold_pile != undefined){
            await gold_pile.setVictoryToken(gold_pile.getVictoryToken() + 8);
        }
        let silver_pile = findSupplyPile(p => p.getName() == 'Silver');
        if(silver_pile != undefined){
            await silver_pile.setVictoryToken(silver_pile.getVictoryToken() + 8);
        }
    }
    add_score(){}
    should_activate(reason, card){
        return reason == REASON_WHEN_GAIN && card!= undefined 
                && ((card.type.includes('Treasure') && findSupplyPile(p => p.getName() == card.name) != undefined)
                    || (card.type.includes('Victory') && this.getVictoryToken() > 0));
    }
    async activate(reason, card){
        if(card.type.includes('Treasure')){
            let pile = findSupplyPile(p => p.getName() == card.name);
            if(pile == undefined) return;
            if(pile.getVictoryToken() > 0){
                await this.setVictoryToken(this.getVictoryToken() + 1);
                await pile.setVictoryToken(pile.getVictoryToken() - 1);
            }
        } else if(card.type.includes('Victory')){
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
        return reason == REASON_START_BUY && getPlayer().phase == 'buy';
    }    
    activate(reason, card){ 
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        return new Promise((resolve) =>{
            let chosen = 0;
            let card = null;
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Cancel', async function(){
                getButtonPanel().clear_buttons();
                resolve('Arena');
            }.bind(this));
            let is_marked = getHand().mark_cards(
                function(card){return card.type.includes('Action') && chosen == 0},
                async function(c){
                    chosen += 1;
                    await discard_card(c);
                    await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken() + 2);
                    await this.setVictoryToken(this.getVictoryToken() - 2);
                    getButtonPanel().clear_buttons();
                    resolve('Arena');
                }.bind(this),
                'discard'
            );
            if(!is_marked){
                getButtonPanel().clear_buttons();
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
            if(card.name == 'Silver'){
                silver_count += 1;
            } else if(card.name == 'Gold'){
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
        return reason == REASON_WHEN_GAIN
                && getPlayer().phase == 'buy'
                && getBasicStats().getCoin() >= 2
                && card != undefined;
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
        return reason == REASON_END_TURN && getGameState().cards_gained_this_turn.length == 0;
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
        return reason == REASON_WHEN_GAIN && card != undefined && card.type.includes('Victory');
    }
    async activate(reason, card){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        if(card != undefined && card.type.includes('Victory')){
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
        return reason == REASON_WHEN_GAIN && getPlayer().phase == 'buy' 
                && card != undefined && card.type.includes('Action')
                && getPlayField().getCardAll().map(c => c.name).includes(card.name);
    }
    async activate(){
        if(this.getVictoryToken() <= 0){
            this.activate_permanently = false;
            return;
        }
        if(getPlayer().phase != 'buy') return;
        if(getGameState().cards_gained_this_turn.length > 0){
            let last_gain = getGameState().cards_gained_this_turn[getGameState().cards_gained_this_turn.length - 1];
            if(last_gain.type.includes('Action') 
                && getPlayField().has_card(c => c.name==last_gain.name)){
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
    }
    async setup(){
        getKingdomSupply().pile_list.forEach(async p => {
            if(!p.getType().includes('Gathering') && p.getType().includes('Action')){
                await p.setVictoryToken(p.getVictoryToken() + 2);
            }
        });
    }
    add_score(){
    }
    should_activate(reason, card){
        return reason == REASON_WHEN_GAIN
                && card != undefined
                &&((card.type.includes('Action') && findSupplyPile(p => p.getName() == card.name) != undefined && findSupplyPile(p => p.getName() == card.name).getVictoryToken() > 0)
                    || (card.name == 'Curse' && getPlayer().phase == 'buy' && this.getVictoryToken() > 0));
    }
    async activate(reason, card){
        if(card.type.includes('Action')){
            let pile = findSupplyPile(p => p.getName() == card.name);
            if(pile == undefined) return;
            if(pile.getVictoryToken() > 0){
                await this.setVictoryToken(this.getVictoryToken() + 1);
                await pile.setVictoryToken(pile.getVictoryToken() - 1);
            }
        } else if(card.name == 'Curse' && getPlayer().phase == 'buy' && this.getVictoryToken() > 0){
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
            if(card.name == 'Copper'){
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
    add_score(){
        //TODO
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
        return reason == REASON_WHEN_GAIN && getGameState().cards_gained_this_turn.length == 2;
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
        if(this.turn != -1){
            this.activate_permanently = false;
            return false;
        }
        return reason == REASON_WHEN_GAIN && card != undefined && card.name == 'Province';
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
        if(action_pile.length == 0) return;
        let min = 0,
            max = action_pile.length - 1;
        const index = Math.floor(Math.random() * (max - min + 1)) + min;
        this.chosen_pile_name = action_pile[index].name;
    }
    async add_score(){
        let card_count = getPlayer().all_cards.map(c => c.name == this.chosen_pile_name).length;
        await getBasicStats().addScore(card_count);
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
            if(Array.isArray(card.type) && card.type.includes('Action')){
                if(action_name_list.includes(card.name)){
                    for(let j=0; j<action_list.length; j++){
                        let count_object = action_list[j];
                        if(count_object.name == card.name){
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
            if(card.name == 'Copper'){
                copper_count += 1;
            } else if(card.name == 'Silver'){
                silver_count += 1;
            } else if(card.name == 'Gold'){
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
        return reason == REASON_WHEN_TRASH && card != undefined;
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
        let empty_basic = getBasicSupply().pile_list.filter(pile => pile.getQuantity()<=0 && !pile.getType().includes('Victory')).map(pile => pile.getName());
        let empty_kingdom = getKingdomSupply().pile_list.filter(pile => pile.getQuantity()<=0 && !pile.getType().includes('Victory')).map(pile => pile.getName());
        let empty_piles = empty_basic.concat(empty_kingdom);
        if(empty_piles.length == 0) return;

        //TODO: lam sai roi, nho lam lai
        await getBasicStats().addScore(1 * empty_piles.length);
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
        let one_copy_count = count_list.filter(c => c==1).length;
        await getBasicStats().addScore(-3 * one_copy_count);
    }
}

export{
        Aqueduct, Arena, Bandit_Fort, Basilica, Baths, Battlefield, Colonnade, Defiled_Shrine, Fountain, Keep, Labyrinth, Mountain_Pass,
        Museum, Obelisk, Orchard, Palace, Tomb, Tower, Triumphal_Arch, Wall, Wolf_Den,
};