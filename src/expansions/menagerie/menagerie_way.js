import {Way} from '../landscape_effect.js';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getDiscard, getDeck, getTrash } from '../../features/PlayerSide/CardPile/CardPile.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getPlayArea, getExile, getSetAside } from '../../features/PlayerSide/BottomLeftCorner/SideArea.jsx';
import { getSupportHand } from '../../features/SupportHand.jsx';

import { getPlayer } from '../../player.js';
import { markSupplyPile, removeMarkSupplyPile } from '../../features/TableSide/Supply.jsx';
import { findSupplyPile, findSupplyPileAll } from '../../features/TableSide/SupplyPile.jsx';
import { findNonSupplyPile } from '../../features/TableSide/NonSupplyPile.jsx';
import { getTextInput } from '../../Components/user_input/TextInput.jsx';
import { draw1, drawNCards, mix_discard_to_deck, play_card,
    gain_card, gain_card_name, discard_card, trash_card, reveal_card, exile_card, set_aside_card,
    attack_other} from '../../game_logic/Activity.js';
import {REASON_SHUFFLE, REASON_START_TURN, REASON_START_BUY, REASON_END_BUY, REASON_START_CLEANUP, REASON_END_TURN, REASON_END_GAME, 
    REASON_WHEN_PLAY, REASON_WHEN_GAIN, REASON_WHEN_DISCARD, REASON_WHEN_TRASH,
    REASON_WHEN_BEING_ATTACKED, REASON_WHEN_ANOTHER_GAIN} from '../../game_logic/ReactionEffectManager.js';
/*
class Way_of_the_ extends Way{
    constructor(player){
        super('Way_of_the_', "Menagerie/Way/", player);
    }
    play(){

    }
}

*/
class Way_of_the_Butterfly extends Way{
    constructor(player){
        super('Way_of_the_Butterfly', "Menagerie/Way/", player);
    }
    async play(){
        //TODO
    }
}
class Way_of_the_Camel extends Way{
    constructor(player){
        super('Way_of_the_Camel', "Menagerie/Way/", player);
    }
    async play(){
        let gold_pile = findSupplyPile(function(pile){return pile.getName() == 'Gold' && pile.getQuantity() > 0});
            if(gold_pile == undefined) return;            
        let new_gold = await gold_pile.popNextCard();
        new_gold.setPlayer(getPlayer());
        if(new_gold ==undefined){
            return;
        }
        await exile_card(new_gold);   
    }
}
class Way_of_the_Chameleon extends Way{
    constructor(player){
        super('Way_of_the_Chameleon', "Menagerie/Way/", player);
        this.description = "Follow this card's instructions; each time that would give you +Cards this turn, you get +$ instead, and vice-versa.";
    }
    play(){
        //TODO
    }
}
class Way_of_the_Frog extends Way{
    constructor(player){
        super('Way_of_the_Frog', "Menagerie/Way/", player);
        this.description = "When you discard this from play this turn, put it onto your deck.";
    }
    async play(){
        await getBasicStats().addAction(1);
        //TODO
    }
}
class Way_of_the_Goat extends Way{
    constructor(player){
        super('Way_of_the_Goat', "Menagerie/Way/", player);
    }
    play(){
        if(getHand().length() <= 0) return;
        return new Promise((resolve) =>{
            this.chosen = 0;
            getHand().mark_cards(
                function(){return this.chosen == 0;}.bind(this), 
                async function(card){
                    if(this.chosen <1){
                        getHand().remove_mark();
                        this.chosen += 1;
                        await trash_card(card);
                    }
                    resolve('Way of the Goat finish');
                }.bind(this),
            'trash');
        });
    }
}
class Way_of_the_Horse extends Way{
    constructor(player){
        super('Way_of_the_Horse', "Menagerie/Way/", player);
    }
    async play(card){
        await drawNCards(2);
        await getBasicStats().addAction(1);
        if(card == undefined) return;
        let pile = findSupplyPile(pile => pile.getName() == card.name );
        if(pile == undefined) pile = findNonSupplyPile(pile => pile.name == card.name );
        if(pile != undefined){
            let removed = await getPlayField().remove(card);
            if(removed) pile.return_card(card);
        }
    }  
}
class Way_of_the_Mole extends Way{
    constructor(player){
        super('Way_of_the_Mole', "Menagerie/Way/", player);
    }
    async play(){
        await getBasicStats().addAction(1);
        if(getHand().length() <= 0) return;
        if(getHand().length() > 0){
            while(getHand().length() > 0){
                let card = await getHand().pop();
                await discard_card(card, false);
            }
            await drawNCards(3);
        }
    }
}
class Way_of_the_Monkey extends Way{
    constructor(player){
        super('Way_of_the_Monkey', "Menagerie/Way/", player);
    }
    async play(){
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(1);
    }
}
class Way_of_the_Mouse extends Way{
    constructor(player){
        super('Way_of_the_Mouse', "Menagerie/Way/", player);
        this.description = "Play the set-aside card, leaving it there. Setup: Set aside an unused Action costing $2 or $3."
    }
    play(){
        //TODO
    }
}
class Way_of_the_Mule extends Way{
    constructor(player){
        super('Way_of_the_Mule', "Menagerie/Way/", player);
    }
    async play(){
        await getBasicStats().addAction(1);
        await getBasicStats().addCoin(1);
    }
}
class Way_of_the_Otter extends Way{
    constructor(player){
        super('Way_of_the_Otter', "Menagerie/Way/", player);
    }
    async play(){
        await drawNCards(2);
    }
}
class Way_of_the_Owl extends Way{
    constructor(player){
        super('Way_of_the_Owl', "Menagerie/Way/", player);
    }
    async play(){
        while(getHand().length() < 6){
            await draw1();
        }
    }
}
class Way_of_the_Ox extends Way{
    constructor(player){
        super('Way_of_the_Ox', "Menagerie/Way/", player);
    }
    async play(){
        await getBasicStats().addAction(2);
    }
}
class Way_of_the_Pig extends Way{
    constructor(player){
        super('Way_of_the_Pig', "Menagerie/Way/", player);
    }
    async play(){
        await draw1();
        await getBasicStats().addAction(1);
    }
}
class Way_of_the_Rat extends Way{
    constructor(player){
        super('Way_of_the_Rat', "Menagerie/Way/", player);
    }
    play(card){
        if(getHand().length() <= 0) return;
        return new Promise((resolve) =>{
            this.chosen = 0;
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Cancel', function(){
                clearFunc();
                resolve("Way of the Rat finish"); 
            }.bind(this));
            let is_marked = getHand().mark_cards(
                function(card1){return card1.type.includes('Treasure') && this.chosen == 0;}.bind(this),
                async function(card1){
                    clearFunc();
                    this.chosen += 1;
                    await discard_card(card1);
                    
                    let pile = findSupplyPile(p => p.getName() == card.name && p.getQuantity() > 0);
                    if(pile != undefined) await gain_card(pile);
                    resolve("Way of the Rat finish");                    
                }.bind(this),
            'discard');
            if(!is_marked){
                resolve("Way of the Rat finish");
            }
        });

    }
}
class Way_of_the_Seal extends Way{
    constructor(player){
        super('Way_of_the_Seal', "Menagerie/Way/", player);
        this.activate_when_gain = true;
        //TODO
        this.description = "This turn, when you gain a card, you may put it onto your deck.";
    }
    async play(){
        await getBasicStats().addCoin(1);

    }
}
class Way_of_the_Sheep extends Way{
    constructor(player){
        super('Way_of_the_Sheep', "Menagerie/Way/", player);
    }
    async play(){
        await getBasicStats().addCoin(2);
    }
}
class Way_of_the_Squirrel extends Way{
    constructor(player){
        super('Way_of_the_Squirrel', "Menagerie/Way/", player);
        this.turn = -1;
        this.activate_when_end_turn = true;
        this.activate_currently = false;
        //TODO
        this.description = "+2 Cards at the end of this turn.";
    }
    play(){
        this.turn = getPlayer().turn;
        this.activate_currently = true;
    }
}
class Way_of_the_Turtle extends Way{
    constructor(player){
        super('Way_of_the_Turtle', "Menagerie/Way/", player);
        this.description = "Set this aside. If you did, play it at the start of your next turn.";
    }
    play(){
        //TODO
    }
}
class Way_of_the_Worm extends Way{
    constructor(player){
        super('Way_of_the_Worm', "Menagerie/Way/", player);
    }
    async play(){
        let estate_pile = findSupplyPile(function(pile){return pile.getName() == 'Estate' && pile.getQuantity() > 0});
            if(estate_pile == undefined) return;            
        
        let new_estate = await estate_pile.popNextCard();
        new_estate.setPlayer(getPlayer());
        if(new_estate ==undefined){
            return;
        }
        await exile_card(new_estate);  
        await getPlayer().update_score(); 
    }
}

export {Way_of_the_Butterfly, Way_of_the_Camel, Way_of_the_Chameleon, Way_of_the_Frog, Way_of_the_Goat,
    Way_of_the_Horse, Way_of_the_Mole, Way_of_the_Monkey, Way_of_the_Mouse, Way_of_the_Mule, Way_of_the_Otter,
    Way_of_the_Owl, Way_of_the_Ox, Way_of_the_Pig, Way_of_the_Rat, Way_of_the_Seal, Way_of_the_Sheep, Way_of_the_Squirrel,
    Way_of_the_Turtle, Way_of_the_Worm};