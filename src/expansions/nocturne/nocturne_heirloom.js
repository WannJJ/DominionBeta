import {Card, Cost} from '../cards.js';

import { getPlayField, getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { gain_card, gain_card_name, discard_card, trash_card,} from '../../game_logic/Activity.js';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import { getPlayer } from '../../player.js';
/*
class  extends Card{
    constructor(player){
        super("", new Cost(), `${Card.Type.TREASURE} ${Card.Type.HEIRLOOM}`, "Nocturne/Heirloom/", player);
    }
    play(){
    } 
}
*/
class HauntedMirror extends Card{
    constructor(player){
        super("HauntedMirror", new Cost(0), `${Card.Type.TREASURE} ${Card.Type.HEIRLOOM}`, "Nocturne/Heirloom/", player);
    }
    async play(){
        await getBasicStats().addCoin(1);
    } 
    is_trashed(){
        if(getHand().getLength() <= 0) return;
        return new Promise((resolve) =>{
            let clearFunc = async function(){
                getButtonPanel().clear_buttons();
                await getHand().remove_mark();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Cancel', async function(){
                await clearFunc();
                resolve('HauntedMirror is trashed finish');
            }.bind(this));
            let is_marked = getHand().mark_cards(
                c => c.type.includes('Action'),
                async function(card){
                    await clearFunc();
                    await discard_card(card);
                    await gain_card_name('Ghost');
                    resolve('HauntedMirror is trashed finish');
                }.bind(this),
                'discard',
            );
        });
    }
}
class MagicLamp extends Card{
    constructor(player){
        super("MagicLamp", new Cost(0), `${Card.Type.TREASURE} ${Card.Type.HEIRLOOM}`, "Nocturne/Heirloom/", player);
    }
    async play(){
        await getBasicStats().addCoin(1)
        let name_list = [],
            rejected_name_list = [];
        for(let card of getPlayField().getCardAll()){
            if(rejected_name_list.includes(card.name)) continue;
            if(!name_list.includes(card.name)){
                name_list.push(card.name);
            } else{
                rejected_name_list.push(card.name);
                let index = name_list.indexOf(card.name);
                if(index != -1){
                    name_list.splice(index, 1);
                }
            }
        }
        if(name_list.length == 6){
            await getPlayField().remove(this);
            await trash_card(this, false);
            await gain_card_name('Wish');
            await gain_card_name('Wish');
            await gain_card_name('Wish');
        }
    } 
}
class Goat extends Card{
    constructor(player){
        super("Goat", new Cost(2), `${Card.Type.TREASURE} ${Card.Type.HEIRLOOM}`, "Nocturne/Heirloom/", player);
    }
    async play(){
        await getBasicStats().addCoin(1);
        if(getHand().getLength() <= 0) return;
        return new Promise((resolve) => {
            this.chosen = 0;
            let clearFunc = async function(){
                await getHand().remove_mark();
                getButtonPanel().clear_buttons();
            }
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button("Cancel", async function(){
                await clearFunc();
                resolve('PrizeGoat finish');
            }.bind(this));

            getHand().mark_cards(
                function(){
                    return this.chosen == 0;
                }.bind(this), 
                async function(card){
                    this.chosen += 1;
                    await clearFunc();
                    await trash_card(card);
                    resolve('PrizeGoat finish');    
                }.bind(this),
                'trash'
            );
        });
    } 
}
class Pasture extends Card{
    constructor(player){
        super("Pasture", new Cost(2), `${Card.Type.TREASURE} ${Card.Type.VICTORY} ${Card.Type.HEIRLOOM}`, "Nocturne/Heirloom/", player);
    }
    async play(){
        await getBasicStats().addCoin(1)
    } 
    async add_score(){
        let estateCount = 0;
        for(let card of getPlayer().all_cards){
            if(card.name == 'Estate'){
                estateCount += 1;
                await getBasicStats().addScore(estateCount);
            }
        }
    }
}
class Pouch extends Card{
    constructor(player){
        super("Pouch", new Cost(2), `${Card.Type.TREASURE} ${Card.Type.HEIRLOOM}`, "Nocturne/Heirloom/", player);
    }
    async play(){
        await getBasicStats().addCoin(1);
        await getBasicStats().addBuy(1);
    } 
}
class CursedGold extends Card{
    constructor(player){
        super("CursedGold", new Cost(4), `${Card.Type.TREASURE} ${Card.Type.HEIRLOOM}`, "Nocturne/Heirloom/", player);
    }
    async play(){
        await getBasicStats().addCoin(3);
        await gain_card_name('Curse');
    } 
}
class LuckyCoin extends Card{
    constructor(player){
        super("LuckyCoin", new Cost(4), `${Card.Type.TREASURE} ${Card.Type.HEIRLOOM}`, "Nocturne/Heirloom/", player);
    }
    async play(){
        await getBasicStats().addCoin(1)
        await gain_card_name('Silver');
    } 
}

export{HauntedMirror, MagicLamp, Goat, Pasture, Pouch, CursedGold, LuckyCoin};