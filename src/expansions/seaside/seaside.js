import {Card, Cost} from '../cards.js';
import {REASON_START_TURN, 
    REASON_WHEN_GAIN, 
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
Mẫu
class  extends Card{
    constructor(player){
        super("", , Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/", player);
    }
    play(){} 
    do_duration(){
        super.do_duration();
    }
}

*/

class Haven extends Card{    
    constructor(){
        super("Haven", new Cost(2), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
        this.chosen_id = null;
    }
    async play(){        
        await draw1();
        await getBasicStats().addAction(1);

        if(getHand().length() >= 0){
            this.not_discard_in_cleanup = true;
            return new Promise((resolve) => {
                this.chosen = 0;
                this.chosen_id = null;
                getButtonPanel().clear_buttons();

                getHand().mark_cards(
                    function(card){return this.chosen==0 && this.chosen_id==null}.bind(this), 
                    async function(card){
                        await getHand().remove(card);
                        await set_aside_card(card)
                        this.chosen_id = card.id;
                        resolve('Haven finish');
                    }.bind(this),
                'discard');
            });
        } 
    } 
    should_activate(reason, card){
        return reason == REASON_START_TURN && this.chosen_id != null && 
                getSetAside().hasCardId(this.chosen_id);
    }
    async activate(){   
        if(getSetAside().hasCardId(this.chosen_id)){
            let card = await getSetAside().removeCardById(this.chosen_id);
            if(card != undefined){
                await getHand().addCard(card);
            }
        } 
        this.not_discard_in_cleanup = false;
        this.chosen_id = null; 
    }
}
class Lighthouse  extends Card{
    constructor(){
        super("Lighthouse", new Cost(2), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
        this.activate_when_another_attacks = true;
        this.description = 'At the start of your next turn: +$1. Until then, when another player plays an Attack card, it doesnt affect you.';
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_another_attacks = true;
        await getBasicStats().addAction(1);
        await getBasicStats().addCoin(1);
    } 
    do_reaction(){
    }
    should_activate(reason, card){
        return reason == REASON_START_TURN 
                || (reason == REASON_WHEN_BEING_ATTACKED && !getPlayer().can_not_be_attacked);
    }
    async activate(reason, card){
        this.not_discard_in_cleanup = false;
        if(reason == REASON_WHEN_BEING_ATTACKED){
            getPlayer().can_not_be_attacked = true;
        }else if(reason == REASON_START_TURN){
            await getBasicStats().addCoin(1);
            this.activate_when_another_attacks = false;
            return false;
        }
    }
}
class NativeVillage extends Card{
    constructor(){
        super("NativeVillage", new Cost(2), Card.Type.ACTION, "Seaside/");
    }
    async play(){
        await getBasicStats().addAction(2);
        let mat = getNativeVillageMat();
        return new Promise((resolve) => {
            getButtonPanel().clear_buttons();
            if(getDeck().length() <= 0 && mat.length() <= 0){
                resolve('NativeVillage finish');
            }
            if(getDeck().length() > 0){
                getButtonPanel().add_button('Put on mat', async function(){
                    let top_card = await getDeck().pop();
                    if(top_card != undefined) mat.addCard(top_card);
                    resolve('NativeVillage finish');
                }.bind(this));
            } 
            if(mat.length() > 0){
                getButtonPanel().add_button('Take from mat', async function(){
                    while(mat.length() > 0){
                        let card = await mat.pop();
                        await getHand().addCard(card);
                    }
                    resolve('NativeVillage finish');
                }.bind(this));
            }
        });
    }
}
class Astrolabe extends Card{
    constructor(){
        super("Astrolabe", new Cost(3), Card.Type.TREASURE  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        await getBasicStats().addCoin(1);
        await getBasicStats().addBuy(1);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        await getBasicStats().addCoin(1);
        await getBasicStats().addBuy(1);
        return false;
    }
}
class Lookout  extends Card{
    constructor(){
        super("Lookout", new Cost(3), Card.Type.ACTION, "Seaside/");
    }
    async play(){
        await getBasicStats().addAction(1);
        return new Promise(async (resolve)=>{
            let supportHand = getSupportHand();
            supportHand.clear();
            getButtonPanel().clear_buttons();
            if(getDeck().length() < 3){await mix_discard_to_deck()}
            const n = Math.min(getDeck().length(), 3);
            for(let i=0; i<n; i++){
                supportHand.addCard(await getDeck().pop());
            }
            supportHand.state.cards.forEach(card => card.lookout=undefined);
            //supportHand.state.cards.reverse();
            if(supportHand.length() > 0){await this.play_step1();}
            if(supportHand.length() > 0){ await this.play_step2();}
            getDeck().addCardList(supportHand.getCardAll());
            supportHand.clear()  
            resolve('Lookout finish');    
        });
    } 
    async play_step1(){
        return new Promise((resolve) => {
            let supportHand = getSupportHand();   
            supportHand.mark_cards(
                function(){return true;},
                async function(card){
                    await trash_card(card, false);
                    await supportHand.remove(card);                    
                    resolve();
                }.bind(this), 'trash'); 
        });    
    }
    async play_step2(){
        return new Promise((resolve) => {
            let supportHand = getSupportHand();  
            supportHand.mark_cards(
                function(){return true;},
                async function(card){
                    await discard_card(card, false);
                    await supportHand.remove(card);                    
                    resolve();
                }.bind(this), 'discard'); 
        });
    }
}
class Monkey extends Card{
    constructor(){
        super("Monkey", new Cost(3), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.chosen_id_list = [];
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
        this.activate_when_another_gains = true;
        this.description = 'Until your next turn, when the player to your right gains a card, +1 Card. At the start of your next turn, +1 Card.';
    }
    play(){
        this.not_discard_in_cleanup = true;
        this.chosen_id_list = [];
    } 
    should_activate(reason, card){
        return reason == REASON_START_TURN 
                || (REASON_WHEN_ANOTHER_GAIN && card != undefined);
    }
    async activate(reason, card){
        if(reason == REASON_START_TURN){
            this.not_discard_in_cleanup = false;
            await draw1();
            while(this.chosen_id_list.length > 0){
                this.chosen_id_list.pop();
                await draw1();
            }
        } else if(reason == REASON_WHEN_ANOTHER_GAIN){
            this.chosen_id_list.push(card.id);
        }
    }
}
class FishingVillage extends Card{
    constructor(){
        super("FishingVillage", new Cost(3), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        await getBasicStats().addAction(2);
        await getBasicStats().addCoin(1);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        await draw1();
        await getBasicStats().addAction(1);
        return false;
    }
}
class SeaChart extends Card{
    constructor(){
        super("SeaChart", new Cost(3), Card.Type.ACTION, "Seaside/");
    }
    async play(){
        await draw1();
        await getBasicStats().addAction(1);
        let card = getDeck().getTopCard();
        if(card != undefined){
            await reveal_card(card);
            if(getPlayField().getCardAll().find(c => c.name == card.name)){
                await getHand().addCard(card);
            } else {
                await getDeck().addCard(card);
            }
        }
    }
}
class Smugglers extends Card{
    constructor(){
        super("Smugglers", new Cost(3), Card.Type.ACTION, "Seaside/");
        this.description = "Gain a copy of a card costing up to $6 that the player to your right gained on their last turn.";
    }
    play(){
        //TODO
    } 
    do_duration(){}
}
class Warehouse extends Card{
    constructor(){
        super("Warehouse", new Cost(3), Card.Type.ACTION, "Seaside/");
    }
    async play(){
        await drawNCards(3);
        await getBasicStats().addAction(1);

        return new Promise((resolve) => {
            this.chosen = 0;
            this.card_list = [];
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Confirm Discard", async function(){
                if(this.chosen < 3) return;
                for(let i=0; i<this.card_list.length; i++){
                    let card = this.card_list[i];
                    await discard_card(card);
                }            
                getButtonPanel().clear_buttons();
                resolve();
            }.bind(this));

            getHand().mark_cards(function(){return this.chosen<3;}.bind(this),
                function(card){
                    if(this.chosen < 3){
                        this.chosen += 1;
                        this.card_list.push(card);
                    }                
                }.bind(this),
            'discard');
        });
    } 
}
class Blockade extends Card{
    constructor(){
        super("Blockade", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.DURATION + " " + Card.Type.ATTACK, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_another_gains = true;
        this.activate_when_in_play = true;
        this.chosen_id = null;

        this.description = "Gain a card costing up to $4, setting it aside. At the start of your next turn, put it into your hand. While it's set aside, when another player gains a copy of it on their turn, they gain a Curse.";
        //TODO
    }
    play(){
        this.not_discard_in_cleanup = true;
        this.chosen_id = null;
        return new Promise((resolve) => {
            markSupplyPile(
                function(pile){
                    let cost = new Cost(4);
                    return cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity() > 0;
                },
                async function(pile){
                    removeMarkSupplyPile();
                    let new_card = await gain_card(pile, false);
                    if(new_card != undefined){
                        await set_aside_card(new_card);
                        this.chosen_id = new_card.id;
                    }
                    resolve('Blockade finish');
                }.bind(this));
        });
    } 
    attack(){}
    async is_attacked(){console.log('blockade is attacked')
        await gain_card_name('Curse');
    }
    should_activate(reason, card){
        return reason == REASON_START_TURN 
            || (reason == REASON_WHEN_ANOTHER_GAIN && card != undefined 
                    && this.chosen_id != null 
                    && getSetAside().has_card(c => c.id == this.chosen_id && c.name == card.name));
    }
    async activate(reason, card){
        if(reason == REASON_START_TURN){
            this.not_discard_in_cleanup = false;
            if(this.chosen_id != null){
                let chosen_card = getSetAside().removeCardById(this.chosen_id);
                if(chosen_card != undefined){
                    getHand().addCard(chosen_card);
                }
            }
            return false;
        } else if(reason == REASON_WHEN_ANOTHER_GAIN){
            let chosen_card = getSetAside().getCardById(this.chosen_id);
            if(chosen_card != undefined && card.name == chosen_card.name){
                await attack_other(this);
            }
        }
    }
}
class Caravan extends Card{
    constructor(){
        super("Caravan", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        await draw1();
        await getBasicStats().addAction(1);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        await draw1();
        return false;
    }
}
class Cutpurse extends Card{
    constructor(){
        super("Cutpurse", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.ATTACK, "Seaside/");
        this.description = 'Each other player discards a Copper (or reveals a hand with no Copper).';
        //TODO: Test
    }
    async play(){
        await getBasicStats().addCoin(2);
        await attack_other(this);
    } 
    attack(){
    }
    async is_attacked(){
        let copper = getHand().state.cards.find(card => card.name=='Copper');
        if(getHand().length() <= 0) return;
        if(copper==undefined){
            await revealCardList(getHand().getCardAll());
            return;
        }
        //getHand().remove(copper);
        await discard_card(copper);
    }
}
class Island extends Card{
    constructor(){
        super("Island", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.VICTORY, "Seaside/");
    }
    async play(){
        let mat = getIslandMat();
        await getPlayField().remove(this);
        await mat.addCard(this);
        if(getHand().length() > 0){
            return new Promise((resolve) => {
                getHand().mark_cards(
                    ()=> true,
                    async function(card){
                        await getHand().remove(card);
                        mat.addCard(card);  
                        resolve();           
                    }.bind(this),
                'discard');
            });
        }        
    } 
    async add_score(){
        await getBasicStats().addScore(2);
    }
    async is_gained(){
        await getBasicStats().addScore(1);
    }
}
class Sailor extends Card{
    constructor(){
        super("Sailor", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.activate_when_gain = true;
        this.activate_when_in_play = true;
        this.activate_when_start_turn = true;
        this.description = 'Once this turn, when you gain a Duration card, you may play it. At the start of your next turn, +$2 and you may trash a card from your hand.';
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_in_play = true;
        this.activate_when_start_turn = true;
        this.activate_when_gain = true;
        await getBasicStats().addAction(1);
    } 
    async do_duration(){
        super.do_duration();
        await getBasicStats().addCoin(1);
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => {
            this.chosen = 0;
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Cancel", async function(){
                clearFunc();                
                resolve('Sailor finish');
            }.bind(this));

            getHand().mark_cards(
                function(){ return this.chosen<1;}.bind(this),
                async function(card){
                    if(this.chosen <1){
                        clearFunc();
                        this.chosen += 1;
                        await trash_card(card);
                    }
                    resolve('Sailor finish');
                }.bind(this),
            'trash');
        });
    }
    should_activate(reason, card){
        return reason == REASON_START_TURN
            || (reason == REASON_WHEN_GAIN && card!= undefined && card.type.includes('Duration'));
    }
    async activate(reason, card){
        if(reason == REASON_WHEN_GAIN && card!= undefined && card.type.includes('Duration')){ 
            if(getDiscard().has_card(c => c == card)){
                await new Promise(async (resolve) =>{
                    getButtonPanel().clear_buttons();
                    getButtonPanel().add_button(`Play ${card.name}`, async function(){
                        await getDiscard().remove(card);
                        await play_card(card);
                        this.activate_when_gain = true;
                        getButtonPanel().clear_buttons();
                        resolve('Activate Sailor finish');
                    }.bind(this));
                    getButtonPanel().add_button("Don't play", function(){
                        getButtonPanel().clear_buttons();
                        resolve('Activate Sailor finish');
                    }.bind(this));
                });
                
            }
        } else if(reason == REASON_START_TURN){
            this.not_discard_in_cleanup = false;
            this.activate_when_in_play = false;
            this.activate_when_start_turn = false;
            await this.do_duration();
        }
        return false;
    }
}
class Salvager extends Card{
    constructor(){
        super("Salvager", new Cost(4), Card.Type.ACTION, "Seaside/");
    }
    async play(){
        await getBasicStats().addBuy(1);
        if(getHand().length() <= 0) return;
        
        return new Promise((resolve) => { 
            this.chosen = 0;
            this.trash_card = undefined;

            getHand().mark_cards(
                function(card){
                if(this.chosen==0){return true;}
                    return false;}.bind(this), 
                async function(card){
                    if(this.chosen == 0){
                        this.chosen = 1;
                        this.trash_card = card;
                        await getBasicStats().addCoin(card.cost.coin);
                        await trash_card(card);
                        resolve('Salvaer finish');
                    }
                }.bind(this),
            'trash');
        });
    }
}
class TidePools extends Card{
    constructor(){
        super("TidePools", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        await drawNCards(3);
        await getBasicStats().addAction(1); 
    } 
    do_duration(){
        super.do_duration();
        return new Promise((resolve) => {
            this.chosen = 0;
            this.card_list = [];
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Confirm Discard", async function(){
                if(this.chosen < 2) return;
                for(let i=0; i<this.card_list.length; i++){
                    let card = this.card_list[i];
                    await discard_card(card);
                }            
                getButtonPanel().clear_buttons();
                resolve('TidePools finish');
            }.bind(this));

            getHand().mark_cards(
                function(){return this.chosen<2;}.bind(this),
                function(card){
                    if(this.chosen < 2){
                        this.chosen += 1;
                        this.card_list.push(card);
                    }                
                }.bind(this),
            'discard');
        });

    }
    async activate(){
        this.not_discard_in_cleanup = false;
        await this.do_duration();
        return false;
    }
}
class TreasureMap extends Card{
    constructor(){
        super("TreasureMap", new Cost(4), Card.Type.ACTION, "Seaside/");
    }
    async play(){      
        await getPlayField().remove(this);
        await trash_card(this, false);        
        let i = 0;
        let card = undefined;
        while(i < getHand().length()){
            if(getHand().state.cards[i].name == 'TreasureMap'){
                card = getHand().state.cards[i];
                break;
            }
            i++;
        }
        if(card){
            await trash_card(card, true);
            let gold = await gain_card_name('Gold', false);
            if(gold == undefined) return;
            getDeck().addCard(gold);
            gold = await gain_card_name('Gold', false);
            if(gold == undefined) return;
            getDeck().addCard(gold);
            gold =await  gain_card_name('Gold', false);
            if(gold == undefined) return;
            getDeck().addCard(gold);
            gold = await gain_card_name('Gold', false);
            if(gold == undefined) return;
            getDeck().addCard(gold);
        }        
    }
}
class Bazaar extends Card{
    constructor(){
        super("Bazaar", new Cost(5), Card.Type.ACTION, "Seaside/");
    }
    async play(){
        await draw1();
        await getBasicStats().addAction(2);
        await getBasicStats().addCoin(1);
    } 
}
class Corsair extends Card{
    constructor(){
        super("Corsair", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION +" "+ Card.Type.ATTACK, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
        this.description = 'At the start of your next turn, +1 Card. Until then, each other player trashes the first Silver or Gold they play each turn.'
        //TODO
    }
    async play(){
        this.not_discard_in_cleanup = true;
        await getBasicStats().addCoin(2);
    } 
    attack(){
    }
    is_attacked(){}
    should_activate(reason, card){
        return reason == REASON_START_TURN;
    }
    async activate(){
        this.not_discard_in_cleanup = false;
        await draw1();
        return false;
    }
        
}
class MerchantShip extends Card{
    constructor(){
        super("MerchantShip", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        await getBasicStats().addCoin(2);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        await getBasicStats().addCoin(2);
        return false;
    }
}
class Outpost extends Card{
    constructor(){
        super("Outpost", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.description = "If this is the first time you played an Outpost this turn, and the previous turn wasn't yours, then take an extra turn after this one, and you only draw 3 cards for your next hand.	";
    }
    play(){
        if(!getPlayer().extra_turn.cannotPlayExtraTurnByCards){
            getPlayer().extra_turn.playExtraTurn = true;
            getPlayer().extra_turn.cardsCauseExtraTurn.push(this);
        }

    } 
    do_duration(){
        super.do_duration();
    }
    async playExtraTurn(){
        await drawNCards(3);
    }
}
class Pirate extends Card{
    constructor(){
        super("Pirate", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION +" "+Card.Type.REACTION, "Seaside/");
        this.description = 'At the start of your next turn, gain a Treasure costing up to $6 to your hand. When any player gains a Treasure, you may play this from your hand.';
        this.activate_when_start_turn = false;
        this.activate_when_gain = true;
        this.activate_when_another_gains = true;
        this.activate_when_in_play = true;
        this.activate_when_in_hand = true;
        //TODO: Test
    }
    play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
    } 
    do_duration(){
        super.do_duration();
        return new Promise((resolve) => {
            markSupplyPile(
                function(pile){
                    let cost = new Cost(6);
                    return pile.getType().includes("Treasure") && cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity()>0;
                },
                async function(pile){
                    removeMarkSupplyPile();
                    let new_card = await gain_card(pile, false);
                    getHand().addCard(new_card);
                    resolve('Pirate finish');
                }.bind(this));
        });
    }
    do_reaction(){
    }
    should_activate(reason, card){
        return reason == REASON_START_TURN
             || ((reason == REASON_WHEN_ANOTHER_GAIN || reason == REASON_WHEN_GAIN) && card!= undefined && card.type.includes('Treasure'));
    }
    async activate(reason, card){
        if(reason == REASON_WHEN_GAIN || reason == REASON_WHEN_ANOTHER_GAIN){
            if(card== undefined || !card.type.includes('Treasure') || !getHand().has_card(c => c==this)) return;
            await this.activate_step1(card);
        } else if(reason == REASON_START_TURN){
            this.not_discard_in_cleanup = false;
            this.activate_when_start_turn = false;
            await this.do_duration();
            return false;
        }
    }
    activate_step1(){
        return new Promise((resolve)=> {
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Cancel", function(){
                getButtonPanel().clear_buttons();
                resolve('Pirate activate step 1 finish');
            }.bind(this));
            getButtonPanel().add_button('Play Pirate', async function(){
                await getHand().remove(this)
                await play_card(this);
                
                getButtonPanel().clear_buttons();
                resolve('Pirate activate step 1 finish');
            }.bind(this));            
        });
    }
} 
class SeaWitch extends Card{
    constructor(){
        super("SeaWitch", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION + " "+ Card.Type.ATTACK, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        await drawNCards(2);

        await this.attack();
    } 
    async attack(){
        await attack_other(this);
    }
    async is_attacked(){
        await gain_card_name("Curse");
    }
    async activate(){
        this.not_discard_in_cleanup = false;
        await drawNCards(2);
        
        return new Promise((resolve) => {
            this.chosen = 0;
            this.card_list = [];
            setInstruction('Discard 2 cards');
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Confirm Discard", async function(){
                if(this.chosen < 2) return;
                for(let i=0; i<this.card_list.length; i++){
                    let card = this.card_list[i];
                    await discard_card(card);
                }            
                getButtonPanel().clear_buttons();
                setInstruction('');
                resolve();
            }.bind(this));

            getHand().mark_cards(function(){return this.chosen<2;}.bind(this),
                function(card){
                    if(this.chosen < 2){
                        this.chosen += 1;
                        this.card_list.push(card);
                    }                
                }.bind(this),
            'discard');
        });

    }

}
class Tactician extends Card{
    constructor(){
        super("Tactician", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        if(getHand().length() > 0){
            while(getHand().length() > 0){
                let card = await getHand().pop();
                await discard_card(card, false);
            }
            this.not_discard_in_cleanup = true;  
        }
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        await drawNCards(5);
        await getBasicStats().addAction(1);
        await getBasicStats().addBuy(1);
        return false;
    }
}
class Treasury extends Card{
    constructor(){
        super("Treasury", new Cost(5), Card.Type.ACTION, "Seaside/");
    }
    async play(){
        await draw1();
        await getBasicStats().addAction(1);
        await getBasicStats().addCoin(1);
    } 
    is_end_buy_phase(){
        if(!getPlayer().gameState.cards_gained_this_turn.find(card => card.type.includes('Victory'))){
            return new Promise((resolve) => {
                getButtonPanel().clear_buttons();
                getButtonPanel().add_button('Topdeck TREASURY', async function(){
                    await getPlayField().remove(this);
                    getDeck().addCard(this);
                    resolve();
                }.bind(this));
                getButtonPanel().add_button('Cancel', function(){
                    resolve();
                }.bind(this));
            });
        }
    }
}
class Wharf extends Card{
    constructor(){
        super("Wharf", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        await drawNCards(2);
        await getBasicStats().addBuy(1);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        await drawNCards(2);
        await getBasicStats().addBuy(1);
        return false;
    }
}


export {Haven, Lighthouse, NativeVillage, Astrolabe, Lookout, Monkey, FishingVillage, SeaChart, Smugglers, Warehouse,
        Blockade, Caravan, Cutpurse, Island, Sailor, Salvager, TidePools, TreasureMap, Bazaar, Corsair, MerchantShip,
        Outpost, Pirate, SeaWitch, Tactician, Treasury, Wharf};