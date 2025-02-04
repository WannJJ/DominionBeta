import {Card, Cost} from '../cards.js';
import { REASON_WHEN_PLAY, REASON_FIRST_WHEN_ANOTHER_PLAYS } from '../../game_logic/ReactionEffectManager.js';
import { markSupplyPile, removeMarkSupplyPile } from '../../features/TableSide/Supply.jsx';
import { findSupplyPileAll } from '../../features/TableSide/SupplyPile.jsx';
import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getDiscard, getDeck} from '../../features/PlayerSide/CardPile/CardPile.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getSupportHand } from '../../features/SupportHand.jsx';
import { draw1, drawNCards, mix_discard_to_deck, play_card,
    gain_card, gain_card_name, 
    discard_card, trash_card, reveal_card,
    attack_other,
    revealCardList,
    mayPlayCardFromHand} from '../../game_logic/Activity.js';
import { getPlayer } from '../../player.js';
import { opponentManager } from '../../features/OpponentSide/Opponent.js';
import { setInstruction } from '../../features/PlayerSide/Instruction.jsx';


/*
Mẫu
class  extends Card{
    constructor(player){
        super("", , Card.Type.ACTION, "Base/", player);
    }
    play(){} 
}
*/


class Chapel extends Card{
    constructor(player){
        super("Chapel", new Cost(2), Card.Type.ACTION, "Base/", player);
    }
    play(){
        if(getHand().length() > 0){
            return new Promise((resolve) => {
                let clearFunc = function(){
                    getButtonPanel().clear_buttons();
                    getHand().remove_mark();
                }
                getButtonPanel().clear_buttons();
                getButtonPanel().add_button("Confirm Trashing", async function(){
                    clearFunc();
                    let cardList = getHand().getSelectedList();
                    if(cardList.length > 0){
                        for(let i=0; i<cardList.length; i++){
                            let card = cardList[i];
                            await trash_card(card);
                        }
                    }
                    resolve('Chapel finish');
                });

                getHand().mark_cards(
                    function(){return getHand().getSelectedList().length<4;}, 
                    function(card){

                    },
                    'trash',
                    true,
                );
            });
        }
    } 
}
class Cellar extends Card{
    constructor(player){
        super("Cellar", new Cost(2), Card.Type.ACTION, "Base/", player);

    }
    async play(){
        await getBasicStats().addAction(1);
        
        if(getHand().length() > 0){
            return new Promise((resolve) => {
                let clearFunc = function(){
                    getButtonPanel().clear_buttons();
                    getHand().remove_mark();
                }
                getButtonPanel().clear_buttons();
                getButtonPanel().add_button("Confirm Discard", async function(){
                    clearFunc();
                    let cardList = getHand().getSelectedList();
                    if(cardList.length > 0){
                        for(let i=0; i<cardList.length; i++){
                            let card = cardList[i];
                            await discard_card(card);
                        }
                    }
                    await drawNCards(cardList.length);
                    
                    resolve('Cellar finish');
                });

                getHand().mark_cards(
                    function(){return true;},
                    function(card){

                    },
                    'discard',
                    true,
                );
            });
        }

    } 
}
class Moat extends Card{
    constructor(player){
        super("Moat", new Cost(2), Card.Type.ACTION + " " + Card.Type.REACTION, "Base/", player);
        this.activate_first_when_another_plays = true;
        this.activate_when_in_hand = true;
        this.description = 'When another player plays an Attack card, you may first reveal this from your hand, to be unaffected by it.';
    }
    async play(){
        await drawNCards(2);
    } 
    should_activate(reason, card){
        return  reason === REASON_FIRST_WHEN_ANOTHER_PLAYS
                    && card && card.type.includes(Card.Type.ATTACK)
    }
    activate(reason, card){
        return new Promise((resolve) =>{
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('Moat: You may reveal Moat to be unaffected by Attack.');
            }
            getButtonPanel().clear_buttons();
            setInstruction('');

            getButtonPanel().add_button('Reveal Moat', async function(){
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
class Village extends Card{
    constructor(player){
        super("Village", new Cost(3), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await getBasicStats().addAction(2);
        await draw1();
    } 
}
class Harbinger  extends Card{
    constructor(player){
        super("Harbinger", new Cost(3), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await getBasicStats().addAction(1);
        await draw1();
        if(getDiscard().length() <= 0) return;
        let chosen = 0;

        return new Promise(async (resolve) => {
            let supportHand = getSupportHand();
            supportHand.clear();
            while(getDiscard().length() > 0){
                await supportHand.addCard(await getDiscard().pop());
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("OK", async function(){
                await getDiscard().addCardList(supportHand.getCardAll());

                supportHand.clear();            
                getButtonPanel().clear_buttons();
                resolve('Harbinger finish');

            });

            supportHand.mark_cards(
                function(){return chosen===0;},
                async function(card){
                    chosen += 1;           
                    await supportHand.removeCardById(card.id);
                    await getDeck().addCard(card);

                    await getDiscard().addCardList(supportHand.getCardAll());
                    supportHand.clear();            
                    getButtonPanel().clear_buttons();
                    resolve('Harbinger finish');
                },
                'choose',
            );
        });
    } 
}

class Merchant extends Card{
    constructor(player){
        super("Merchant", new Cost(3), Card.Type.ACTION, "Base/", player);
        this.turn = -1;
        this.activate_when_play = true;
        this.activate_when_in_play = true;
    }
    async play(){
        this.activate_when_in_play = true;
        await getBasicStats().addAction(1);
        await draw1();
        if(getPlayField().has_card(function(card){return card.name === 'Silver';})){
            await getBasicStats().addCoin(1);
        }
    } 
    should_activate(reason, card){
        return reason===REASON_WHEN_PLAY 
                && card && card.name==='Silver';
    }
    async activate(reason, card){
        await getBasicStats().addCoin(1);
        this.activate_when_in_play = false;
    }
}
class Vassal extends Card{
    constructor(player){
        super("Vassal", new Cost(3), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await getBasicStats().addCoin(2);
        if(getDeck().length() <= 0){
            await mix_discard_to_deck();
        }
        if(getDeck().length() <= 0) return;
        let card = await getDeck().pop();
        await discard_card(card, false);
        if(card.type.includes(Card.Type.ACTION) && getDiscard().getCardById(card.id)){
            await this.play_step1(card);
        }
    } 
    play_step1(card){
        if(!card || !card.type.includes(Card.Type.ACTION)) return;
        return new Promise((resolve) =>{
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
            }
            getButtonPanel().clear_buttons();
            setInstruction(`Vassal: You may play ${card.name}.`);

            getButtonPanel().add_button(`Play ${card.name}`, async function(){
                clearFunc();
                let removed = await getDiscard().removeCardById(card.id);
                if(removed) await play_card(card);
                resolve();
            })
            getButtonPanel().add_button('Decline', function(){
                clearFunc();
                resolve();
            })
            
        });
    }
}
class Smithy  extends Card{
    constructor(player){
        super("Smithy", new Cost(4), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await drawNCards(3);
    } 
}
class Remodel extends Card{
    constructor(player){
        super("Remodel", new Cost(4), Card.Type.ACTION, "Base/", player);
    }
    play(){
        if(getHand().getLength() <= 0) return;
        return new Promise((resolve) => {
            let chosen = 0;
            getHand().mark_cards(
                function(card){return chosen===0;},
                async function(card){
                    getHand().remove_mark();
                    chosen += 1;
                    await trash_card(card);
                    markSupplyPile(
                        function(pile){
                            let cost = new Cost(2);
                            cost.addCost(card.cost);
                            return cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity()>0;
                        },
                        async function(pile){
                            removeMarkSupplyPile();
                            await gain_card(pile);
                            resolve('Remodel finish');
                        });
                },
            'trash');
        });
    } 
}
class Bureaucrat extends Card{
    constructor(player){
        super("Bureaucrat", new Cost(4), Card.Type.ACTION + " "+ Card.Type.ATTACK, "Base/", player);
    }
    async play(){
        let silver = await gain_card_name('Silver', getDeck());
        
        await attack_other(this);
    } 
    attack(){}
    is_attacked(){
        if(getHand().length() <= 0) return;
        
        return new Promise(async (resolve) =>{
            getButtonPanel().clear_buttons();
            let chosen = 0;
            let is_marked = getHand().mark_cards(
                function(card){return chosen===0 && card.type.includes('Victory')},
                async function(card){
                    chosen = 1;
                    getHand().remove_mark();
                    await reveal_card(card);
                    await getHand().remove(card);
                    await getDeck().addCard(card);
                    resolve('Bureaucrat finish');
                },
                'discard'
            );
            if(!is_marked){
                await revealCardList(getHand().getCardAll());
                resolve();
            }
        });
    }
}
class ThroneRoom extends Card{
    constructor(player){
        super("ThroneRoom", new Cost(4), Card.Type.ACTION, "Base/", player);
    }
    play(){//TODO: ThroneRoom when play with duration cards
        if(getHand().length() >= 0){
            let chosen = 0;
            return new Promise(async (resolve) => {
                let clearFunc = function(){
                    getButtonPanel().clear_buttons();
                    setInstruction('');
                    getHand().remove_mark();
                    getSupportHand().clear();
                    getSupportHand().hide();
                    getDeck().removeCanSelect();
                }
                getButtonPanel().clear_buttons();
                setInstruction('You may play an Action card from your hand twice.');

                getButtonPanel().add_button("Cancel", function(){
                    clearFunc();
                    resolve("ThroneRoom finish");
                });


                let mayPlayAction = mayPlayCardFromHand(
                    function(card){return chosen===0 && card.type.includes(Card.Type.ACTION);},
                    async function(card){
                        if(chosen === 0){
                            chosen += 1;
                        }
                        clearFunc();
                        await play_card(card);
                        await play_card(card, false);
                        await play_card(card, false);
                        /*
                        let removed = await getPlayField().remove(card);
                        if(removed) await play_card(card);
                        */
                        resolve('ThroneRoom finish');                       
                    }.bind(this),
                );
                if(!mayPlayAction) {
                    clearFunc();
                    resolve('no action');
                }

                /*
                let contain_action = getHand().mark_cards(
                    function(card){return chosen===0 && card.type.includes(Card.Type.ACTION);},
                    async function(card){
                        if(chosen === 0){
                            chosen += 1;
                        }
                        clearFunc();
                        let removed = await getHand().remove(card);
                        if(removed){
                            await play_card(card);
                            removed = await getPlayField().remove(card);
                            if(removed) await play_card(card);
                        } 
                        resolve('ThroneRoom finish');                       
                    }.bind(this),
                'choose');
                if(!contain_action) {
                    clearFunc();
                    resolve('no action');
                }
                */
            });
        } 
    } 
}
class Militia extends Card{
    constructor(player){
        super("Militia", new Cost(4), Card.Type.ACTION + " " + Card.Type.ATTACK, "Base/", player);
    }
    async play(){
        await getBasicStats().addCoin(2);

        await attack_other(this);
    } 
    attack(){}
    is_attacked(){
        if(getHand().length() <= 3){return;}
        return new Promise((resolve) => {
            let chosen = 0;
            let discardList = [];
            let n = Math.max(getHand().length() - 3, 0);
            let clearFunc = function(){
                getButtonPanel().clear_buttons();
                setInstruction('');
                getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            setInstruction('Militia: Discard down to 3 cards in hand.');

            getButtonPanel().add_button("OK", async function(){
                if(chosen < n) return;
                for(let card of discardList){
                    await discard_card(card);
                }
                clearFunc();
                resolve('Militia finish');
            });
            getHand().mark_cards(
                function(card){return chosen < n;},
                function(card){
                    if(chosen < n){
                        chosen += 1;
                        discardList.push(card);
                    }
                },
            'discard');            
        });
    }
}
class Gardens extends Card{
    constructor(player){
        super("Gardens", new Cost(4), Card.Type.VICTORY, "Base/", player);
    }
    getInitAmount(){
        let player_count = 1 + opponentManager.getOpponentList().length;
        if(player_count <= 2){
            return 8;
        } 
        return 12;
    }
    async is_gained(){
        await getBasicStats().addScore(Math.floor(getPlayer().all_cards.length/10));
    } 
    async add_score(){
        await getBasicStats().addScore(Math.floor(getPlayer().all_cards.length/10));
    }
}
class Workshop extends Card{
    constructor(player){
        super("Workshop", new Cost(3), Card.Type.ACTION, "Base/", player);
    }
    play(){
        return new Promise((resolve) => {
            markSupplyPile(
                function(pile){
                    let cost = new Cost(4);
                    return cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity() > 0;
                },
                async function(pile){
                    removeMarkSupplyPile();
                    await gain_card(pile);
                    resolve('Workshop finish');
                });
        });
    } 
}
class Moneylender extends Card{
    constructor(player){
        super("Moneylender", new Cost(4), Card.Type.ACTION, "Base/", player);
    }
    play(){
        if(getHand().length() >= 0){
            return new Promise((resolve)=> {
                let chosen = 0;
                let clearFunc = function(){
                    getButtonPanel().clear_buttons();
                    setInstruction('');
                    getHand().remove_mark();
                }
                getButtonPanel().clear_buttons();
                setInstruction('You may trash a Copper from your hand for +$3');

                getButtonPanel().add_button("Cancel", function(){
                    clearFunc();
                    resolve('Moneylender finish');
                });
                let contain_copper = getHand().mark_cards(
                    function(card){ return card.name==="Copper" && chosen===0;}, 
                    async function(card){
                        if(chosen === 0){
                            chosen += 1;
                            clearFunc();
                            await trash_card(card);
                            await getBasicStats().addCoin(3);
                        }
                        resolve('Moneylender finish');
                    },
                'trash');
                if(!contain_copper){
                    clearFunc();
                    resolve('Moneylender finish');
                }
            });
        } 
    } 
}

class Poacher extends Card{
    constructor(player){
        super("Poacher", new Cost(4), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await getBasicStats().addCoin(1);
        await getBasicStats().addAction(1);
        await draw1();
        // count empty supply piles
        let n =  findSupplyPileAll(pile => pile.getQuantity() <= 0).length;
        n = Math.min(n, getHand().length());
        if(n===0) return;
        return new Promise((resolve) => {
            let chosen = 0;
            let cardList = [];
            getHand().mark_cards(function(){return chosen<n;},
                async function(card){
                    if(chosen < n){
                        chosen += 1;
                        cardList.push(card);
                    }          
                    if(chosen === n){
                        for(let i=0; i<cardList.length; i++){
                            let card = cardList[i];
                            await discard_card(card);
                        }  
                        getHand().remove_mark();
                        resolve("Poacher finish");    
                    }      
                },
            'discard');
        });
    } 
}
class CouncilRoom extends Card{
    constructor(player){
        super("CouncilRoom", new Cost(5), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await drawNCards(4);
        await getBasicStats().addBuy(1);
    } 
    async do_passive(){
        await draw1();
    }
}
class Library extends Card{
    constructor(player){
        super("Library", new Cost(5), Card.Type.ACTION, "Base/", player);
    }
    async play(){        
        if(getDeck().length() < 7 - getHand().length()){await mix_discard_to_deck();}
        while(getHand().length() < 7 && (getDeck().length() > 0 || getDiscard().length() > 0)){
            await this.play_step();
        }
    } 
    async play_step(){
        if(getHand().length() >= 7 || getDeck().length() <= 0) {return;}
        return new Promise(async (resolve) => {
            let supportHand = getSupportHand();
            let card = await getDeck().pop();
            if(card.type.includes('Action')){
                supportHand.clear();
                await supportHand.addCard(card);
                let clearFunc = function(){
                    supportHand.clear();           
                    getButtonPanel().clear_buttons();
                }
                getButtonPanel().clear_buttons();
                getButtonPanel().add_button("To Hand", async function(){
                    await getHand().addCard(card);
                    clearFunc()
                    resolve();
                    });
                getButtonPanel().add_button("Discard", async function(){
                    clearFunc();
                    await discard_card(card, false);
                    resolve();
                    });

            } else {
                await getHand().addCard(card);
                resolve();
            }
        });
    }
}
class Bandit extends Card{
    constructor(player){
        super("Bandit", new Cost(5), Card.Type.ACTION  + " "+ Card.Type.ATTACK, "Base/", player);
    }
    async play(){
        await gain_card_name('Gold');

        await attack_other(this);
    } 
    attack(){
    }
    async is_attacked(){
        if(getDeck().length() < 2) await mix_discard_to_deck();;
        if(getDeck().length() <= 0) return;
        getButtonPanel().clear_buttons();
        const n = Math.min(getDeck().length(), 2);
        let revealed_list = [],
            non_copper_treasure_list = [];
        for(let i=0; i<n; i++){
            let card = await getDeck().pop();
            revealed_list.push(card);
            await reveal_card(card);
            if(card.type.includes('Treasure') && card.name !== 'Copper'){
                non_copper_treasure_list.push(card);
            } else{
                await discard_card(card, false);
            }
        }
        if(non_copper_treasure_list.length === 2){
            await this.is_attacked_step1(non_copper_treasure_list);
        } else if(non_copper_treasure_list.length === 1){
            let card = non_copper_treasure_list.pop();
            await trash_card(card, false);
        }
    }
    is_attacked_step1(card_list){
        return new Promise(async (resolve) => {
            let supportHand = getSupportHand();
            supportHand.clear();
            await supportHand.addCardList(card_list);
            supportHand.getCardAll().forEach(card => card.bandit=undefined);

            let chosen = 0;
            supportHand.mark_cards(
                function(){return chosen===0;},
                async function(card){
                    card.bandit = true; 
                    chosen = 1;
                    await trash_card(card, false);
                    supportHand.setCardAll(supportHand.getCardAll().filter(c => !c.bandit));
                    for(let c of supportHand.getCardAll()){
                        if(c.id !== card.id){
                            await discard_card(c, false);
                        }
                    }
                    supportHand.clear();
                    resolve('Bandit is_attacked finish');      
                },
            'trash');
        });
    }
}
class Laboratory extends Card{
    constructor(player){
        super("Laboratory", new Cost(5), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await getBasicStats().addAction(1);
        await drawNCards(2);
    } 
}
class Mine extends Card{
    constructor(player){
        super("Mine", new Cost(5), Card.Type.ACTION, "Base/", player);
    }
    play(){
        if(getHand().length() >= 0){
            return new Promise((resolve) => { 
                let clearFunc = function(){
                    getButtonPanel().clear_buttons();
                    getHand().remove_mark();
                }
                getButtonPanel().clear_buttons();
                getButtonPanel().add_button("Cancel", async function(){
                    clearFunc();
                    resolve('Mine finish');
                });

                getHand().mark_cards(
                    function(card){return card.type.includes("Treasure")}, 
                    async function(card){
                        clearFunc();
                        await trash_card(card);
                        await this.play_step1(card);
                        resolve('Mine finish');
                    }.bind(this),
                'trash');
            });
        } 
    } 
    play_step1(card){
        if(!card) return;
        return new Promise((resolve) => {
            markSupplyPile(
                function(pile){
                    let cost = new Cost(3);
                    cost.addCost(card.cost);
                    return pile.getType().includes("Treasure") && cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity() > 0;
                },
                async function(pile){
                    removeMarkSupplyPile();
                    let new_card = await gain_card(pile, getHand());
                    resolve('Mine finish')
                }
            );
        });
    }
}
class Market extends Card{
    constructor(player){
        super("Market", new Cost(5), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await getBasicStats().addAction(1);
        await getBasicStats().addCoin(1);
        await draw1();
        await getBasicStats().addBuy(1);
    } 
}
class Festival extends Card{
    constructor(player){
        super("Festival", new Cost(5), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await getBasicStats().addAction(2);
        await getBasicStats().addBuy(1);
        await getBasicStats().addCoin(2);
    } 
}
class Witch extends Card{
    constructor(player){
        super("Witch", new Cost(5), Card.Type.ACTION + ' ' + Card.Type.ATTACK, "Base/", player);
    }
    async play(){
        await drawNCards(2);

        await attack_other(this);
    } 
    attack(){}
    async is_attacked(){
        await gain_card_name('Curse');
    }
}
class Sentry extends Card{
    constructor(player){
        super("Sentry", new Cost(5), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        await getBasicStats().addAction(1);
        await draw1();
        if(getDeck().length() < 2){await mix_discard_to_deck();}
        if(getDeck().length() <= 0) return;
        await this.play_step1();
        let supportHand = getSupportHand();
        if(supportHand.length() > 0) {
            await this.play_step2();
        }
        if(supportHand.length() === 2){
            await this.play_step3();
        }
        getDeck().addCardList(supportHand.getCardAll());
        supportHand.clear();
        getButtonPanel().clear_buttons();
    }
    async play_step1(){
        return new Promise(async (resolve)=>{
            let supportHand = getSupportHand();
            supportHand.clear();
            const n = Math.min(getDeck().length(), 2);
            for(let i=0; i<n; i++){
                let card = await getDeck().pop();
                await supportHand.addCard(card);
            }
            supportHand.getCardAll().forEach(card => card.sentry=undefined);
            supportHand.getCardAll().reverse();
            let clearFunc = async function(){
                getButtonPanel().clear_buttons();
                await supportHand.remove_mark();
            }

            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Confirm Trashing",async function(){
                await clearFunc();
                let i=0;
                while(i<supportHand.length()){
                    let card = supportHand.getCardAll()[i];
                    if(card.sentry){
                        await trash_card(card, false);
                        await supportHand.remove(card);
                    } else i++;
                }
                for(let i=0; i<supportHand.length(); i++){
                }
                resolve('Sentry finish');
            });
            
            supportHand.mark_cards(
                function(){return true;},
                function(card){
                    card.sentry = true;
                },
            'trash');
        });
    } 
    async play_step2(){
        return new Promise((resolve) => {
            let supportHand = getSupportHand();
            let clearFunc = async function(){
                getButtonPanel().clear_buttons();
                await supportHand.remove_mark();
            }
            
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Confirm Discard", async function(){
                await clearFunc();
                let i=0;
                while(i<supportHand.length()){
                    let card = supportHand.getCardAll()[i];
                    if(card.sentry){
                        await discard_card(card, false);
                        await supportHand.remove(card);
                    } else i++;
                }
                await supportHand.setCardAll(supportHand.getCardAll().filter(card => !card.sentry)); 
                resolve();         
            });

            supportHand.getCardAll().forEach(card => card.sentry=undefined);
            supportHand.mark_cards(
                function(){return true;},
                function(card){
                    card.sentry = true;                       
                },
                'discard',
            );
        });
    }
    play_step3(){
        return new Promise((resolve) => {
            let supportHand = getSupportHand();

            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("OK", function(){      
                getButtonPanel().clear_buttons();
                resolve();
            });
            getButtonPanel().add_button("Swap", async function(){
                await supportHand.setCardAll(supportHand.getCardAll().reverse());
            }, 
            false);
        });
    }
}
class Artisan extends Card{
    constructor(player){
        super("Artisan", new Cost(6), Card.Type.ACTION, "Base/", player);
    }
    async play(){
        return new Promise((resolve) => {
            markSupplyPile(
                function(pile){
                    let cost = new Cost(5);
                    return cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity() > 0;
                },
                async function(pile){
                    removeMarkSupplyPile();

                    let new_card = await gain_card(pile, getHand());
                    
                    await this.play_step2();
                    resolve();
                }.bind(this));
        });
    } 
    play_step2(){
        return new Promise((resolve) => {
            getHand().mark_cards(
                (()=> true), 
                async function(card){
                    getHand().remove_mark();

                    let removed = await getHand().removeCardById(card.id);
                    if(removed) await getDeck().addCard(card);

                    resolve();
                },
                'discard');
        });
    }
}

export {Chapel, Cellar, Moat, Village, Harbinger, Merchant, Vassal, Smithy, Remodel, Bureaucrat, ThroneRoom,
     Militia, Gardens, Workshop, Moneylender, Poacher, CouncilRoom, Library, Bandit,
    Sentry, Laboratory, Mine, Market, Festival, Witch, Artisan};