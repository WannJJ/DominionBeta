import {Card, Cost} from '../cards.js';
import {REASON_WHEN_GAIN} from '../../game_logic/ReactionEffectManager.js';

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


class Hovel extends Card{
    constructor(player){
        super("Hovel", new Cost(1), `${Card.Type.REACTION} ${Card.Type.SHELTER}`, "DarkAges/Shelters/", player);
        this.activate_when_gain = true;
        this.activate_when_in_hand = true;
    }
    play(){} 
    should_activate(reason, card){
        return reason == REASON_WHEN_GAIN && card != undefined && card.type.includes('Victory');
    }
    activate(reason, card){
        return new Promise((resolve)=> {
            getButtonPanel().clear_buttons();
            getButtonPanel().add_button('Trash Hovel', async function(){
                getButtonPanel().clear_buttons();
                await trash_card(this);
                resolve('Hovel activate finish');
            }.bind(this));  
            getButtonPanel().add_button("Cancel", function(){
                getButtonPanel().clear_buttons();
                resolve('Hovel activate finish');
            }.bind(this));          
        });
    }
}
class Necropolis extends Card{
    constructor(player){
        super("Necropolis", new Cost(1), `${Card.Type.ACTION} ${Card.Type.SHELTER}`, "DarkAges/Shelters/", player);
    }
    async play(){
        await getBasicStats().addAction(2);
    } 
}
class OvergrownEstate extends Card{
    constructor(player){
        super("OvergrownEstate", new Cost(1), `${Card.Type.VICTORY} ${Card.Type.SHELTER}`, "DarkAges/Shelters/", player);
    }
    play(){} 
    async is_trashed(){
        await draw1();
    }
}

export{Hovel, Necropolis, OvergrownEstate};
