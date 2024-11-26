import {Card, Cost} from '../cards.js';
import {REASON_SHUFFLE, REASON_START_TURN, REASON_START_BUY, REASON_END_BUY, REASON_START_CLEANUP, REASON_END_TURN, REASON_END_GAME, 
    REASON_WHEN_PLAY, REASON_WHEN_GAIN, REASON_WHEN_DISCARD, REASON_WHEN_TRASH,
    REASON_WHEN_BEING_ATTACKED, REASON_WHEN_ANOTHER_GAIN} from '../../game_logic/ReactionEffectManager.js';


import { markSupplyPile, removeMarkSupplyPile } from '../../features/TableSide/Supply.jsx';
import { getPlayer } from '../../player.js';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getDiscard, getDeck, getTrash } from '../../features/PlayerSide/CardPile/CardPile.jsx';
import { getPlayArea, getExile, getSetAside } from '../../features/PlayerSide/BottomLeftCorner/SideArea.jsx';
import { getNativeVillageMat, getIslandMat } from '../../features/PlayerSide/BottomLeftCorner/PlayerMats.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getSupportHand } from '../../features/SupportHand.jsx';
import { setInstruction } from '../../features/PlayerSide/Instruction.jsx';
import { draw1, drawNCards, mix_discard_to_deck, play_card,
    gain_card, gain_card_name, discard_card, trash_card, reveal_card, revealCardList, set_aside_card,
    attack_other} from '../../game_logic/Activity.js';
/*
class  extends Card{
    constructor(player){
        super("", , Card.Type.TREASURE, "Plunder/", player);
    }
    play(){
        
    } 
}
*/


//NORMAL SUPPLY CARDS
// Cards can gain LOOT
class JewelledEgg extends Card{
    constructor(player){
        super("JewelledEgg", new Cost(2), Card.Type.TREASURE, "Plunder/", player);
    }
    async play(){
        await getBasicStats().addCoin(1);
        await getBasicStats().addBuy(1);
    } 
    async is_trashed(){
        await gain_card_name('Loot');
    }
}
class Search extends Card{
    constructor(player){
        super("Search", new Cost(2), Card.Type.ACTION +" "+ Card.Type.DURATION, "Plunder/", player);
        this.not_discard_in_cleanup = true;
    }
    async play(){
        await getBasicStats().addCoin(2);
    } 
    do_duration(){
        super.do_duration();
        //TODO
    }
}
class Pickaxe extends Card{
    constructor(player){
        super("Pickaxe", new Cost(5), Card.Type.TREASURE, "Plunder/", player);
    }
    async play(){
        await getBasicStats().addCoin(1);
        if(getHand().length() > 0){
            return new Promise((resolve) => { 
            this.chosen = 0;
            this.trash_card = undefined;

            getHand().mark_cards(
                function(card){ return this.chosen == 0;}.bind(this),
                async function(card){
                    if(this.chosen == 0){
                        getHand().remove_mark();
                        this.chosen = 1;
                        this.trash_card = card;
                        let cost = card.cost;
                        await trash_card(card);
                        if(cost !=  undefined && cost.coin >= 3){
                            let new_loot = await gain_card_name('Loot', false);
                            if(new_loot != undefined) await getHand().addCard(new_loot);
                        }
                        resolve('Pickaxe finish');
                    }
                }.bind(this),
            'trash');
        });
    } 
    } 
}
class WealthyVillage extends Card{
    constructor(player){
        super("WealthyVillage", new Cost(5), Card.Type.ACTION, "Plunder/", player);
    }
    async play(){
        await draw1();
        await getBasicStats().addAction(2);
    } 
    async is_gained(){
        if(getPlayField().length <= 0) return;
        let diff_named_treasure = [];
        for(let card of getPlayField().getCardAll()){
            if(!diff_named_treasure.includes(card.name)){
                diff_named_treasure.push(card.name);
                if(diff_named_treasure.length >= 3){
                    await gain_card_name('Loot');
                    return;
                }
            }
        }
    }
}
class Cutthroat extends Card{
    constructor(player){
        super("Cutthroat", new Cost(5), Card.Type.ACTION +" "+ Card.Type.DURATION +" "+ Card.Type.ATTACK, "Plunder/", player);
        this.not_discard_in_cleanup = true;
        this.activate_when_gain = true;
        this.activate_when_another_gains = true;
        this.activate_when_in_play = true;
        //TODO: Test
    }
    async play(){

        this.not_discard_in_cleanup = true;
        await attack_other(this);
        
    } 
    do_duration(){
        super.do_duration();
    }
    attack(){}
    is_attacked(){
        if(getHand().length() <= 3){return;}
        return new Promise((resolve) => {
            this.chosen = 0;
            let n = Math.max(getHand().length() - 3, 0);
            getHand().getCardAll().forEach(card => card.cutthroat=undefined);
            let clearFunc = function(){
                getHand().remove_mark();
                getButtonPanel().clear_buttons();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("OK", async function(){
                if(this.chosen < n) return;
                clearFunc();
                for(let i=0; i<this.chosen; i++){
                    let card = getHand().state.cards[i];
                    if(card.cutthroat){
                        await discard_card(card, true);                        
                    }      
                }
                resolve('Cutthroat finish');
            }.bind(this));
            getHand().mark_cards(
                function(card){return this.chosen < n;}.bind(this),
                function(card){
                    if(this.chosen < n){
                        this.chosen += 1;
                        card.cutthroat = true;
                    }
                }.bind(this), 'discard');
            
        });
    }
    should_activate(reason, card){
        return (reason == REASON_WHEN_GAIN || reason == REASON_WHEN_ANOTHER_GAIN) && card != undefined;
    }
    async activate(reason, card){
        this.not_discard_in_cleanup = false;
        await gain_card_name('Loot');
    }
}
class SackofLoot extends Card{
    constructor(player){
        super("SackofLoot", new Cost(6), Card.Type.TREASURE, "Plunder/", player);
    }
    async play(){
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(1);
        await gain_card_name('Loot');
    } 
}

class Cage extends Card{
    constructor(player){
        super("Cage", new Cost(2), Card.Type.TREASURE + " " + Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    }
}
class Grotto extends Card{
    constructor(player){
        super("Grotto", new Cost(2), Card.Type.ACTION + " "+ Card.Type.DURATION, "Plunder/", player);
    }
    async play(){
        //TODO        
        await getBasicStats().addAction(1);

    } 
    do_duration(){
        super.do_duration();
    }
}
class Shaman extends Card{
    constructor(player){
        super("Shaman", new Cost(2), Card.Type.ACTION, "Plunder/", player);
        this.activate_when_start_turn = true;
        this.description = "In games using this, at the start of your turn, gain a card from the trash costing up to $6.";
        //TODO
    }
    async play(){
        await getBasicStats().addAction(1);
        await getBasicStats().addCoin(1);
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => {
            this.chosen = 0;
            this.card = undefined;
            getButtonPanel().clear_buttons();
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                getHand().remove_mark();
            }.bind(this);
            getButtonPanel().add_button("Confirm Trashing", async function(){
                clearFunc();
                resolve('Shaman finish');
            }.bind(this));

            getHand().mark_cards(
                function(card){return this.chosen == 0}.bind(this),
                async function(card){
                    clearFunc();
                    this.chosen += 1;
                    await trash_card(this.card);
                    resolve('Shaman finish');
            }.bind(this),
            'trash');
        });
    } 
}
class SecludedShrine extends Card{
    constructor(player){
        super("SecludedShrine", new Cost(3), Card.Type.ACTION + ' '+ Card.Type.DURATION, "Plunder/", player);
        this.not_discard_in_cleanup = false;
        this.activate_when_gain = true;
        this.activate_when_in_play = true;
    }
    async play(){
        //TODO
        await getBasicStats().addCoin(1);
        this.not_discard_in_cleanup = true;
    } 
    do_duration(){
        super.do_duration();
    }
    should_activate(reason, card){
        return reason == REASON_WHEN_GAIN 
            && card != undefined && card.type.includes('Treasure');
    }
    activate(reason, card){
        if(getHand().length() <= 0 || card == undefined) return;
        this.not_discard_in_cleanup = false;
        return new Promise((resolve) =>{
            getButtonPanel().clear_buttons();
            let card_list = [];
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                getHand().remove_mark();
            }.bind(this);
            getButtonPanel().add_button('Confirm Trashing', async function(){
                if(card_list.length > 0){
                    clearFunc();
                    while(card_list.length > 0){
                        let card = card_list.pop();
                        await trash_card(card);
                    }
                    resolve('SecludedShrine activate finish');
                }
            }.bind(this));
            getHand().mark_cards(
                function(card){
                    return card_list.length < 2;
                },
                function(card){
                    card_list.push(card);
                },
                'trash',
            );
        });
    }
}
class Siren extends Card{
    constructor(player){
        super("Siren", new Cost(3), Card.Type.ACTION + ' '+ Card.Type.DURATION + " "+ Card.Type.ATTACK, "Plunder/", player);
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        //TODO
        await attack_other(this);
    } 
    is_gained(){

    }
    do_duration(){
        super.do_duration();
    }
    attack(){

    }
    async is_attacked(){
        await gain_card_name("Curse");
    }
    should_activate(reason, card){
        return reason == REASON_START_TURN;
    }
    async activate(reason){
        this.not_discard_in_cleanup = false;
        while(getHand().length() < 8 && (getDeck().length() > 0 || getDiscard().length() > 0)){
            await draw1();
        }
    }

}
class Stoaway extends Card{
    constructor(player){
        super("Stoaway", new Cost(3), Card.Type.ACTION+' '+Card.Type.DURATION+' '+Card.Type.REACTION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    }
}
class Taskmaster extends Card{
    constructor(player){
        super("Taskmaster", new Cost(3), Card.Type.ACTION + ' '+ Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    }
}
class Abundance extends Card{
    constructor(player){
        super("Abundance", new Cost(4), Card.Type.TREASURE+' '+Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO        
    } 
    do_duration(){
        super.do_duration();
    }
}
class CabinBoy extends Card{
    constructor(player){
        super("CabinBoy", new Cost(4), Card.Type.ACTION+' '+Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO
    }
    do_duration(){
        super.do_duration();
    } 
}
class Crucible extends Card{
    constructor(player){
        super("Crucible", new Cost(4), Card.Type.TREASURE, "Plunder/", player);
    }
    play(){
        
    } 
}
class Flagship extends Card{
    constructor(player){
        super("Flagship", new Cost(4), Card.Type.ACTION+' '+Card.Type.DURATION+' '+Card.Type.COMMAND, "Plunder/", player);
    }
    async play(){
        await getBasicStats().addCoin(2);
        //TODO
    } 
    do_duration(){
        super.do_duration();
    } 
}
class FortuneHunter extends Card{
    constructor(player){
        super("FortuneHunter", new Cost(4), Card.Type.ACTION, "Plunder/", player);
    }
    async play(){
        await getBasicStats().addCoin(1);
        //TODO
    } 
}
class Gondola extends Card{
    constructor(player){
        super("Gondola", new Cost(4), Card.Type.TREASURE+' '+Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    } 
}
class HarborVillage extends Card{
    constructor(player){
        super("HarborVillage", new Cost(4), Card.Type.ACTION, "Plunder/", player);
    }
    async play(){
        await draw1();
        await getBasicStats().addAction(2);
        //TODO
    } 
}
class LandingParty extends Card{
    constructor(player){
        super("LandingParty", new Cost(4), Card.Type.ACTION+' '+Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        
    } 
    do_duration(){
        super.do_duration();
    } 
}
class Mapmaker extends Card{
    constructor(player){
        super("Mapmaker", new Cost(4), Card.Type.ACTION+' '+Card.Type.REACTION, "Plunder/", player);
    }
    play(){
        //TODO        
    } 
}
class Maroon extends Card{
    constructor(player){
        super("Maroon", new Cost(4), Card.Type.Action, "Plunder/", player);
    }
    play(){
        //TODO
    } 
}
class Rope extends Card{
    constructor(player){
        super("Rope", new Cost(4), Card.Type.TREASURE+' '+Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    } 
}
class SwampShack extends Card{
    constructor(player){
        super("SwampShack", new Cost(4), Card.Type.ACTION, "Plunder/", player);
    }
    async play(){
        await getBasicStats().addAction(2);
        //TODO
    } 
}
class Tools extends Card{
    constructor(player){
        super("Tools", new Cost(4), Card.Type.TREASURE, "Plunder/", player);
    }
    play(){
        
    } 
}
class BuriedTreasure extends Card{
    constructor(player){
        super("BuriedTreasure", new Cost(5), Card.Type.TREASURE+' '+Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    } 
}
class Crew extends Card{
    constructor(player){
        super("Crew", new Cost(5), Card.Type.ACTION+' '+Card.Type.DURATION, "Plunder/", player);
    }
    async play(){
        await drawNCards(3);
        //TODO
    } 
    do_duration(){
        super.do_duration();
    } 
}
class Enlarge extends Card{
    constructor(player){
        super("Enlarge", new Cost(5), Card.Type.ACTION+' '+Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    } 
}
class Figurine extends Card{
    constructor(player){
        super("Figurine", new Cost(5), Card.Type.TREASURE, "Plunder/", player);
    }
    async play(){
        await drawNCards(2);
        //TODO
    } 
}
class FirstMate extends Card{
    constructor(player){
        super("FirstMate", new Cost(5), Card.Type.ACTION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
}
class Frigate extends Card{
    constructor(player){
        super("Frigate", new Cost(5), Card.Type.ACTION+' '+ Card.Type.DURATION+' '+Card.Type.ATTACK, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    } 
    attack(){

    }
    is_attacked(){

    }
}
class Longship extends Card{
    constructor(player){
        super("Longship", new Cost(5), Card.Type.ACTION+' '+Card.Type.DURATION, "Plunder/", player);
    }
    async play(){
        await getBasicStats().addAction(2);
        //TODO        
    } 
    do_duration(){
        super.do_duration();
    } 
}
class MiningRoad extends Card{
    constructor(player){
        super("MiningRoad", new Cost(5), Card.Type.ACTION, "Plunder/", player);
    }
    async play(){
        await getBasicStats().addAction(1);
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(2);
        //TODO
    } 
}
class Pendant extends Card{
    constructor(player){
        super("Pendant", new Cost(5), Card.Type.TREASURE, "Plunder/", player);
    }
    play(){
        //TODO
    } 
}
class Pilgrim extends Card{
    constructor(player){
        super("Pilgrim", new Cost(5), Card.Type.ACTION, "Plunder/", player);
    }
    async play(){
        await drawNCards(4);
        //TODO
    } 
}
class Quartermaster extends Card{
    constructor(player){
        super("Quartermaster", new Cost(5), Card.Type.ACTION+' '+Card.Type.DURATION, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    do_duration(){
        super.do_duration();
    } 
}
class SilverMine extends Card{
    constructor(player){
        super("SilverMine", new Cost(5), Card.Type.TREASURE, "Plunder/", player);
    }
    play(){
        //TODO
    } 
}
class Trickster extends Card{
    constructor(player){
        super("Trickster", new Cost(5), Card.Type.ACTION+' '+Card.Type.ATTACK, "Plunder/", player);
    }
    play(){
        //TODO
    } 
    attack(){}
    is_attacked(){}
}
class KingsCache extends Card{
    constructor(player){
        super("KingsCache", new Cost(7), Card.Type.TREASURE, "Plunder/", player);
    }
    play(){
        //TODO
    } 
}



export {JewelledEgg, Search, Pickaxe, WealthyVillage, Cutthroat, SackofLoot};