import {Card, Cost} from '../cards.js';
import {REASON_START_TURN, REASON_END_TURN, 
    REASON_WHEN_GAIN, 
    REASON_FIRST_WHEN_ANOTHER_PLAYS} from '../../game_logic/ReactionEffectManager.js';

import { markSupplyPile, removeMarkSupplyPile } from '../../features/TableSide/Supply.jsx';
import { getPlayer } from '../../player.js';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getDiscard, getDeck } from '../../features/PlayerSide/CardPile/CardPile.jsx';
import { getSetAside } from '../../features/PlayerSide/BottomLeftCorner/SideArea.jsx';

import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getSupportHand } from '../../features/SupportHand.jsx';
import { setInstruction } from '../../features/PlayerSide/Instruction.jsx';
import { drawNCards, mix_discard_to_deck, play_card,
    gain_card, gain_card_name, 
    discard_card, trash_card, reveal_card, set_aside_card,
    attack_other,
    mayPlayCardFromHand} from '../../game_logic/Activity.js';

/*
class  extends Card{
    constructor(player){
        super("", , Card.Type.TREASURE, "Plunder/", player);
    }
    play(){
        
    } 
}
*/
//LOOT 
class Amphora extends Card{
    constructor(player){
        super("Amphora", new Cost(7), Card.Type.TREASURE + " " + Card.Type.DURATION + " " + Card.Type.LOOT, "Plunder/Loot/", player);
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    play(){
        return new Promise((resolve) => {
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('NOW', async function(){
                getButtonPanel().clear_buttons();
                await getBasicStats().addBuy(1);
                await getBasicStats().addCoin(3);
                this.not_discard_in_cleanup = false;              
                resolve();
            }.bind(this));
            getButtonPanel().add_button('NEXT TURN', function(){
                getButtonPanel().clear_buttons();
                this.not_discard_in_cleanup = true;
                resolve();
            }.bind(this));
        });
    } 
    should_activate(reason, card){
        return reason === REASON_START_TURN;
    }
    async activate(reason, card){
        this.not_discard_in_cleanup = false;
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(3);
    }
}
class Doubloons extends Card{
    constructor(player){
        super("Doubloons", new Cost(7), Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
    }
    async play(){
        await getBasicStats().addCoin(3);
    } 
    async is_gained(){
        await gain_card_name("Gold");
    }
}
class EndlessChalice extends Card{
    constructor(player){
        super("EndlessChalice", new Cost(7), Card.Type.TREASURE + " "+ Card.Type.DURATION + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        this.activate_when_in_play = true;
    }
    async play(){
        await getBasicStats().addCoin(1);
        await getBasicStats().addBuy(1);
    } 
    should_activate(reason, card){
        return reason === REASON_START_TURN;
    }
    async activate(reason, card){
        await this.play();
    }
}
class Figurehead extends Card{
    constructor(player){
        super("Figurehead", new Cost(7), Card.Type.TREASURE + " " + Card.Type.DURATION + " " + Card.Type.LOOT, "Plunder/Loot/", player);
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        await getBasicStats().addCoin(3);
    }
    should_activate(reason, card){
        return reason === REASON_START_TURN;
    }
    async activate(){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        await drawNCards(2);
    }
}
class Hammer extends Card{
    constructor(player){
        super("Hammer", new Cost(7), Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
    }
    async play(){
        await getBasicStats().addCoin(3);
        return new Promise((resolve) => {
            markSupplyPile(
                function(pile){
                    let cost = new Cost(4);
                    return pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost());
                },
                async function(pile){
                    removeMarkSupplyPile();
                    await gain_card(pile);                
                    resolve('Hammer finish');
                }
            );
        });
    } 
}
class Insignia extends Card{
    constructor(player){
        super("Insignia", new Cost(7), Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
        this.activate_when_gain = true;
        this.activate_when_in_play = true;
        this.turn = -1;
        this.description = 'This turn, when you gain a card, you may put it onto your deck.';
    }
    async play(){
        await getBasicStats().addCoin(3);
        this.turn = getPlayer().turn;
    }
    should_activate(reason, card, activity, cardLocationTrack){
        return reason === REASON_WHEN_GAIN
            && card
            && getPlayer().turn === this.turn
            //&& getDiscard().has_card(c => c.id === card.id);
    }
    async activate(reason, card, activity, cardLocationTrack){
        if(!card || !cardLocationTrack) return;
        let cardLocation = cardLocationTrack.getLocation();
        if(!cardLocation || !cardLocation.getCardById(card.id)) return;

        return new Promise((resolve) =>{
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button(`Top deck ${card.name}`, async function(){
                getButtonPanel().clear_buttons();
                let removed = await cardLocation.removeCardById(card.id);
                if(removed){
                     await getDeck().topDeck(card);
                     if(cardLocation.id !== getDeck().id) cardLocationTrack.setLocation();
                }
                resolve('Insignia finish');
            });
            getButtonPanel().add_button('Cancel', function(){
                getButtonPanel().clear_buttons();
                resolve('Insignia finish');
            });
        });
    }
}
class Jewels extends Card{
    constructor(player){
        super("Jewels", new Cost(7), Card.Type.TREASURE + " " + Card.Type.DURATION + " " + Card.Type.LOOT, "Plunder/Loot/", player);
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        this.activate_when_in_play = true;
    }
    async play(){
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        await getBasicStats().addCoin(3);
    }
    
    should_activate(reason, card){
        return reason === REASON_START_TURN;
    }
    async activate(reason, card){
        this.not_discard_in_cleanup = false;
        this.activate_when_start_turn = false;
        if(getPlayField().has_card(c => c === this)){
            await getPlayField().remove(this);
            await getDeck().bottomDeck(this);
        }
    }
}
class Orb extends Card{
    constructor(player){
        super("Orb", new Cost(7), Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
    }
    async play(){
        if(getDiscard().length() <= 0){
            await getBasicStats().addBuy(1);
            await getBasicStats().addCoin(3);
            return;
        }
        return new Promise(async (resolve) => {
            let supportHand = getSupportHand();
            supportHand.clear();
            supportHand.state.cards.forEach(card => card.orb=undefined);
            while(getDiscard().length() > 0){
                await supportHand.addCard(await getDiscard().pop());
            }
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                supportHand.remove_mark();
                setInstruction('');
            }
            getButtonPanel().clear_buttons();
            setInstruction('Choose one: Play an Action or Treasure; or +1 Buy +$3');

            getButtonPanel().add_button("+1 Buy +3$", async function(){
                clearFunc();
                await getBasicStats().addBuy(1);
                await getBasicStats().addCoin(3);
                supportHand.setCardAll(supportHand.state.cards.filter(card => !card.orb));
                await getDiscard().addCardList(supportHand.getCardAll());

                supportHand.clear();           
                resolve('Orb finish');

            });

            supportHand.mark_cards(card => card.type.includes('Treasure') || card.type.includes('Action'),
                async function(card){
                    clearFunc();
                    card.orb = true; 
                    supportHand.setCardAll(supportHand.state.cards.filter(card => !card.orb))
                    await getDiscard().addCardList(supportHand.state.cards);

                    supportHand.clear();
                    await play_card(card);            
                    resolve('Orb finish');
                });            
        });
    } 
}
class PrizeGoat extends Card{
    constructor(player){
        super("PrizeGoat", new Cost(7), Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
    }
    async play(){
        await getBasicStats().addCoin(3);
        await getBasicStats().addBuy(1);
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => {
            let chosen = 0;
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                getHand().remove_mark();
                setInstruction('');
            }
            getButtonPanel().clear_buttons();
            setInstruction('You may trash a card from your hand');

            getButtonPanel().add_button("Cancel", async function(){
                clearFunc()
                resolve('PrizeGoat finish');
            });

            getHand().mark_cards(
                function(){return chosen<1;}, 
                async function(card){
                    if(chosen === 0){
                        chosen += 1;
                        clearFunc();
                        await trash_card(card);
                    }
                    resolve('PrizeGoat finish');
                },
                'trash');
        });
    } 
}
class PuzzleBox extends Card{
    constructor(player){
        super("PuzzleBox", new Cost(7), Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
        this.not_discard_in_cleanup = false;
        this.activate_when_end_turn = true;
        this.activate_when_in_play = true;
        this.chosen_id = null;
        this.description = "You may set aside a card from your hand face down. Put it into your hand at end of turn."
    }
    async play(){
        await getBasicStats().addCoin(3);
        await getBasicStats().addBuy(1);
        if(getHand().length() <= 0){return;}
        return new Promise((resolve) => {
            this.chosen = 0;
            this.chosen_card = undefined;
            let clearFunc = function(){
                getHand().remove_mark();
                getButtonPanel().clear_buttons();
                setInstruction('');
            }
            getButtonPanel().clear_buttons();
            setInstruction('You may set aside a card from your hand face down');

            getButtonPanel().add_button('Cancel', function(){
                clearFunc();
                this.not_discard_in_cleanup = false;
                resolve('PuzzleBox finish');
            }.bind(this));
            getHand().mark_cards(
                function(card){ return this.chosen <= 0;}.bind(this),
                function(card){
                    clearFunc();
                    this.chosen += 1;
                    getHand().remove(card);
                    set_aside_card(card);
                    this.chosen_card = card;
                    this.chosen_id = card.id;
                    this.not_discard_in_cleanup = true;
                    resolve('PuzzleBox finish');
                }.bind(this),
            'discard');
        });
    }   
    should_activate(reason, card){
        if(!this.chosen_id|| !getSetAside().has_card(c => c.id === this.chosen_id)){
            this.not_discard_in_cleanup = false;
            return false;
        }
        return reason === REASON_END_TURN;
    }  
    async activate(reason, card){
        this.not_discard_in_cleanup = false;
        if(this.chosen_id && getSetAside().has_card(c => c.id === this.chosen_id)){
            let card = await getSetAside().removeCardById(this.chosen_id);
            await getHand().addCard(card);
        }
        await getPlayField().remove(this);
        await discard_card(this, false);
    }
}
class Sextant extends Card{
    constructor(player){
        super("Sextant", new Cost(7), Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
    }
    async play(){ 
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(3);
        
        let supportHand = getSupportHand();
        supportHand.clear();
        if(getDeck().length() < 5){await mix_discard_to_deck()}
        const n = Math.min(getDeck().length(), 5);
        if(n <= 0) return;
        for(let i=0; i<n; i++){
            await supportHand.addCard(await getDeck().pop());
        }
        supportHand.state.cards.forEach(card => card.sextant=undefined);
        await this.play_step1();
        
        while(supportHand.length() >= 1){
            await this.play_step2();
        }
        supportHand.clear();
    } 
    play_step1(){
        return new Promise(async (resolve)=>{
            let supportHand = getSupportHand(); 
            let clearFunc = function(){
                getButtonPanel().clear_buttons(); 
                supportHand.remove_mark();
                setInstruction('');
            }   
            getButtonPanel().clear_buttons();      
            setInstruction('Discard any number of cards');            

            supportHand.mark_cards(
                function(){return true;},
                function(card){
                    card.sextant = true;
                }, 
            'discard'); 
            getButtonPanel().add_button("Confirm Discarding", async function(){   
                clearFunc();
                let i = 0; 
                while(i < supportHand.length()){
                    let card = supportHand.state.cards[i];
                    if(card.sextant){
                        await supportHand.remove(card);
                        await discard_card(card, false);
                        continue;
                    }
                    i++;
                }      
                resolve('Sextant finish');
            });         
        });
    }
    async play_step2(){
        let supportHand = getSupportHand(); 
        if(supportHand.length() === 1){
            let card = supportHand.state.cards[0];
            await supportHand.remove(card);
            getDeck().addCard(card);
            return;
        }
        if(supportHand.length() <= 0) return;
        return new Promise((resolve) => {
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                supportHand.remove_mark();
                setInstruction('');
            }
            getButtonPanel().clear_buttons();
            setInstruction('Put the rest back in any order');

            getButtonPanel().add_button('OK', async function(){
                clearFunc();
                await getDeck().addCardList(supportHand.state.cards.reverse());
                supportHand.clear();
                resolve();
            });
            supportHand.mark_cards(
                function(){return true;}, 
                async function(card){
                    clearFunc();
                    await supportHand.remove(card);
                    await getDeck().addCard(card);
                    resolve();
                });
        });
    }
}
class Shield extends Card{
    constructor(player){
        super("Shield", new Cost(7), Card.Type.TREASURE + " "+ Card.Type.REACTION + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
        this.activate_first_when_another_plays = true;
        this.activate_when_in_hand = true;
        this.description = 'When another player plays an Attack, you may first reveal this from your hand to be unaffected.';
    }
    async play(){
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(3);
    } 
    should_activate(reason, card){
        return reason === REASON_FIRST_WHEN_ANOTHER_PLAYS && card && card.type.includes(Card.Type.ATTACK);
    }
    activate(reason, card){
        return new Promise((resolve) =>{
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
            }
            getButtonPanel().clear_buttons();
            setInstruction('Shield: You may reveal Shield to be unaffected by Attack.');

            getButtonPanel().add_button('Reveal Shield', async function(){
                clearFunc();
                await reveal_card(this);
                getPlayer().unaffected_id_list.push(card.id);
                resolve();
            }.bind(this));
            getButtonPanel().add_button('Decline', function(){
                clearFunc();
                resolve();
            });
        });
    }
}
class SpellScroll extends Card{
    constructor(player){
        super("SpellScroll", new Cost(7), Card.Type.ACTION + " "+ Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
    }
    async play(){//TODO: Chua hoat dong dung voi Nomad Camp
        let removed = await getPlayField().removeCardById(this.id);
        if(!removed) return;
        await trash_card(this, false);
        
        await new Promise((resolve) => {
            markSupplyPile(
                function(pile){
                    return pile.getQuantity() > 0 &&  this.cost.isGreaterThan(pile.getCost());
                }.bind(this),
                async function(pile){
                    removeMarkSupplyPile();
                    let new_card = await gain_card(pile);
                    if(new_card 
                        && (new_card.type.includes(Card.Type.ACTION) || new_card.type.includes(Card.Type.TREASURE))
                        && getDiscard().getCardById(new_card.id)
                    ){
                        await this.play_step1(new_card);
                    }
                    resolve('SpellScroll finish');
                }.bind(this));
        });
    } 
    play_step1(card){
        return new Promise((resolve) =>{
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
            }
            getButtonPanel().clear_buttons();
            setInstruction(`You may play ${card.name}`);

            getButtonPanel().add_button(`Play ${card.name}`, async function(){
                clearFunc();
                let removed = await getDiscard().removeCardById(card.id);
                if(removed) await play_card(card);
                resolve();
            });

            getButtonPanel().add_button("Decline", function(){
                clearFunc();
                resolve();
            });
        })
    }
}
class Staff extends Card{
    constructor(player){
        super("Staff", new Cost(7), Card.Type.TREASURE + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
    }
    async play(){
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(3);
        return new Promise((resolve) => {
            let clearFunc = function(){
                getHand().remove_mark();
                getButtonPanel().clear_buttons();
                setInstruction('');

                getSupportHand().clear();
                getSupportHand().hide();
                getDeck().removeCanSelect();
            }
            getButtonPanel().clear_buttons();
            setInstruction('Staff: You may play an Action from your hand');

            getButtonPanel().add_button("Decline", async function(){
                clearFunc();
                resolve('Staff finish');
            });


            let mayPlayAction = mayPlayCardFromHand(
                card => card.type.includes(Card.Type.ACTION), 
                async function(card){
                    clearFunc();
                    await play_card(card);
                    resolve('Staff finish');
                }
            );
            if(!mayPlayAction){
                clearFunc();
                resolve();
            }

            /*
            let is_marked = getHand().mark_cards(
                card => card.type.includes('Action'), 
                async function(card){
                    clearFunc();
                    await getHand().remove(card);
                    await play_card(card, true);
                    resolve('Staff finish');
                });
            if(!is_marked){
                clearFunc();
                resolve();
            }
                */
        });
    } 
}

class Sword extends Card{
    constructor(player){
        super("Sword", new Cost(7), Card.Type.TREASURE+ " " +  Card.Type.ATTACK + " "  + Card.Type.LOOT, "Plunder/Loot/", player);
    }
    async play(){
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(3);

        await attack_other(this);
    } 
    async attack(){}
    is_attacked(){
        if(getHand().length() <= 4){return;}
        return new Promise((resolve) => {
            let chosen = 0;
            let cardList = [];
            let n = Math.max(getHand().length() - 4, 0);
            let clearFunc = function(){
                getHand().remove_mark();
                getButtonPanel().clear_buttons();
                setInstruction('');
            }
            getButtonPanel().clear_buttons();
            setInstruction('Discard down tot 4 cards in hand');

            getButtonPanel().add_button("OK", async function(){
                clearFunc();
                if(chosen < n) return;
                for(let card of cardList){
                    await discard_card(card);
                }
                resolve('Sword finish');
            });

            getHand().mark_cards(
                function(card){return chosen < n;},
                function(card){
                    if(chosen < n){
                        chosen += 1;
                        cardList.push(card);
                        card.sword = true;
                    }
                },
                'discard');
            
        });
    }

}

export {Amphora, Doubloons, EndlessChalice, Figurehead, Hammer, Insignia,
    Jewels, Orb, PrizeGoat, PuzzleBox, Sextant, Shield, SpellScroll,
    Staff, Sword};