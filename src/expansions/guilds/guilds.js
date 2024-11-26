import {Card, Cost} from '../cards.js';
import {REASON_END_BUY} from '../../game_logic/ReactionEffectManager.js';

import { markSupplyPile, removeMarkSupplyPile } from '../../features/TableSide/Supply.jsx';
import { getPlayer } from '../../player.js';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getDiscard, getDeck, getTrash } from '../../features/PlayerSide/CardPile/CardPile.jsx';
import { getPlayArea, getExile, getSetAside } from '../../features/PlayerSide/BottomLeftCorner/SideArea.jsx';
import { getNativeVillageMat, getIslandMat } from '../../features/PlayerSide/BottomLeftCorner/PlayerMats.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getSupportHand } from '../../features/SupportHand.jsx';
import { create_name_input } from '../../Components/user_input/TextInput.jsx';
import { create_number_picker } from '../../Components/user_input/NumberPicker.jsx';
import { draw1, drawNCards, mix_discard_to_deck, play_card,
    gain_card, gain_card_name, discard_card, trash_card, reveal_card, revealCardList, set_aside_card,
    attack_other} from '../../game_logic/Activity.js';

/*
Mẫu
class  extends Card{
    constructor(player){
        super("", , Card.Type.ACTION, "Guilds/", player);
    }
    play(){} 
}

*/
function get_overpay_amount(player){
    return new Promise((resolve) =>{
        create_number_picker(0, getBasicStats().gegtCoin() + getBasicStats().getCoffer(), async function(value){
            if(getBasicStats().getCoin() >= value){
                await getBasicStats().addCoin(0 - value);
            }else{
                await getBasicStats().addCoffer(getBasicStats().getCoin() - value);
                await getBasicStats().setCoin(0);  
            } 
            resolve(value);
        });
    });
}
class CandlestickMaker extends Card{
    constructor(player){
        super("CandlestickMaker", new Cost(2), Card.Type.ACTION, "Guilds/", player);
    }
    async play(){
        await getBasicStats().addAction(1);
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoffer(1);
    } 
}
class Stonemason extends Card{
    constructor(player){
        super("Stonemason", new Cost(2), Card.Type.ACTION, "Guilds/", player);
    }
    play(){
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => {
            this.chosen = 0;
            this.trash_card = undefined;
            getButtonPanel().clear_buttons();

            getHand().mark_cards(
                function(card){return this.chosen==0;}.bind(this),
                async function(card){
                    getHand().remove_mark();
                    if(this.chosen == 0){
                        this.chosen = 1;
                        this.trash_card = card;
                    }

                    if(this.chosen == 1){
                        await trash_card(card);
                    }
                    getButtonPanel().clear_buttons();
                    await this.play_step1(card.cost);
                    resolve('Stonemason finish');
                    
                }.bind(this),
            'trash');
        });
    } 
    play_step1(card_cost){
        let chosen_list = [];
        if(card_cost == undefined) return;
        return new Promise((resolve) =>{
            let is_marked = markSupplyPile(
                function(pile){
                    return card_cost.isGreaterThan(pile.getCost()) && pile.getQuantity() > 0 && !chosen_list.includes(pile.getName()) && chosen_list.length < 2;
                }, 
                async function(pile){
                    let new_card = await gain_card(pile);
                    chosen_list.push(new_card.name);
                    if(chosen_list.length == 2){
                        removeMarkSupplyPile();
                        resolve('Stonemason step 1 finish');
                    }                    
                }.bind(this));
            if(!is_marked){
                removeMarkSupplyPile();
                resolve('Stonemason step 1 finish');
            }
        });
    }
    async is_buyed(){
        getButtonPanel().clear_buttons();
        let value = await get_overpay_amount(this.player);
        await this.is_buyed_step1(new Cost(value));
    }
    is_buyed_step1(card_cost){
        let chosen = 0;
        if(card_cost == undefined) return;
        return new Promise((resolve) =>{
            let is_marked = markSupplyPile(
                function(pile){
                    return card_cost.isEqual(pile.getCost()) && pile.getQuantity() > 0 && chosen < 2;
                }, async function(pile){
                    chosen += 1;
                    let new_card = await gain_card(pile);
                    if(chosen == 2){
                        removeMarkSupplyPile();
                        resolve('Stonemason step 1 finish');
                    }                    
                }.bind(this));
            if(!is_marked){
                resolve('Stonemason step 1 finish');
            }
        });
    }
}

class Doctor extends Card{
    constructor(player){
        super("Doctor", new Cost(3), Card.Type.ACTION, "Guilds/", player);
        this.description = "Name a card. Reveal the top 3 cards of your deck. Trash the matches. Put the rest back in any order. Overpay: Per $1 overpaid, look at the top card of your deck; trash it, discard it, or put it back.";
    }
    async play(){
        getButtonPanel().clear_buttons();
        let card_name = await this.play_step1();
        if(getDeck().length() < 3) await mix_discard_to_deck();
        if(getDeck().length() <= 0) return;
        let n = Math.min(3, getDeck().length());
        let card_list = [];
        for(let i=0; i< n; i++){
            let card = await getDeck().pop();
            await reveal_card(card);
            if(card.name == card_name){
                await trash_card(card, false);
            } else{
                card_list.push(card);
            }
        }
        if(card_list.length == 0){
            return;
        } else if(card_list.length == 1){
            let card = card_list.pop();
            await getDeck().addCard(card);
        } else{
            let supportHand = getSupportHand();
            supportHand.clear();
            while(card_list.length > 0){
                await supportHand.addCard(card_list.pop());
            }
            await supportHand.setCardAll(supportHand.state.cards.reverse());
            while(supportHand.length() >= 1){
                await this.play_step2();
            }
            supportHand.clear();
        }
    } 
    play_step1(){
        return new Promise((resolve) =>{
            create_name_input(function(value){
                resolve(value);
            }.bind(this));
        });

    }
    async play_step2(){
        let supportHand = getSupportHand();
        if(supportHand.length() == 1){
            let card = supportHand.state.cards[0];
            await supportHand.remove(card);
            await getDeck().addCard(card);
            return;
        }
        if(supportHand.length() <= 0) return;
        return new Promise((resolve) => {
            let clearFunc = function(){
                getButtonPanel().clear_buttons();

            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('OK', async function(){
                clearFunc();
                await getDeck().addCardList(supportHand.state.cards);
                supportHand.clear();
                resolve('Doctor step 2 finish');
            }.bind(this));
            supportHand.mark_cards(
                function(){return true;},
                async function(card){
                    await supportHand.remove(card);
                    await getDeck().addCard(card);
                    resolve('Doctor step 2 finish');
                }.bind(this));
        });
    }
}
class Masterpiece extends Card{
    constructor(player){
        super("Masterpiece", new Cost(3), Card.Type.TREASURE, "Guilds/", player);
    }
    async play(){
        await getBasicStats().addCoin(1);
    }
    async is_buyed(){
        getButtonPanel().clear_buttons();
        let value = await get_overpay_amount(this.player);
        for(let i=0; i<value; i++){
            await gain_card_name('Silver');
        }
    }
}
class Advisor extends Card{
    constructor(player){
        super("Advisor", new Cost(4), Card.Type.ACTION, "Guilds/", player);
        this.description = 'Reveal the top 3 cards of your deck. The player to your left chooses one of them. Discard that card and put the rest into your hand.';
    }
    async play(){
        await getBasicStats().addAction(1);
        //TODO
    } 
    do_passive(){}    
}
class Herald extends Card{
    constructor(player){
        super("Herald", new Cost(4), Card.Type.ACTION, "Guilds/", player);
        this.description = "Reveal the top card of your deck. If it's an Action, play it. Overpay: Per $1 overpaid, put any card from your discard pile onto your deck.";
    }
    async play(){
        await getBasicStats().addAction(1);
        await draw1();
        if(getDeck().length() <= 0){
            await mix_discard_to_deck();
        }
        if(getDeck().length() <= 0) return;
        let card = await getDeck().pop();
        await reveal_card(card);
        if(card.type.includes("Action")){
            await play_card(card);
        }else{
            await discard_card(card, false);
        }
    } 
    async is_buyed(){
        getButtonPanel().clear_buttons();
        let value = await get_overpay_amount(this.player);
        console.log(`Overpay: ${value}`)
        await this.is_buyed_step1(value);
    }
    is_buyed_step1(value){
        let n = Math.min(value, getDiscard().length());
        this.chosen = 0;
        if(n <= 0) return;
        return new Promise(async (resolve) => {
            let supportHand = getSupportHand();
            supportHand.clear();
            while(getDiscard().length() > 0){
                await supportHand.addCard(await getDiscard().pop());
            }
            supportHand.state.cards.forEach(card => card.herald=false);
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("OK", async function(){
                while(supportHand.length() > 0){
                    let card = await supportHand.pop();
                    if(card.herald){
                        await getDeck().addCard(card);
                    } else{
                        await getDiscard().addCardList(supportHand.state.cards);
                    }
                }

                supportHand.clear();            
                getButtonPanel().clear_buttons();
                resolve('Herald is buyed step 1 finish');

            }.bind(this));

            supportHand.mark_cards(function(card){return this.chosen < n && !card.herald;}.bind(this),
                function(card){
                    card.herald = true; 
                    this.chosen += 1;                     
                }.bind(this)
            );
        });
    }

}
class Plaza extends Card{
    constructor(player){
        super("Plaza", new Cost(4), Card.Type.ACTION, "Guilds/", player);
    }
    async play(){
        await getBasicStats().addAction(2);
        await draw1();
        if(getHand().length() <= 0) return;
        return new Promise((resolve) =>{
            this.chosen = 0;
            let clearFunc = function(){
                getHand().remove_mark();
                getButtonPanel().clear_buttons();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Cancel', function(){
                clearFunc();
                resolve("Plaza finish"); 
            }.bind(this));
            let is_marked = getHand().mark_cards(
                function(card){return card.type.includes('Treasure') && this.chosen == 0;}.bind(this),
                async function(card){
                    clearFunc();
                    this.chosen += 1;
                    await getBasicStats().addCoffer(1);
                    await discard_card(card);
                    resolve("Plaza finish");                    
                }.bind(this),
            'discard');
            if(!is_marked){
                resolve("Plaza finish");
            }
        });
    } 
}
class Taxman extends Card{
    constructor(player){
        super("Taxman", new Cost(4), Card.Type.ACTION+' '+Card.Type.ATTACK, "Guilds/", player);
        this.description = "You may trash a Treasure from your hand. Each other player with 5 or more cards in hand discards a copy of it (or reveals they can't). Gain a Treasure onto your deck costing up to $3 more than it.";
    }
    play(){
        if(getHand().length() <= 0) return;
        return new Promise((resolve) =>{
            this.chosen = 0;
            let clearFunc = function(){
                getHand().remove_mark();
                getButtonPanel().clear_buttons();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Cancel', function(){
                clearFunc();
                resolve("Taxman finish"); 
            }.bind(this));
            let is_marked = getHand().mark_cards(
                function(card){return card.type.includes('Treasure') && this.chosen == 0;}.bind(this),
                async function(card){
                    this.chosen += 1;
                    clearFunc();
                    await trash_card(card);
                    let message = card.name;
                    await this.attack(message);
                    await this.play_step1(card.cost);
                    resolve("Taxman finish");                    
                }.bind(this),
            'trash');
            if(!is_marked){
                resolve("Taxman finish");
            }
        });
    }
    play_step1(card_cost){
        return new Promise((resolve) =>{
            markSupplyPile(
                function(pile){
                    let cost = new Cost(3);
                    cost.addCost(card_cost);
                    return cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity() > 0 && pile.getType().includes('Treasure')
                },
                async function(pile){
                    removeMarkSupplyPile();
                    let card = await gain_card(pile, false);
                    if(card != undefined){
                        await getDeck().addCard(card);
                    }
                    resolve();
                }.bind(this),
            );
        });
    }
    async attack(message){
        await attack_other(this, message);
    }
    is_attacked(message){
        if(getHand().length() < 5) return;
        let chosen = 0;
        return new Promise((resolve) =>{
            let is_marked = getHand().mark_cards(
                function(card){return card.name == message && chosen == 0;},
                async function(card){
                    getHand().remove_mark();
                    await discard_card(card);
                    resolve();
                }.bind(this),
                'discard',
            );
            if(!is_marked){
                getHand().remove_mark();
                resolve();
            }
        });


    }
}
class Baker extends Card{
    constructor(player){
        super("Baker", new Cost(5), Card.Type.ACTION, "Guilds/", player);
    }
    async play(){
        await draw1();
        await getBasicStats().addAction(1);
        await getBasicStats().addCoffer(1);
    } 
    async setup(){
        await getBasicStats().addCoffer(1);
    }
}
class Butcher extends Card{
    constructor(player){
        super("Butcher", new Cost(5), Card.Type.ACTION, "Guilds/", player);
    }
    async play(){
        await getBasicStats().addCoffer(2);
        if(getHand().length() <= 0) return;
        return new Promise((resolve) => {
            this.chosen = 0;
            let clearFunc = function(){
                getHand().remove_mark();
                getButtonPanel().clear_buttons();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Cancel", function(){
                clearFunc();
                resolve('Butcher finish');
            }.bind(this));
            getHand().mark_cards(
                function(card){
                    return this.chosen==0;
                }.bind(this), 
                async function(card){
                    if(this.chosen == 0){
                        this.chosen = 1;
                        clearFunc();
                        await trash_card(card);
                        await this.play_step1(card.cost);
                    }
                    resolve('Butcher finish');
                }.bind(this),
            'trash');
        });
    } 
    play_step1(card_cost){
        return new Promise((resolve) =>{
            markSupplyPile(
                function(pile){
                    let cost = new Cost(getBasicStats().state.coffer);
                    cost.addCost(card_cost);
                    return pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost());
                }.bind(this),
                async function(pile){
                    removeMarkSupplyPile();
                    await gain_card(pile);
                    if(pile.getCost().coin > card_cost.coin){
                        await getBasicStats().addCoffer(card_cost.coin - pile.getCost().coin);
                    } 
                    resolve('Butcher step 1 finish');                    
                }.bind(this)
            );
        });
    }
}
class Journeyman extends Card{
    constructor(player){
        super("Journeyman", new Cost(5), Card.Type.ACTION, "Guilds/", player);
        this.description = "Name a card. Reveal cards from your deck until you reveal 3 cards without that name. Put those cards into your hand and discard the rest.";
    }
    async play(){
        let card_name = await this.play_step1();
        if(getDeck().length() < 3) await mix_discard_to_deck();
        if(getDeck().length() <= 0) return;
        let reveal_count = 0;
        let card_list = [],
            discard_list = [];
        while(reveal_count < 3 && getDeck().length() > 0){
            let card = await getDeck().pop();
            await reveal_card(card);
            if(card.name != card_name){
                reveal_count += 1;
                card_list.push(card);
            } else{
                discard_list.push(card);
            }
        }
        await getHand().addCardList(card_list);
        while(discard_list.length > 0){
            await discard_card(discard_list.pop(), false);
        }
    } 
    play_step1(){
        return new Promise((resolve) =>{
            create_name_input(function(value){
                resolve(value);
            }.bind(this));
        });

    }

}
class MerchantGuild extends Card{
    constructor(player){
        super("MerchantGuild",  new Cost(5), Card.Type.ACTION, "Guilds/", player);
        this.activate_when_end_buy_phase = true;
        this.activate_when_in_play = true;
        this.description = "At the end of your Buy phase this turn, +1 Coffers per card you gained in it.";
    }
    async play(){
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(1);
    } 
    should_activate(reason, card){
        return reason == REASON_END_BUY;
    }
    async activate(reason, card){
        if(reason != REASON_END_BUY) return;
        await getBasicStats().addCoffer(getPlayer().gameState.cards_gained_this_buy_phase.length);
    }
}
class Soothsayer extends Card{
    constructor(player){
        super("Soothsayer", new Cost(5), Card.Type.ACTION+' '+Card.Type.ATTACK, "Guilds/", player);
    }
    async play(){
        await gain_card_name('Gold');
        await attack_other(this);
    } 
    attack(){}
    async is_attacked(){
        let curse_card = await gain_card_name('Curse');
        if(curse_card != undefined){
            await draw1();
        }
    }
}

export {
    CandlestickMaker, Stonemason, Doctor, Masterpiece, Advisor, Herald,
    Plaza, Taxman, Baker, Butcher, Journeyman, MerchantGuild, Soothsayer,
};
