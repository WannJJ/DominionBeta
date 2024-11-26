import { getPlayField, getHand } from "./features/PlayerSide/CardHolder/CardHolder";
import { getPlayArea, getSetAside} from "./features/PlayerSide/BottomLeftCorner/SideArea";
import { getButtonPanel } from "./features/PlayerSide/ButtonPanel";

    /*
    When Another: When play attack, when gain, when another player gains or Invests (Invest)
    When You: When you trash a card (Tomb,Priest, Sewers ), When you gain, When you play (Urchin, Seaway, LostArts, Training, Pathfinding, Teacher, Champion, Sauna), 
        When you discard (Herbalist, Scheme, Horn, Trickster, Tireless, Herbalist), When shuffling/ when you shuffle (Order of masons, order of astroloders, fated, stash, star chart, Avoid),
    At the start (114):  At the start of your next turn (70, almost duration), At the start of your turn(23), At the start of your buy phase(9, Only for landmark, ally, state, artifact), 
        At the start of Clean-up(Alchemist, Encampment, Improve, Walled Village), At the start of each of your turn(Hireling, Crypt, Quartermaster, Endless Chalice, Prince), 
    At the end (10): At the end of your buy phase(Treasury, Hermit, Merchant Guild, Wine Merchant, Pageant, Exploration), At the end of your turn(Island Folk, Baths, PuzzleBox, Deliver), At the end of the game(Distant Land), At the end of each turn(Way of the Squirrel, River Gift)
    The next time (12): you gain(Charm, Cage, SeludedShrine, Abundance, Rush, Mirror), you play (Kiln, Flagship), you shuffle(Avoid),
        a Supply pile empites(Search), anyone gains a Treasure(Cutthroat), the first card you play(Landing Party)
    The first time (6): you play(merchant, outpost, crossroad, fools gold, citadel), each other plays (Enchantress),
    Once per turn:

    When gain: not gain to discard: Sailor, Sleigh, DenofSin, GhotTown, NightWatchman, Guardian, Ghost
    

let card_activate_when_in_hand = [Moat, Sailor, Pirate],
    card_activate_permanently = [Arena, Bandit_Fort, Basilica, Baths, Battlefield, Colonnade, Defiled_Shrine, Fountain, Keep, Labyrinth, Mountain_Pass,
        Museum, Obelisk, Orchard, Palace, Tomb, Tower, Triumphal_Arch, Wall, Wolf_Den],
    card_activate_when_set_aside = [];
    */

    const REASON_SHUFFLE = 'activate_when_shuffle', // Order of masons, order of astroloders, fated, stash, star chart, Emissary, Avoid
    REASON_START_TURN = 'activate_when_start_turn', // 23 cards
    REASON_START_BUY = 'activate_when_start_buy_phase', // 9 cards, Only landmark, ally, state and artifact
    REASON_END_BUY = 'activate_when_end_buy_phase', // Treasury, Hermit, Merchant Guild, Wine Merchant, Pageant, Exploration
    REASON_START_CLEANUP = 'activate_when_start_cleanup',   //Alchemist, Encampment, Improve, Walled Village
    REASON_END_TURN = 'activate_when_end_turn', // Island Folk, Baths, PuzzleBox, The River's Gift
    REASON_END_GAME = 'activate_when_end_game', //Distant Land

    REASON_WHEN_PLAY = 'activate_when_play',    // used for Urchin, Seaway, LostArts, Training, Pathfinding, Teacher, Champion, Sauna, Merchant, Kiln
    REASON_WHEN_GAIN = 'activate_when_gain',    //maybe không cần phải implement
    REASON_WHEN_DISCARD = 'activate_when_discard',   // used for Herbalist, Scheme, Horn, Trickster, Tireless, Herbalist
    REASON_WHEN_TRASH = 'activate_when_trash',

    REASON_WHEN_BEING_ATTACKED = 'activate_when_another_attacks',
    REASON_WHEN_ANOTHER_GAIN = 'activate_when_another_gains', 

    POSITION_HAND = 'hand',
    POSITION_PLAY_FIELD = 'playField',
    POSITION_PLAY_AREA = 'playArea',
    POSITION_LANDSCAPE_EFFECT = 'landscapeEffecManager',
    POSITION_NOCTURNE_EFFECT_HOLDER = 'nocturneEffectHolder';


class ReactionEffectManager{
    constructor(player){
        this.player = player;
    }
    get_possible_cards(reason, card){
        let card_list = [];
        for(let c of getHand().getCardAll()){
            if(c.activate_when_in_hand && c[reason] && c.should_activate(reason, card)){
                card_list.push({card: c, position: POSITION_HAND});
            }
        }
        for(let c of getPlayField().getCardAll()){
            if(c.activate_when_in_play && c[reason] && c.should_activate(reason, card)){
                card_list.push({card: c, position: POSITION_PLAY_FIELD});
            }
        }
        for(let c of getPlayArea().getCardAll()){
            if(c.activate_when_being_set_aside && c[reason] && c.should_activate(reason, card)){
                card_list.push({card: c, position: POSITION_PLAY_AREA});
            }
        }
        /* TODO
        for(let effect_card of this.player.landscapeEffectManager.effect_list){
            if((effect_card.activate_permanently || effect_card.activate_currently) && effect_card[reason] && effect_card.should_activate(reason, card)){
                card_list.push({card: effect_card, position: POSITION_LANDSCAPE_EFFECT});
            }
        }
        for(let nocturne_effect_card of this.player.nocturneEffectHolder.cards){
            if(nocturne_effect_card.activate_currently && nocturne_effect_card[reason] && nocturne_effect_card.should_activate(reason, card)){
                card_list.push({card: nocturne_effect_card, position: POSITION_NOCTURNE_EFFECT_HOLDER});
            }
        }
        */
        return card_list;
    }
    async solve_cards_at_start_turn(){
        const reason = REASON_START_TURN;
        let card_list = this.get_possible_cards(reason);
        await this.solve_remaining_effects(REASON_START_TURN);
    }
    async solve_cards_at_start_buy_phase(){
        await this.solve_remaining_effects(REASON_START_BUY);
    }
    async solve_cards_at_end_buy_phase(){
        await this.solve_remaining_effects(REASON_END_BUY);
    }
    async solve_cards_at_start_cleanup_phase(){
        await this.solve_remaining_effects(REASON_START_CLEANUP);
    }
    async solve_cards_at_end_turn(){
        await this.solve_remaining_effects(REASON_END_TURN);
    }
    async solve_cards_when_play(card){
        if(card == undefined) return;
        await this.solve_remaining_effects(REASON_WHEN_PLAY, card);
    }
    async solve_cards_when_gain(card){
        if(card == undefined) return;
        await this.solve_remaining_effects(REASON_WHEN_GAIN, card);
    }
    async solve_cards_when_discard(card){
        if(card == undefined) return;
        await this.solve_remaining_effects(REASON_WHEN_DISCARD, card);
    }
    async solve_cards_when_trash(card){
        if(card == undefined) return;
        await this.solve_remaining_effects(REASON_WHEN_TRASH, card);
    }
    async solve_cards_when_shuffle(){
        
        await this.solve_remaining_effects(REASON_SHUFFLE);
    }

    async solve_cards_when_another_attacks(card){
        if(card == undefined) return;
        await this.solve_remaining_effects(REASON_WHEN_BEING_ATTACKED, card);
    }
    async solve_cards_when_another_gains(card){
        if(card == undefined) return;
        await this.solve_remaining_effects(REASON_WHEN_ANOTHER_GAIN, card);
    }

    async solve_remaining_effects(reason, card){
        let card_list = this.get_possible_cards(reason, card);
        while(card_list.length > 0){
            getButtonPanel().clear_buttons();
            if(card_list.length == 1){
                let c_object = card_list.pop();
                let duration_card = c_object.card,
                    position = c_object.position;
                if(duration_card.should_activate(reason, card)){
                    if(duration_card.type.includes('Reaction') && position == POSITION_HAND){
                        //ask wether player wants to activate
                    } else{
                        await this.remove_card_from_position(duration_card, position);
                    }
                    await this.player.activate_card(duration_card, reason, card);
                }
            } else{
                await new Promise((resolve) =>{
                    for(let i=0; i<card_list.length; i++){
                        let c_object = card_list[i];
                        let duration_card = c_object.card,
                            position = c_object.position;
                        if(!duration_card.should_activate(reason, card)) continue;
                        getButtonPanel().add_button(`Play ${duration_card.name}`, 
                            async function(){   
                                if(duration_card.should_activate(reason, card)){
                                    let index = card_list.indexOf(c_object);
                                    if (index != -1) {
                                        card_list.splice(index, 1);
                                        if(duration_card.type.includes('Reaction') && position == 'hand'){
                                            //ask wether player wants to activate
                                        } else{
                                            await this.remove_card_from_position(duration_card, position);
                                        }
                                        await this.player.activate_card(duration_card, reason, card);
                                    }
                                }
                                resolve();
                            }.bind(this)
                        ); 
                    }
                });
            }
        }
    }
    async remove_card_from_position(card, position){
        let removed = undefined;
        switch(position){
            case POSITION_HAND:
                removed = await getHand().remove(card);
                if(!removed){
                    alert('Cant remove from hand');
                    return false;
                }
                getPlayField().addCard(card);
                break;
            case POSITION_PLAY_FIELD:
                break;
            case POSITION_PLAY_AREA:
                if(!(this.player.phase == 'reaction' || this.player.phase == 'waiting')){
                    removed = await getPlayArea().remove(card);
                    if(!removed){
                        alert('Cant remove from play area');
                        return false;
                    }
                    getPlayField().addCard(card);
                }                
                break;
            case POSITION_LANDSCAPE_EFFECT:
                break;
            case POSITION_NOCTURNE_EFFECT_HOLDER:
                if(card.name != "Lost_in_the_Woods"){
                    this.player.nocturneEffectHolder.remove(card);
                }
                break;
        }
    }
}

export {ReactionEffectManager,
    REASON_SHUFFLE, REASON_START_TURN, REASON_START_BUY, REASON_END_BUY, REASON_START_CLEANUP, REASON_END_TURN, REASON_END_GAME, 
    REASON_WHEN_PLAY, REASON_WHEN_GAIN, REASON_WHEN_DISCARD, REASON_WHEN_TRASH,
    REASON_WHEN_BEING_ATTACKED, REASON_WHEN_ANOTHER_GAIN};
