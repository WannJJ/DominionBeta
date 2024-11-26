
import { Cost} from './expansions/cards.js';
import { getBasicSupply, getKingdomSupply, markSupplyPile, removeMarkSupplyPile } from './features/TableSide/Supply.jsx';
import { findSupplyPile } from './features/TableSide/SupplyPile.jsx';
import { getDiscard, getDeck } from './features/PlayerSide/CardPile/CardPile.jsx';
import { getPlayField, getHand } from './features/PlayerSide/CardHolder/CardHolder.jsx';
import  { getPlayArea, getExile, getSetAside }  from './features/PlayerSide/BottomLeftCorner/SideArea.jsx';
import { setInstruction } from './features/PlayerSide/Instruction.jsx';
import { getButtonPanel } from './features/PlayerSide/ButtonPanel.jsx';
import { getBasicStats } from './features/PlayerSide/PlayerSide.jsx';
import { getLogger } from './Components/Logger.jsx';
import { getGameState, GameState} from './game_logic/GameState.js';
import { getLandscapeEffectManager } from './features/TableSide/LandscapeEffect/LandscapeEffectManager.js';
import { drawNCards, play_card, autoplay_treasures, buy_and_gain_card, buy_landscape_card, } from './game_logic/Activity.js';

import { reactionEffectManager } from './game_logic/ReactionEffectManager.js';
import audioManager from './Audio/audioManager.js';
import { openResultBoard } from './features/AfterGame/Result.jsx';
import { opponentManager } from './features/OpponentSide/Opponent.js';
import { create_number_picker, hide_number_picker } from './Components/user_input/NumberPicker.jsx';
import { HexBoonManager, stateHolder } from './expansions/nocturne/HexBoonManager.js';
import { getIslandMat, getNativeVillageMat, getPirateShipMat } from './features/PlayerSide/BottomLeftCorner/PlayerMats.jsx';



const PHASE_ACTION = 'action',
        PHASE_BUY = 'buy',
        PHASE_NIGHT = 'night',
        PHASE_REACTION = 'reaction',
        PHASE_WAITING = 'waiting',
        PHASE_START_TURN = 'start turn',
        PHASE_CLEAN_UP = 'clean up',
        PHASE_END_TURN = 'end turn',
        PHASE_END_GAME = 'end game';
        /*
        When Another: When play attack, when gain
        When You: When you trash a card (Tomb,Priest, Sewers ), When you gain, When you play (Urchin, Seaway, LostArts, Training, Pathfinding, Teacher, Champion, Sauna), 
            When you discard (Herbalist, Scheme, Horn, Trickster, Tireless, Herbalist), When shuffling/ when you shuffle (Order of masons, order of astroloders, fated, stash, star chart),
        At the start (114):  At the start of your next turn (70, almost duration), At the start of your turn(23), At the start of your buy phase(9, Only for landmark, ally, state, artifact), 
            At the start of Clean-up(Alchemist, Encampment, Improve, Walled Village), At the start of each of your turn(Hireling, Crypt, Quartermaster, Endless Chalice, Prince), 
        At the end (10): At the end of your buy phase(Treasury, Hermit, Merchant ild, Wine Merchant, Pageant, Exploration), At the end of your turn(Island Folk), At the end of the game(Distant Land), At the end of each turn(Way of the Squirrel, River Gift)
        The next time (12): you gain(Charm, Cage, SeludedShrine, Abundance, Rush, Mirror), you play (Kiln, Flagship), you shuffle(Avoid),
            a Supply pile empites(Search), anyone gains a Treasure(Cutthroat), the first card you play(Landing Party)
        The first time (6): you play(merchant, outpost, crossroad, fools gold, citadel), each other plays (Enchantress),
        
        */
let player = null;
class Player{
    constructor(username, ordinal_number=0, report_ingame=function(){}, notify_end_turn=function(){}, notify_end_game=function(){}){
        this.username = username;   
        this.ordinal_number = ordinal_number;
        this.report_ingame = report_ingame;
        this.notify_end_turn = notify_end_turn;
        this.notify_end_game = notify_end_game;
        // phase: action, buy, night, reaction, waiting, other
        this.phase = PHASE_WAITING;

        // common stats
        //TODO: villager, potion, artifact, token, ...
        this.turn = 0;
        this.move = 0;

        // player's different fields
        /*
        this.nocturneEffectHolder = new NocturneEffectHolder();
        */
        this.all_cards = [];

        //attributes for buy phase
        this.can_play_treasure_buy_phase = true;
        this.can_not_buy_action_this_turn = false; // Use for Deluded
        this.attacked_by_envious = false; // Use for Envious

        this.can_not_be_attacked = false; // Use for Moat, Lighthouse and Shield

        this.extra_turn = {
            playExtraTurn: false,
            cannotPlayExtraTurnByCards: false,
            currentlyInExtraTurn: false,
            possession: null,
            cardsCauseExtraTurn: [], //Outpost, Mission, Voyage, Island Folk or Journey
            SeizeTheDay: null,
            Fleet: null,
        }

        this.player_list = []; // use for multiplayer, including this

        reactionEffectManager.setPlayer(this);
        player = this;
    }
    async update_score(){
        await getBasicStats().setScore(0);
        this.all_cards = [];
        this.all_cards.push(...getDeck().getCardAll());
        this.all_cards.push(...getDiscard().getCardAll());
        this.all_cards.push(...getHand().getCardAll());
        this.all_cards.push(...getPlayField().getCardAll());
        this.all_cards.push(...getExile().getCardAll());

        this.all_cards.push(...getPlayArea().getCardAll());
        this.all_cards.push(...getSetAside().getCardAll());
        this.all_cards.push(...getIslandMat().getCardAll());
        this.all_cards.push(...getPirateShipMat().getCardAll());
        this.all_cards.push(...getNativeVillageMat().getCardAll());
        
        for(let card of this.all_cards){
            await card.add_score();
        }
        for(let state of stateHolder.getStateList()){
            await state.add_score();
        }
        /* TODO
        this.landscapeEffectManager.effect_list.forEach(e => e.add_score());
        */
    }
    // PHASE HANDLING
    async continue_phase(){
        if(this.phase === PHASE_START_TURN){
            await this.start_turn();
        }
        else if(this.phase === PHASE_ACTION){
            if(getBasicStats().getAction() <= 0){
                await this.start_buy_phase();
            }
            else{
                await this.update_action_phase();
            }
        }
        else if(this.phase === PHASE_BUY){
            if(getBasicStats().getBuy() <= 0){
                await this.end_buy_phase();
            }
            else{
                await this.update_buy_phase();
            }
        }
        else if(this.phase === PHASE_NIGHT){
                this.update_night_phase();
        }        
        else if(this.phase === PHASE_REACTION){
            this.phase = PHASE_WAITING;
        } else if(this.phase === PHASE_WAITING){
            throw new Error('waiting...');
        }
        else alert("INVALID Phase handling");
    }

    // START PHASES
    async start_waiting_phase(){
        this.phase = PHASE_WAITING;
        await this.notify_end_turn();
    }
    async start_game(){ 
        if(getHand().length()>0 || getPlayField().length()>0){
            while(getHand().length()>0){
                await getDiscard().addCard(await getHand().pop());
            }         
        }
        await drawNCards(5);
        await getBasicStats().setAction(1);
        await getBasicStats().setBuy(1);
        await getBasicStats().setCoin(0);
        getButtonPanel().clear_buttons();
    }
    async start_turn(){
        this.phase = PHASE_START_TURN; 
        if(this.ordinal_number == 0){
            this.turn += 1;
        }
        //this.move += 1;
        this.can_not_be_attacked = false;
        getLogger().deindent();
        getLogger().writeMessage('TURN ' + this.turn + ":");
        getGameState().new_turn();
        getLogger().indent_();
        //play all remaining duration/set aside cards
        await reactionEffectManager.solve_cards_at_start_turn();
        getGameState().update_state();
        this.start_action_phase();
    }   
    async start_extra_turn(){
        this.phase = PHASE_START_TURN; 
        this.extra_turn.currentlyInExtraTurn = true;
        //this.move += 1;
        this.can_not_be_attacked = false;
        getLogger().deindent();
        getLogger().writeMessage("EXTRA TURN :");
        getGameState().new_turn();
        getLogger().indent_();
        //play all remaining duration/set aside cards
        await reactionEffectManager.solve_cards_at_start_turn();
        getGameState().update_state();
        this.start_action_phase();
    }
    start_action_phase(){
        this.phase = PHASE_ACTION;
        getLogger().writeMessage("ACTION PHASE:")
        audioManager.playSound('yourTurn');
        this.update_action_phase();
    }
    async start_buy_phase(){
        this.phase = PHASE_BUY;
        this.can_play_treasure_buy_phase = true;
        getLogger().writeMessage("BUY PHASE:");
        audioManager.playSound('yourTurn');

        await reactionEffectManager.solve_cards_at_start_buy_phase();
        await this.update_buy_phase(); 
    }
    start_night_phase(){
        if(!getHand().has_card(c => c.type.includes('Night'))) {
            this.start_clean_up_phase();
            return;
        }
        this.phase = PHASE_NIGHT;
        getLogger().writeMessage('NIGHT PHASE');
        audioManager.playSound('yourTurn');
        this.update_night_phase(); 
    }
    async start_clean_up_phase(){ 
        this.phase = PHASE_CLEAN_UP;
        await reactionEffectManager.solve_cards_at_start_cleanup_phase();

        if(getHand().length()>0 || getPlayField().length()>0){
            while(getHand().length()>0){
                await getDiscard().addCard(await getHand().pop());
            }
            while(getPlayField().length()>0){
                let card = await getPlayField().pop();
                if(card.not_discard_in_cleanup){
                    await getPlayArea().addCard(card);
                } else{
                    await getDiscard().addCard(card);
                }         
            } 
        } 
        if(!this.extra_turn.playExtraTurn){
            await drawNCards(5);
        }

        await this.end_turn();
    }
    // UPDATE PHASES
    async update_action_phase(){
        if(getBasicStats().getAction() <= 0 ){await this.start_buy_phase(); return;}
        if(this.phase != "action"){
            await this.continue_phase(); 
            return;
        }
        let clearFunc = async function(){
            getButtonPanel().clear_buttons();
            setInstruction('');
            await getHand().remove_mark();
            getLandscapeEffectManager().remove_mark();
        };
        getButtonPanel().clear_buttons();
        getButtonPanel().add_button("End Action", async function(){
            await clearFunc();
            await this.start_buy_phase();
        }.bind(this));

        let contain_action = getHand().mark_cards(
            function(card){return card.type.includes('Action')},
            async function(card){
                this.move += 1;
                await getBasicStats().setAction(getBasicStats().getAction() - 1);
                await clearFunc();
                await getHand().remove(card);
                await play_card(card);
                getGameState().update_state();
                this.update_action_phase();
            }.bind(this),
            'choose',
        );
        if(!contain_action){
            await this.start_buy_phase();
            return;
        }
        else{
            setInstruction('You may play Action');
        }
        getLandscapeEffectManager().mark_cards(
            function(card){return card.getType().includes('Way') && card.getCard().should_activate_way('')},
            async function(card){
                clearFunc();
                this.move += 1;
                await getBasicStats().setAction(getBasicStats().getAction() - 1);
                await card.activate_way();
                await this.update_action_phase();
            }.bind(this),
        );
    }
    async update_buy_phase(){
        if((getBasicStats().getDebt() <= 0 && getBasicStats().getBuy() <= 0 ) 
            || (getBasicStats().getDebt() > 0 && getBasicStats().getCoin() + getBasicStats().getCoffer() <= 0 
                && !this.can_play_treasure_buy_phase)){
            await this.end_buy_phase();
            return;
        }
        if(this.phase != PHASE_BUY){
            await this.continue_phase(); 
            return;
        }
        let clearFunc = function(){
            getButtonPanel().clear_buttons();
            setInstruction('');
            getHand().remove_mark();
            removeMarkSupplyPile();
            getLandscapeEffectManager().remove_mark();
            hide_number_picker();
        }
        getButtonPanel().clear_buttons();
        getButtonPanel().add_button("End Buy", async function(){
            clearFunc();
            await this.end_buy_phase();
        }.bind(this));


        if(this.can_play_treasure_buy_phase){
            let contain_treasure = getHand().mark_cards(
                (card) => card.type.includes('Treasure'),
                async function(card){
                    this.move += 1;
                    clearFunc()
                    await getHand().remove(card);
                    await play_card(card);
                    getGameState().update_state();
                    this.update_buy_phase();
                }.bind(this),
                'choose');
            //Autoplay Treasure button
            if(contain_treasure && getHand().has_card(c =>  ['Copper', 'Silver', 'Gold', 'Platinum'].includes(c.name))){
                getButtonPanel().add_button("Autolay Treasures", autoplay_treasures);
            }
        }
        if(getBasicStats().getDebt() > 0){
            setInstruction('You have to pay debt first')
            
            await new Promise((resolve) =>{
                create_number_picker(
                    0,
                    Math.min(getBasicStats().getDebt(), getBasicStats().getCoin() + getBasicStats().getCoffer()),
                    async function(value){
                        this.can_play_treasure_buy_phase = false;
                        if(getBasicStats().getCoin() >= value){
                            await getBasicStats().addCoin(-1*value);
                        } else{
                            await getBasicStats().addCoffer(getBasicStats().getCoin() - value);
                            await getBasicStats().setCoin(0);
                        }
                        if(getBasicStats().getDebt() >= value){
                            await getBasicStats().setDebt(getBasicStats().getDebt() - value);
                        } else {
                            await getBasicStats().setDebt(0);
                        }

                        resolve(value);
                    }.bind(this)
                );
            });

            if(getBasicStats().getDebt() > 0){
                clearFunc();
                this.end_buy_phase();
            } else{
                await this.update_buy_phase();
            }
            
            
        } else{ 
            setInstruction('You may buy card');
            markSupplyPile(
                function(pile){
                    let basicStats = getBasicStats(),
                        cost = new Cost(basicStats.getCoin() + basicStats.getCoffer());
                    if(this.can_not_buy_action_this_turn){
                        return pile.getQuantity() > 0 
                                && cost.sufficientToBuy(pile.getCost()) 
                                && !pile.getType().includes('Action');
                    } else {
                        return pile.getQuantity() > 0 && cost.sufficientToBuy(pile.getCost());
                    }
                }.bind(this),
                async function(pile){    
                    this.move += 1;
                    this.can_play_treasure_buy_phase = false;
                    clearFunc();
                    await buy_and_gain_card(pile)
                    getGameState().update_state();
                    await this.update_buy_phase();
                }.bind(this),
            );
            getLandscapeEffectManager().mark_cards(
                function(landscape_card){
                    let cost = new Cost(getBasicStats().getCoin() + getBasicStats().getCoffer());
                    return (landscape_card.getType().includes('Event') || landscape_card.getType().includes('Trait') || landscape_card.getType().includes('Project')) 
                            && cost.sufficientToBuy(landscape_card.getCost());
                }.bind(this),
                async function(card){
                    clearFunc();
    
                    this.move += 1;
                    this.can_play_treasure_buy_phase = true;
                    await buy_landscape_card(card);
                    getGameState().update_state();
                    this.update_buy_phase();
                }.bind(this)
            );
        }  
    }
    update_night_phase(){
        if(this.phase != "night"){this.start_clean_up_phase();return;}
        getButtonPanel().clear_buttons();
        getButtonPanel().add_button("End Night", function(){
            getButtonPanel().clear_buttons();
            setInstruction('');
            this.start_clean_up_phase();
        }.bind(this));

        let contain_night = getHand().mark_cards(
            function(card){return card.type.includes("Night");},
            async function(card){
                setInstruction('');
                this.move += 1;
                getButtonPanel().clear_buttons();
                await getHand().remove(card);
                await play_card(card);
                getGameState().update_state();
                this.update_night_phase();
            }.bind(this));
        if(!contain_night){this.start_clean_up_phase()}
        else{
            setInstruction('You may play Night card');
        }
    }
    async end_buy_phase(){
        await reactionEffectManager.solve_cards_at_end_buy_phase();
        this.start_night_phase();
    }
    async end_turn(){
        this.phase = PHASE_END_TURN;
        this.can_not_buy_action_this_turn = false;
        this.attacked_by_envious = false;    
        await reactionEffectManager.solve_cards_at_end_turn();
        HexBoonManager.returnAllBoon();

        await getBasicStats().setAction(1);
        await getBasicStats().setBuy(1);
        await getBasicStats().setCoin(0);

        if(this.extra_turn.playExtraTurn){
            if(this.extra_turn.cardsCauseExtraTurn.length > 0){
                let card = this.extra_turn.cardsCauseExtraTurn.pop();
                this.extra_turn.cannotPlayExtraTurnByCards = true;
                this.extra_turn.cardsCauseExtraTurn = [];
                if(this.extra_turn.Fleet == null && this.extra_turn.SeizeTheDay == null 
                    && this.extra_turn.cardsCauseExtraTurn.length == 0 && this.extra_turn.possession == null){
                        this.extra_turn.playExtraTurn = false;
                        this.extra_turn.cannotPlayExtraTurnByCards = false;
                    }
                if(card.playExtraTurn != undefined){
                    await card.playExtraTurn();
                    await this.start_extra_turn();
                }
            }
        } else{
            this.extra_turn.playExtraTurn = false;
            this.extra_turn.cannotPlayExtraTurnByCards = false;
            await this.should_game_finish();

            //await this.start_waiting_phase();
        }

    }
    async should_game_finish(){
        let empty_basic = getBasicSupply().pile_list.filter(pile => pile.getQuantity()<=0);
        let empty_kingdom = getKingdomSupply().pile_list.filter(pile => pile.getQuantity()<=0);
        let empty_supply_piles_count = empty_basic.length + empty_kingdom.length;
        
        let colony_pile = findSupplyPile(pile => pile.getName() == 'Colony');

        let province_pile = findSupplyPile(pile => pile.getName() == 'Province');
        

        if(empty_supply_piles_count >= 3 || colony_pile.getQuantity() <= 0 || province_pile.getQuantity() <= 0){
            this.end_game();
        } else{
            await this.start_waiting_phase();
        }
    }
    end_game(){
        if(this.phase === PHASE_END_GAME) return;

        let isWinner = false;

        if(opponentManager.getOpponentList().length == 0){
            isWinner = true;
        } else{
            isWinner = true;
            var totalScore = getBasicStats().getScore() + getBasicStats().getVictoryToken();
            for(let opponent of opponentManager.getOpponentList()){
                if(opponent.score + opponent.victory_token > totalScore){
                    isWinner = false;
                    break;
                }
            }
        }

        if(isWinner){
            audioManager.playSound('win');
            openResultBoard(isWinner);
        } else{
            audioManager.playSound('gameOver');
            openResultBoard(isWinner);
        }
        
        alert('TADA, GAME END!!');
        this.notify_end_game();
        this.phase = PHASE_END_GAME;

    }   
}
function getPlayer(){ 
    return player;
}
export {Player, getPlayer};