import {Card, Cost} from '../cards.js';
import {REASON_START_TURN, 
    REASON_WHEN_GAIN, 
    REASON_WHEN_ANOTHER_GAIN,
    effectBuffer,
    REASON_WHEN_PLAY,
    REASON_FIRST_WHEN_ANOTHER_PLAYS} from '../../game_logic/ReactionEffectManager.js';
    
import { findSupplyPile, markSupplyPile, removeMarkSupplyPile } from '../../features/TableSide/Supply.jsx';
import { getPlayer } from '../../player.js';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getDiscard, getDeck, getTrash} from '../../features/PlayerSide/CardPile/CardPile.jsx';
import { getSetAside } from '../../features/PlayerSide/BottomLeftCorner/SideArea.jsx';
import { getNativeVillageMat, getIslandMat } from '../../features/PlayerSide/BottomLeftCorner/PlayerMats.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getSupportHand } from '../../features/SupportHand.jsx';
import { setInstruction } from '../../features/PlayerSide/Instruction.jsx';
import { draw1, drawNCards, mix_discard_to_deck, play_card,
    gain_card, gain_card_name,
    discard_card, trash_card, reveal_card, revealCardList, set_aside_card,
    attack_other} from '../../game_logic/Activity.js';
import { opponentManager } from '../../features/OpponentSide/Opponent.js';
import { getGameState } from '../../game_logic/GameState.js';


/*
Mẫu
class  extends Card{
    constructor(player){
        super("", , Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/", player);
    }
    play(){} 
}

*/

class Haven extends Card{    
    constructor(){
        super("Haven", new Cost(2), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
        this.chosen_id = null;
    }
    async play(){        
        await draw1();
        await getBasicStats().addAction(1);

        if(getHand().length() >= 0){
            this.not_discard_in_cleanup = true;
            await new Promise((resolve) => {
                let chosen = 0;
                this.chosen_id = null;
                getButtonPanel().clear_buttons();

                getHand().mark_cards(
                    function(card){return chosen===0 && !this.chosen_id}.bind(this), 
                    async function(card){
                        getHand().remove_mark();

                        let removed = await getHand().remove(card);
                        if(removed){
                            await set_aside_card(card)
                            this.not_discard_in_cleanup = true;
                            this.activate_when_start_turn = true;
                        }
                        
                        this.chosen_id = card.id;
                        resolve('Haven finish');
                    }.bind(this),
                'discard');
            });
        } 
    } 
    should_activate(reason, card){
        return reason === REASON_START_TURN && this.chosen_id && 
                getSetAside().hasCardId(this.chosen_id);
    }
    async activate(){   
        if(getSetAside().hasCardId(this.chosen_id)){
            let card = await getSetAside().removeCardById(this.chosen_id);
            if(card){
                await getHand().addCard(card);
            }
        } 
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.chosen_id = null; 
    }
}
class Lighthouse  extends Card{
    constructor(){
        super("Lighthouse", new Cost(2), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
        this.activate_first_when_another_plays = false;
        this.description = 'At the start of your next turn: +$1. Until then, when another player plays an Attack card, it doesnt affect you.';
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_first_when_another_plays = true;
        this.activate_when_start_turn = true;
        await getBasicStats().addAction(1);
        await getBasicStats().addCoin(1);
    } 
    should_activate(reason, card){
        return reason === REASON_START_TURN 
                || (reason === REASON_FIRST_WHEN_ANOTHER_PLAYS  && card && card.type.includes(Card.Type.ATTACK));
    }
    async activate(reason, card){
        if(reason === REASON_FIRST_WHEN_ANOTHER_PLAYS){
            getPlayer().unaffected_id_list.push(card.id);
        }else if(reason === REASON_START_TURN){
            await getBasicStats().addCoin(1);
            this.activate_first_when_another_plays = false;
            this.not_discard_in_cleanup = false;
            this.activate_when_start_turn = false;

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
                    if(top_card) await mat.addCard(top_card);
                    resolve('NativeVillage finish');
                });
            } 
            if(mat.length() > 0){
                getButtonPanel().add_button('Take from mat', async function(){
                    while(mat.length() > 0){
                        let card = await mat.pop();
                        await getHand().addCard(card);
                    }
                    resolve('NativeVillage finish');
                });
            }
        });
    }
}
class Astrolabe extends Card{
    constructor(){
        super("Astrolabe", new Cost(3), Card.Type.TREASURE  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        await getBasicStats().addCoin(1);
        await getBasicStats().addBuy(1);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
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
                await supportHand.addCard(await getDeck().pop());
            }
            supportHand.getCardAll().forEach(card => card.lookout=undefined);
            //supportHand.state.cards.reverse();
            if(supportHand.length() > 0){await this.play_step1();}
            if(supportHand.length() > 0){ await this.play_step2();}
            await getDeck().addCardList(supportHand.getCardAll());
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
                },
                'trash'); 
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
                },
                'discard'); 
        });
    }
}
class Monkey extends Card{
    constructor(){
        super("Monkey", new Cost(3), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
        this.activate_when_another_gains = false;
        this.description = 'Until your next turn, when the player to your right gains a card, +1 Card. At the start of your next turn, +1 Card.';
    }
    play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_another_gains = true;
    } 
    should_activate(reason, card, activity){
        return reason === REASON_START_TURN 
                || (REASON_WHEN_ANOTHER_GAIN && card && opponentManager.getRightPlayer().username === activity.username);
    }
    async activate(reason, card, activity){
        if(reason === REASON_START_TURN){
            this.not_discard_in_cleanup = false;
            this.activate_when_another_gains = false;
            this.activate_when_start_turn = false;
            await draw1();
        } else if(reason === REASON_WHEN_ANOTHER_GAIN){
            await draw1();
        }
    }
}
class FishingVillage extends Card{
    constructor(){
        super("FishingVillage", new Cost(3), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        await getBasicStats().addAction(2);
        await getBasicStats().addCoin(1);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
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
        if(card){
            await reveal_card(card);
            if(getPlayField().getCardAll().find(c => c.name === card.name)){
                await getDeck().pop();
                await getHand().addCard(card);
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
        if(opponentManager.getOpponentList().length <= 0) return;
        let rightPlayer = opponentManager.getRightPlayer();
        let cards_gained_last_turn = rightPlayer.cards_gained_this_turn;
        let nameList = cards_gained_last_turn.map(card => card.name);

        if(nameList.length <= 0) return;
        let clearFunc = function(){
            removeMarkSupplyPile();
            setInstruction('');
        }
        setInstruction('Gain a card that the player to your right gained on their last turn');

        let cost = new Cost(6);
        if(!findSupplyPile(pile => pile.getQuantity() > 0 && nameList.includes(pile.getNextCard().name) && cost.isGreaterOrEqual(pile.getCost()))) return;
        return new Promise((resolve) =>{
            markSupplyPile(
                function(pile){
                    return pile.getQuantity() > 0 && nameList.includes(pile.getNextCard().name) && cost.isGreaterOrEqual(pile.getCost());
                }, 
                async function(pile){
                    clearFunc();
                    await gain_card(pile);
                    resolve();
                }
            )
        });
    } 
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
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = false;
        this.activate_when_gain = false;

        this.chosen_id = null;
        this.chosen_name = '';
        this.turn = -1;

        this.description = "Gain a card costing up to $4, setting it aside. At the start of your next turn, put it into your hand. While it's set aside, when another player gains a copy of it on their turn, they gain a Curse.";
    }
    play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
        this.chosen_id = null;
        return new Promise((resolve) => {
            setInstruction('Blockade: Gain a card costing up to $4, set it aside.');
            markSupplyPile(
                function(pile){
                    let cost = new Cost(4);
                    return pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost());
                },
                async function(pile){
                    removeMarkSupplyPile();
                    setInstruction('');
                    let new_card = await gain_card(pile, getSetAside());
                    if(new_card && getSetAside().getCardById(new_card.id)){
                        await this.attack(new_card);
                        this.chosen_id = new_card.id;
                    }
                    resolve('Blockade finish');
                }.bind(this));
        });
    } 
    async attack(card){
        await attack_other(this, `${card.name}`);
    }
    is_attacked(cardName){
        if(!cardName) throw new Error("Invalid cardName");
        this.turn = getPlayer().turn;
        this.activate_when_gain = true;
        effectBuffer.addCard(this);
        this.chosen_name = cardName;
    }
    removeSelf(){
        this.turn = -1;
        effectBuffer.removeCardById(this.id);
        this.chosen_name = '';
    }
    should_activate(reason, card){
        if(reason === REASON_START_TURN) return true;
        if(reason !== REASON_WHEN_GAIN) return false;


        if(this.turn + 1 !== getPlayer().turn || !effectBuffer.getCardById(this.id) || !this.chosen_name){
            this.removeSelf();
            return false;
        }
        return card && card.name === this.chosen_name;
    }
    async activate(reason, card){
        if(reason === REASON_START_TURN){
            this.not_discard_in_cleanup = false;
            this.activate_when_start_turn = false;
            if(this.chosen_id){
                let chosen_card = await getSetAside().removeCardById(this.chosen_id);
                if(chosen_card){
                    await getHand().addCard(chosen_card);
                }
            }
            return false;
        } else if(reason === REASON_WHEN_GAIN){
            await gain_card_name('Curse');
        }
    }
}
class Caravan extends Card{
    constructor(){
        super("Caravan", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        await draw1();
        await getBasicStats().addAction(1);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        await draw1();
        return false;
    }
}
class Cutpurse extends Card{
    constructor(){
        super("Cutpurse", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.ATTACK, "Seaside/");
        this.description = 'Each other player discards a Copper (or reveals a hand with no Copper).';
    }
    async play(){
        await getBasicStats().addCoin(2);
        await attack_other(this);
    } 
    attack(){
    }
    async is_attacked(){
        let copper = getHand().getCardAll().find(card => card.name==='Copper');
        if(getHand().length() <= 0) return;
        if(!copper){
            await revealCardList(getHand().getCardAll());
            return;
        }
        await discard_card(copper);
    }
}
class Island extends Card{
    constructor(){
        super("Island", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.VICTORY, "Seaside/");
    }
    getInitAmount(){
        let player_count = opponentManager.getOpponentList().length + 1;
        if(player_count <= 2){
            return 8;
        }
        return 12;
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
                        await mat.addCard(card);  
                        resolve();           
                    },
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
        this.activate_when_gain = false;
        this.activate_when_in_play = true;
        this.activate_when_start_turn = false;
        this.activate_when_gain = false;
        this.description = 'Once this turn, when you gain a Duration card, you may play it. At the start of your next turn, +$2 and you may trash a card from your hand.';
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_in_play = true;
        this.activate_when_start_turn = true;
        this.activate_when_gain = true;
        await getBasicStats().addAction(1);
    } 
    should_activate(reason, card,  activity, cardLocationTrack){
        return reason === REASON_START_TURN
            || (reason === REASON_WHEN_GAIN && card && card.type.includes(Card.Type.DURATION));
    }
    async activate(reason, card,  activity, cardLocationTrack){
        if(reason === REASON_WHEN_GAIN && card && card.type.includes(Card.Type.DURATION)){ 
            if(!card || !cardLocationTrack) return;
            let cardLocation = cardLocationTrack.getLocation();

            if(cardLocation && cardLocation.getCardById(card.id)){
                await new Promise(async (resolve) =>{
                    getButtonPanel().clear_buttons();
                    getButtonPanel().add_button(`Play ${card.name}`, async function(){
                        getButtonPanel().clear_buttons();
                        await cardLocation.removeCardById(card.id);
                        cardLocationTrack.setLocation();
                        await play_card(card);
                        this.activate_when_gain = true;
                        resolve('Activate Sailor finish');
                    }.bind(this));
                    getButtonPanel().add_button("Decline", function(){
                        getButtonPanel().clear_buttons();
                        resolve('Activate Sailor finish');
                    });
                });
                
            }
        } else if(reason === REASON_START_TURN){
            this.not_discard_in_cleanup = false;
            this.activate_when_in_play = false;
            this.activate_when_start_turn = false;
            await this.activate_step1();
        }
        return false;
    }
    async activate_step1(){
        await getBasicStats().addCoin(1);
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => {
            let chosen = 0;
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
                getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            setInstruction('You may trash a card from your hand.');

            getButtonPanel().add_button("Cancel", async function(){
                clearFunc();                
                resolve('Sailor finish');
            });

            getHand().mark_cards(
                function(){ return chosen<1;},
                async function(card){
                    if(chosen <1){
                        clearFunc();
                        chosen += 1;
                        await trash_card(card);
                    }
                    resolve('Sailor finish');
                },
            'trash');
        });
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
            let chosen = 0;

            getHand().mark_cards(
                function(card){
                    return chosen === 0;
                }, 
                async function(card){
                    if(chosen === 0){
                        chosen += 1;
                        getHand().remove_mark();

                        await getBasicStats().addCoin(card.cost.coin);
                        await trash_card(card);
                        resolve('Salvaer finish');
                    }
                },
            'trash');
        });
    }
}
class TidePools extends Card{
    constructor(){
        super("TidePools", new Cost(4), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        await drawNCards(3);
        await getBasicStats().addAction(1); 
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        await this.activate_step1();
        return false;
    }
    activate_step1(){
        if(getHand().getLength() < 2) return;
        return new Promise((resolve) => {
            let chosen = 0;
            let cardList = [];
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
                getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            setInstruction('Discard 2 cards.');

            getButtonPanel().add_button("Confirm Discard", async function(){
                if(chosen < 2) return;
                clearFunc();
                for(let i=0; i<cardList.length; i++){
                    let card = cardList[i];
                    await discard_card(card);
                }            
                resolve('TidePools finish');
            });

            getHand().mark_cards(
                function(){return chosen<2;},
                function(card){
                    if(chosen < 2){
                        chosen += 1;
                        cardList.push(card);
                    }                
                },
                'discard',
            );
        });
    }
}
class TreasureMap extends Card{
    constructor(){
        super("TreasureMap", new Cost(4), Card.Type.ACTION, "Seaside/");
    }
    async play(){      
        let removed = await getPlayField().remove(this);
        if(!removed) return;
        await trash_card(this, false);        
        let i = 0;
        let card = undefined;
        while(i < getHand().length()){
            if(getHand().getCardAll()[i].name === 'TreasureMap'){
                card = getHand().getCardAll()[i];
                break;
            }
            i++;
        }
        if(card){
            await trash_card(card, true);
            let gold = await gain_card_name('Gold', getDeck());
            await gain_card_name('Gold', getDeck());
            await gain_card_name('Gold', getDeck());
            await gain_card_name('Gold', getDeck());
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
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = false;

        this.activate_when_play = false;
        this.turn = -1;

        this.description = 'At the start of your next turn, +1 Card. Until then, each other player trashes the first Silver or Gold they play each turn.'
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
        await getBasicStats().addCoin(2);

        await this.attack();
    } 
    async attack(){
        await attack_other(this);
    }
    is_attacked(){
        effectBuffer.addCard(this);
        this.activate_when_play = true;
        this.turn = getPlayer().turn;
    }
    should_activate(reason, card){
        if(reason === REASON_START_TURN) return true;
        if(reason !== REASON_WHEN_PLAY) return false;

        if(this.turn + 1 !== getPlayer().turn){
            effectBuffer.removeCardById(this.id);
            this.activate_when_play = false;
            return false;
        }
        return card &&  (card.name === "Silver" || card.name === "Gold")
    }
    async activate(reason, card){
        if(reason === REASON_START_TURN){
            this.not_discard_in_cleanup = false;
            this.activate_when_start_turn = false;
            await draw1();
            return false;
        } else if(reason === REASON_WHEN_PLAY){
            effectBuffer.removeCardById(this.id);
            this.activate_when_play = false;

            let removed = await getPlayField().removeCardById(card.id);
            if(removed) await trash_card(card, false);
            
        }
    }
        
}
class MerchantShip extends Card{
    constructor(){
        super("MerchantShip", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        await getBasicStats().addCoin(2);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        await getBasicStats().addCoin(2);
        return false;
    }
}
class Outpost extends Card{
    constructor(){
        super("Outpost", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.description = "If this is the first time you played an Outpost this turn, and the previous turn wasn't yours, then take an extra turn after this one, and you only draw 3 cards for your next hand.";
        //TODO: Test
    }
    play(){
        if(!getPlayer().extra_turn.cannotPlayExtraTurnByCards){
            getPlayer().extra_turn.playExtraTurn = true;
            getPlayer().extra_turn.cardsCauseExtraTurn.push(this);
        }

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
    }
    play(){
        this.activate_when_in_play = true;
        this.activate_when_gain = false;
        this.activate_when_another_gains = false;
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
    } 

    should_activate(reason, card){
        return reason === REASON_START_TURN
             || ((reason === REASON_WHEN_ANOTHER_GAIN || reason === REASON_WHEN_GAIN) && card && card.type.includes(Card.Type.TREASURE));
    }
    async activate(reason, card){
        if(reason === REASON_WHEN_GAIN || reason === REASON_WHEN_ANOTHER_GAIN){
            if(!card|| !card.type.includes(Card.Type.TREASURE) || !getHand().has_card(c => c.id === this.id)) return;
            await this.activate_step1(card);
        } else if(reason === REASON_START_TURN){
            this.activate_when_in_play = false;
            this.not_discard_in_cleanup = false;
            this.activate_when_start_turn = false;
            this.activate_when_gain = true;
            this.activate_when_another_gains = true;
            await this.activate_step2();
            return false;
        }
    }
    activate_step1(){
        return new Promise((resolve)=> {
            getButtonPanel().clear_buttons();
            
            getButtonPanel().add_button('Play Pirate', async function(){
                await getHand().remove(this)
                await play_card(this);
                
                getButtonPanel().clear_buttons();
                resolve('Pirate activate step 1 finish');
            }.bind(this)); 

            getButtonPanel().add_button("Decline", function(){
                getButtonPanel().clear_buttons();
                resolve('Pirate activate step 1 finish');
            });           
        });
    }
    activate_step2(){
        return new Promise((resolve) => {
            let clearFunc = function(){
                setInstruction('');
                removeMarkSupplyPile();
            }
            setInstruction('Gain a Treasure costing up to $6 to your hand.');

            markSupplyPile(
                function(pile){
                    let cost = new Cost(6);
                    return pile.getType().includes(Card.Type.TREASURE) && cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity()>0;
                },
                async function(pile){
                    clearFunc();
                    let new_card = await gain_card(pile, getHand()); 
                    resolve('Pirate finish');
                });
        });
    }
} 
class SeaWitch extends Card{
    constructor(){
        super("SeaWitch", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION + " "+ Card.Type.ATTACK, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
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
        this.activate_when_start_turn = false;
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
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        if(getHand().length() > 0){
            while(getHand().length() > 0){
                let card = await getHand().pop();
                await discard_card(card, false);
            }
            this.not_discard_in_cleanup = true;  
            this.activate_when_start_turn = true;
        }
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
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
        if(!getGameState().cards_gained_this_turn.find(card => card.type.includes(Card.Type.VICTORY))){
            return new Promise((resolve) => {
                getButtonPanel().clear_buttons();
                getButtonPanel().add_button('Topdeck TREASURY', async function(){
                    getButtonPanel().clear_buttons();
                    await getPlayField().remove(this);
                    await getDeck().addCard(this);
                    resolve();
                }.bind(this));
                getButtonPanel().add_button('Cancel', function(){
                    getButtonPanel().clear_buttons();
                    resolve();
                });
            });
        }
    }
}
class Wharf extends Card{
    constructor(){
        super("Wharf", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.DURATION, "Seaside/");
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        await drawNCards(2);
        await getBasicStats().addBuy(1);
    } 
    async activate(){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        await drawNCards(2);
        await getBasicStats().addBuy(1);
        return false;
    }
}


export {Haven, Lighthouse, NativeVillage, Astrolabe, Lookout, Monkey, FishingVillage, SeaChart, Smugglers, Warehouse,
        Blockade, Caravan, Cutpurse, Island, Sailor, Salvager, TidePools, TreasureMap, Bazaar, Corsair, MerchantShip,
        Outpost, Pirate, SeaWitch, Tactician, Treasury, Wharf};