import { Event } from '../landscape_effect.js';
import { Card, Cost } from '../cards.js';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getDiscard, getDeck } from '../../features/PlayerSide/CardPile/CardPile.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getExile, getSetAside } from '../../features/PlayerSide/BottomLeftCorner/SideArea.jsx';
import { getSupportHand } from '../../features/SupportHand.jsx';

import { getPlayer } from '../../player.js';
import { markSupplyPile, removeMarkSupplyPile } from '../../features/TableSide/Supply.jsx';
import { findSupplyPile, findSupplyPileAll } from '../../features/TableSide/SupplyPile.jsx';
import { create_name_input } from '../../Components/user_input/TextInput.jsx';
import { drawNCards, mix_discard_to_deck, play_card,
    gain_card, gain_card_name, discard_card, trash_card, exile_card, set_aside_card,
    mayPlayCardFromHand,
    } from '../../game_logic/Activity.js';
import {REASON_START_TURN, REASON_WHEN_ANOTHER_GAIN} from '../../game_logic/ReactionEffectManager.js';
import { setInstruction } from '../../features/PlayerSide/Instruction.jsx';
/*
class  extends Event{
    constructor(player){
        super('', , "Menagerie/Event/", player);
    }
    is_buyed(){

    }
}
*/
class Delay extends Event{
    constructor(player){
        super('Delay', new Cost(0), "Menagerie/Event/", player);
        this.turn = -1;
        this.chosen_id = null
        this.activate_when_start_turn = true;
        this.activate_currently = false;
        this.description = 'You may set aside an Action card from your hand. At the start of your next turn, play it.';
    }
    is_buyed(){
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => {
            let chosen = 0;
            this.chosen_id = null;
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Cancel', function(){
                clearFunc();
                resolve('Delay finish');
            });
            let is_marked = getHand().mark_cards(
                function(card){return chosen === 0 && !this.chosen_id && card.type.includes(Card.Type.ACTION)}.bind(this),
                async function(card){
                    clearFunc();
                    chosen += 1;
                    if(chosen === 1){
                        this.chosen_id = card.id;
                        await getHand().remove(card);
                        await set_aside_card(card)

                        this.turn = getPlayer().turn;
                        this.activate_currently = true;
                        resolve('Delay finish');
                    }
                }.bind(this),
                'discard',
            );
            
            if(!is_marked){
                getButtonPanel().clear_buttons();
                resolve('Delay finish');
            }
        });
    }
    should_activate(reason, card){
        return reason === REASON_START_TURN && this.chosen_id
             && this.activate_currently && getPlayer().turn === this.turn + 1
             && getSetAside().hasCardId(this.chosen_id);;
    }
    async activate(reason, card){
        if(this.chosen_id == null) return;
        if(getSetAside().hasCardId(this.chosen_id)){
            let card = getSetAside().removeCardById(this.chosen_id);
            if(card){
                await play_card(card, true);
            }
        } 
        this.activate_currently = false;
        this.chosen_id = null;
    }
}
class Desperation extends Event{
    constructor(player){
        super('Desperation', new Cost(0), "Menagerie/Event/", player);
    }
    is_buyed(){
        if(getPlayer().gameState.cards_buyed_this_turn.filter(c => c.name===this.name).length > 1) return;
        let curse_pile = findSupplyPile(function(pile){return pile.getQuantity()>0 && pile.getName() === 'Curse'});
        if(!curse_pile) return;
        return new Promise((resolve) => {
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Gain Curse', async function(){
                getButtonPanel().clear_buttons();
                await gain_card(curse_pile);
                await getBasicStats().addBuy(1);
                await getBasicStats().addCoin(2);
                resolve('Desperation finish');
            });
            getButtonPanel().add_button('Don\'t gain', function(){
                getButtonPanel().clear_buttons();
                resolve('Desperation finish');
            });
        });
    }
}
class Gamble extends Event{
    constructor(player){
        super('Gamble', new Cost(2), "Menagerie/Event/", player);
    }
    async is_buyed(){
        await getBasicStats().addBuy(1);
        if(getDeck().length() <= 0){
            mix_discard_to_deck();
        }
        if(getDeck().length() <= 0) return;
        let card = await getDeck().pop();
        if(card.type.includes(Card.Type.ACTION) || card.type.includes(Card.Type.TREASURE)){
            await play_card(card);
        }else{
            await discard_card(card, false);
        }
    }
}
class Pursue extends Event{
    constructor(player){
        super('Pursue', new Cost(2), "Menagerie/Event/", player);
        this.description = 'Name a card. Reveal the top 4 cards from your deck. Put the matches back and discard the rest.';
    }
    async is_buyed(){
        await getBasicStats().addBuy(1);
        if(getDeck().length() <= 0){
            await mix_discard_to_deck();
        }
        if(getDeck().length() <= 0) return;
        let n = Math.min(4, getDeck().length());
        let card_name = '';
        await new Promise((resolve) =>{
                create_name_input(function(value){
                card_name = value;
                resolve(value);
            });
        });
        let card_list = [];
        for(let i=0; i<n; i++){
            let card = await getDeck().pop();
            if(card.name === card_name){
                card_list.push(card);
            } else{
                await discard_card(card, false);
            }
        }
        while(card_list.length > 0){
            await getDeck().addCard(card_list.pop());
        }
    }
}
class Ride extends Event{
    constructor(player){
        super('Ride', new Cost(2), "Menagerie/Event/", player);
    }
    async is_buyed(){
        await gain_card_name('Horse');
    }
}
class Toil extends Event{
    constructor(player){
        super('Toil', new Cost(2), "Menagerie/Event/", player);
    }
    async is_buyed(){
        await getBasicStats().addBuy(1);
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => {
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
                getHand().remove_mark();

                getSupportHand().clear();
                getSupportHand().hide();
                getDeck().removeCanSelect();
            }
            setInstruction('Toil: You may play an Action card from your hand.');

            let mayPlayAction = mayPlayCardFromHand(
                card => card.type.includes(Card.Type.ACTION), 
                async function(card){
                    clearFunc();
                    await play_card(card);
                    resolve('Toil finish');
                }
            );
            if(!mayPlayAction){
                clearFunc();
                resolve();
            }
            /*
            let is_marked = getHand().mark_cards(
                card => card.type.includes(Card.Type.ACTION), 
                async function(card){
                    clearFunc();
                    await getHand().remove(card);
                    await play_card(card, true);
                    resolve('Toil finish');
                });
            if(!is_marked){
                resolve();
                return;
            }
                */

            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Don't play", async function(){
                clearFunc();
                resolve('Toil finish');
            });
        });
    }
}
class Enhance extends Event{
    constructor(player){
        super('Enhance', new Cost(3), "Menagerie/Event/", player);
    }
    is_buyed(){
        if(getHand().length() <= 0) return;
        return new Promise((resolve)=> {
            this.chosen = 0;
            this.trash_card = undefined;
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
                getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            setInstruction('Enhance: You may trash a non-Victory card from your hand.')

            getButtonPanel().add_button("Decline", function(){
                clearFunc();
                resolve('Enhance finish');
            });
            let is_marked = getHand().mark_cards(
                function(card){ return this.chosen===0 && !card.type.includes(Card.Type.VICTORY);}.bind(this), 
                async function(card){
                    clearFunc();
                    if(this.chosen === 0){
                        this.chosen = 1;
                        await trash_card(card);
                    }
                    let pile_found = markSupplyPile(
                        function(pile){
                            let cost = new Cost(2);
                            cost.addCost(card.cost);
                            return cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity() > 0;
                        },
                        async function(pile){
                            removeMarkSupplyPile();
                            let new_card = await gain_card(pile);
                            getButtonPanel().clear_buttons();
                            resolve('Enhance finish');
                        });
                    if(!pile_found){
                        removeMarkSupplyPile();
                        resolve();
                        return;
                    }  
                }.bind(this),
            'trash');
            if(!is_marked){
                clearFunc();
                resolve();
                return;
            }
        });
    }
}
class March extends Event{
    constructor(player){
        super('March', new Cost(3), "Menagerie/Event/", player);
    }
    is_buyed(){
        if(getDiscard().length() <= 0) return;
        return new Promise(async (resolve) => {
            let supportHand = getSupportHand();
            supportHand.clear();
            supportHand.state.cards.forEach(card => card.march=undefined);
            while(getDiscard().length() > 0){
                await supportHand.addCard(await getDiscard().pop());
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Cancel", async function(){
                await supportHand.setCardAll(supportHand.state.cards.filter(card => !card.march));
                await getDiscard().addCard(supportHand.state.cards);

                supportHand.clear();
                getButtonPanel().clear_buttons();
                resolve('March finish');
            });
            let is_marked = supportHand.mark_cards(
                card => card.type.includes(Card.Type.ACTION),
                async function(card){
                    card.march = true; 
                    supportHand.setCardAll(supportHand.state.cards.filter(card => !card.march));
                    await getDiscard().addCardList(supportHand.state.cards);
                    supportHand.clear();
                    getButtonPanel().clear_buttons();
                    await play_card(card);            
                    resolve('March finish');
                });   
            if(!is_marked){
                supportHand.setCardAll(supportHand.state.cards.filter(card => !card.march))
                await getDiscard().addCardList(supportHand.state.cards);
                supportHand.clear();
                getButtonPanel().clear_buttons();
                resolve();
                return;
            }
        });
    }
}
class Transport extends Event{
    constructor(player){
        super('Transport', new Cost(3), "Menagerie/Event/", player);
        this.description = 'Choose one: Exile an Action card from the Supply; or put an Action card you have in Exile onto your deck.';
    }
    is_buyed(){
        return new Promise((resolve) => {
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Exile from Supply', 
                async function(){
                    getButtonPanel().clear_buttons();
                    await this.play_step1();
                    resolve('Transport finish');
                }.bind(this)
            );

            if(getExile().length() > 0 && getExile().getCardAll().find(c => c.type.includes(Card.Type.ACTION))){
                getButtonPanel().add_button('Put from Exile', async function(){
                    getButtonPanel().clear_buttons();
                    await this.play_step2();
                    resolve('Transport finish');
                }.bind(this));                
            }
        });
    }
    play_step1(){
        return new Promise((resolve) =>{
            markSupplyPile(
                function(pile){return pile.getQuantity() > 0 && pile.getType().includes('Action')},
                async function(pile){
                    removeMarkSupplyPile();
                    let new_card = await pile.popNextCard();
                    new_card.setPlayer(getPlayer());
                    if(!new_card) alert('error');
                    await exile_card(new_card);
                    resolve('Transport step 1 finish');
                }
            );
        });        
    }
    play_step2(){
        if(getExile().length() <= 0) return;
        return new Promise(async (resolve) =>{
            let supportHand = getSupportHand();
            supportHand.clear();
            while(getExile().length() > 0){
                await supportHand.addCard(await getExile().pop());
            }
            let contain_action = supportHand.mark_cards(
                function(card){return card.type.includes(Card.Type.ACTION);},
                async function(card){
                    await getExile().remove(card);
                    await getDeck().addCard(card);   
                    await supportHand.remove(card);
                    await getExile().addCardList(supportHand.state.cards);

                    supportHand.clear(); 
                    resolve('Transport step 2 finish');                 
                }
            );
            if(!contain_action){
                resolve('Transport step 2 finish');
            }
        });
    }
}
class Banish extends Event{
    constructor(player){
        super('Banish', new Cost(4), 'Menagerie/Event/', player);
    }
    is_buyed(){
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => { 
            this.chosen = 0;
            let name = '';
            this.card_list = [];
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("OK", async function(){
                for(let i=0; i<this.card_list.length; i++){
                    let card = this.card_list[i];
                    await getHand().remove(card);                        
                    await exile_card(card);
                }
                resolve('Banish finish');
            }.bind(this));
            getHand().mark_cards(
                function(card){return (this.chosen===0 && name==='' ) || name===card.name;}.bind(this),
                function(card){
                    this.chosen += 1;
                    if(name===''){
                        name = card.name;
                    } else if(name !== card.name){
                        return;
                    }
                    this.card_list.push(card);               
                }.bind(this),
            'discard');
        });
    }
} 
class Bargain extends Event{
    constructor(player){
        super('Bargain', new Cost(4), "Menagerie/Event/", player);
    }
    is_buyed(){
        return new Promise((resolve) => {
            let is_marked = markSupplyPile(
                function(pile){
                    let cost = new Cost(5);
                    return pile.getQuantity()>0 && cost.isGreaterOrEqual(pile.getCost()) && !pile.getType().includes('Victory')
                }, 
                async function(pile){
                    removeMarkSupplyPile();
                    await gain_card(pile);
                    resolve('Bargain finish');
                }
            );
            if(!is_marked){
                removeMarkSupplyPile();
                resolve('Bargain finish');
            }
        });
    }
    async do_passive(){
        await gain_card_name('Horse');
    }
}
class Invest extends Event{
    constructor(player){
        super('Invest', new Cost(4), "Menagerie/Event/", player);
        this.activate_when_another_gains = true;
        this.activate_currently = false;
        this.card = null;
        this.description = "Exile an Action card from the Supply. While it's in Exile, when another player gains or Invests in a copy of it, +2 Cards.";
    }
    is_buyed(){
        //TODO
        return new Promise((resolve) => {
            markSupplyPile(
                function(pile){
                    return pile.getType().includes("Action") && pile.getQuantity() > 0;
                },
                async function(pile){
                    removeMarkSupplyPile();
                    let new_card = await pile.popNextCard();
                    new_card.setPlayer(getPlayer());
                    if(!new_card) alert('error');
                    await exile_card(new_card);

                    this.activate_currently = true;
                    this.card = new_card;
                    resolve('Invest finish');
                }.bind(this));
        });        
    }
    should_activate(reason, card){
        if(!this.card || !this.activate_currently || !getExile().has_card(c => c.name === this.card.name)){
            this.card = null;
            this.activate_currently = false;
            return false;
        }
        return reason === REASON_WHEN_ANOTHER_GAIN && card && card.name === this.card.name;
    } 
    async activate(reason, card){
        if(!this.card || !this.activate_currently || !getExile().has_card(c => c.name === this.card.name)){
            this.card = null;
            this.activate_currently = false;
            return;
        }
        await drawNCards(2);
        this.card = null;
        this.activate_currently = false;
    }
}
class Seize_the_Day extends Event{
    constructor(player){
        super('Seize_the_Day', new Cost(4), "Menagerie/Event/", player);
        this.description = 'Once per game: Take an extra turn after this one.';
    }
    is_buyed(){
        //TODO      
    }
}
class Commerce extends Event{
    constructor(player){
        super('Commerce', new Cost(5), "Menagerie/Event/", player);
    }
    async is_buyed(){
        let cards_gained_this_turn = getPlayer().gameState.cards_gained_this_turn.map(c => c.name); 
        let set = new Set(cards_gained_this_turn); 
        const card_count = set.size;
        for(let i=0; i<card_count; i++){
            await gain_card_name('Gold');
        }
    }
}
class Demand extends Event{
    constructor(player){
        super('Demand', new Cost(5), "Menagerie/Event/", player);
    }
    async is_buyed(){
        let horse_card = await gain_card_name('Horse', getDeck());
        return new Promise((resolve) => {
            let is_marked = markSupplyPile(
                function(pile){
                    let cost = new Cost(4);
                    return pile.getQuantity()>0 && cost.isGreaterOrEqual(pile.getCost());
                }, 
                async function(pile){
                    removeMarkSupplyPile();
                    let new_card = await gain_card(pile, getDeck());
                    resolve('Demand finish');
                }
            );
            if(!is_marked){
                removeMarkSupplyPile();
                resolve('Demand finish');
            }
        });
    }
}
class Stampede extends Event{
    constructor(player){
        super('Stampede', new Cost(5), "Menagerie/Event/", player);
    }
    async is_buyed(){
        if(getPlayField().length() <= 5){
            for(let i=0; i<5; i++){
                let horse_card = await gain_card_name('Horse', getDeck());
            }
        }
    }
}
class Reap extends Event{
    constructor(player){
        super('Reap', new Cost(7), "Menagerie/Event/", player);
        this.turn = -1;
        this.activate_when_start_turn = true;
        this.activate_currently = false;
        this.card = null;
        this.chosen_id = null;
        this.description = 'Gain a Gold. Set it aside. If you do, at the start of your next turn, play it.';
    }
    async is_buyed(){
        let gold = await gain_card_name('Gold');
        if(gold && getDiscard().getCardById(gold.id)){
            let removed = getDiscard().removeCardById(gold.id);
            if(removed){
                this.turn = getPlayer().turn;
                this.activate_currently = true;
                this.chosen_id = gold.id;
                await set_aside_card(gold)
            }
        }
    }
    should_activate(reason, card){ 
        if(!this.chosen_id || this.turn + 1 < getPlayer().turn){
            this.activate_currently = false;
            return false;
        }
        return reason === REASON_START_TURN && getSetAside().hasCardId(this.chosen_id) && this.turn + 1 === getPlayer().turn;
    }
    async activate(reason, card){
        if(!this.chosen_id) return;
        this.activate_currently = false;
        if(this.turn + 1 < getPlayer().turn && !getSetAside().hasCardId(this.chosen_id)){
            return false;
        }
        let card_ = await getSetAside().removeCardById(this.chosen_id);
            if(card_){
                await play_card(card_, true);
            }

        this.chosen_id = null;
    }
}
class Enclave extends Event{
    constructor(player){
        super('Enclave', new Cost(8), "Menagerie/Event/", player);
    }
    async is_buyed(){
        await gain_card_name('Gold');
        let duchy_pile = findSupplyPile(function(pile){return pile.getName() === 'Duchy' && pile.getQuantity() > 0});
        if(!duchy_pile) return;  
        let new_duchy = await duchy_pile.popNextCard();
        new_duchy.setPlayer(getPlayer());
        if(!new_duchy){
            return;
        }
        await exile_card(new_duchy);
        await getPlayer().update_score();
    }
}
class Alliance extends Event{
    constructor(player){
        super('Alliance', new Cost(10), "Menagerie/Event/", player);
    }
    async is_buyed(){
        await gain_card_name('Province');
        await gain_card_name('Duchy');
        await gain_card_name('Estate');
        await gain_card_name('Gold');
        await gain_card_name('Silver');
        await gain_card_name('Copper');
    }
}
class Populate extends Event{
    constructor(player){
        super('Populate', new Cost(10), "Menagerie/Event/", player);
        
    }
    async is_buyed(){
        let action_pile_list = findSupplyPileAll(pile => pile.getQuantity() > 0 &&  pile.getType().includes(Card.Type.ACTION));
        for(let i=0; i<action_pile_list.length; i++){
            let pile = action_pile_list[i];
            await gain_card(pile);
        }
    }   
}

export {Delay, Desperation, Gamble, Pursue, Ride, Toil, Enhance, March, Transport, 
        Banish, Bargain, Invest, Seize_the_Day, Commerce, Demand, Stampede, Reap, Enclave,
        Alliance, Populate};