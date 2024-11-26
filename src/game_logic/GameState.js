import {getClassFromName} from "../setup.js";
import { getPlayer } from "../player.js";
import { getBasicSupply, getKingdomSupply  } from "../features/TableSide/Supply.jsx";
import { nonSupplyManager } from "../features/TableSide/NonSupplyPile.jsx";
import { CardHolder, getPlayField, getHand } from "../features/PlayerSide/CardHolder/CardHolder.jsx";
import { CardPile, getDiscard, getDeck, getTrash } from "../features/PlayerSide/CardPile/CardPile.jsx";
import { getBasicStats } from "../features/PlayerSide/PlayerSide.jsx";
import { getLandscapeEffectManager } from "../features/TableSide/LandscapeEffect/LandscapeEffectManager.js";
import { getPlayArea, getSetAside, getExile} from "../features/PlayerSide/BottomLeftCorner/SideArea.jsx";
import { getIslandMat, getPirateShipMat, getNativeVillageMat } from "../features/PlayerSide/BottomLeftCorner/PlayerMats.jsx";
import { getLogger } from "../Components/Logger.jsx";
import { opponentManager } from "../features/OpponentSide/Opponent.js";
import { HexBoonManager } from "../expansions/nocturne/HexBoonManager.js";




class GameState{
    constructor(){ 
        this.states = [];

        this.turn = 0;
        this.cards_played_this_turn = [];
        this.cards_gained_this_turn = [];
        this.cards_gained_this_buy_phase = [];//use for MerchantGuild, RiverShrine
        this.cards_buyed_this_turn = [];
        this.activities_this_turn = [];
        this.last_activity = {name: 'Wait'};
    }
    new_turn(){
        this.turn = getPlayer().turn;
        this.cards_played_this_turn = [];
        this.cards_gained_this_turn = [];
        this.cards_gained_this_buy_phase = [];
        this.cards_buyed_this_turn = [];
        this.activities_this_turn = [];
        this.last_activity = {name: 'Wait'};
    }
    // activity: [Play, Autoplay Treasures, Draw, Buy, Gain, Trash, Discard, Exile, Shuffle, React, Attack, Receive]
    update_activity(activity='', card=null, cardList=[]){
        if(card==null || card.name===undefined) this.last_activity = {name: activity, card: undefined};
        else if(activity === 'Autoplay Treasures' && Array.isArray(card)){
            this.last_activity = {name: 'Autoplay Treasures', card: card.map(c => c.name)}
        } else this.last_activity = {name: activity, card: card.name};
        switch(activity){
            case 'Play':
                this.cards_played_this_turn.push(card);
                this.activities_this_turn.push({name: 'Play', card: card.name});
                break;
            case 'Autoplay Treasures':
                if(Array.isArray(card)) this.cards_played_this_turn.push(...card);
                break;
            case 'Buy':
                this.cards_buyed_this_turn.push(card);
                this.activities_this_turn.push({name: 'Buy', card: card.name});
                break;
            case 'Gain':
                this.cards_gained_this_turn.push(card);
                if(getPlayer().phase === 'buy'){
                    this.cards_gained_this_buy_phase.push(card);
                }
                this.activities_this_turn.push({name: 'Gain', card: card.name});
                break;
            case "Buy and Gain":
                this.cards_buyed_this_turn.push(card);
                this.cards_gained_this_turn.push(card);
                if(getPlayer().phase === 'buy'){
                    this.cards_gained_this_buy_phase.push(card);
                }
                this.activities_this_turn.push({name: 'Buy and Gain', card: card.name});
                break;
            case 'Draw':
            case 'Discard':
            case 'Trash':
            case 'Exile':
                break;
            default:
        }
    }
    update_state(){
        let new_state = this.get_state();
        this.states.push(new_state)
    }

    get_state(){
        let state = {username: ''};
        state.turn = getPlayer().turn;
        state.move = getPlayer().move;
        state.phase = getPlayer().phase;        
        state.report = this.create_report();

        this.states.push(state);
        return state;
    }
    async undo(){
        if(opponentManager.getOpponentList().length !== 0) return;
        if(this.states.length === 0) return;

        
        let last_state = this.states.pop();
        while(last_state.move >= getPlayer().move){
            this.states.pop();
            if(this.states.length === 0) return;
            last_state = this.states.pop();
        }
        

        //TODO: bỏ cái states đi
        await this.parse_report(last_state.report);
        await getPlayer().continue_phase();
    }
    create_report(){
        let report = {};
        report.username = getPlayer().username;
        report.ordinal_number = getPlayer().ordinal_number;
        report.phase = getPlayer().phase;
        report.turn = getPlayer().turn;
        report.move = getPlayer().move;

        report.cards_played_this_turn = this.cards_played_this_turn.map(c=>c.createMockObject());
        report.cards_gained_this_turn = this.cards_gained_this_turn.map(c=>c.createMockObject());
        report.cards_buyed_this_turn = this.cards_buyed_this_turn.map(c=>c.createMockObject()); 
        
        report.last_activity = this.last_activity;  
        report.activities_this_turn = this.activities_this_turn.map(c=>c);
        
        report.basicSupply = getBasicSupply().createMockObject();
        report.kingdomSupply = getKingdomSupply().createMockObject();
        report.landscapeEffectManager = getLandscapeEffectManager().createMockObject();
        report.nonSupply = nonSupplyManager.createMockObject();
        report.hexboonManager = HexBoonManager.createMockObject();

        report.hand = getHand().createMockObject();
        report.playField = getPlayField().createMockObject();
        report.deck = getDeck().createMockObject();
        report.discard = getDiscard().createMockObject();
        report.trash = getTrash().createMockObject();
        report.setAside = getSetAside().createMockObject();
        report.playArea = getPlayArea().createMockObject(); 
        report.exile = getExile().createMockObject();

        report.islandMat = getIslandMat().createMockObject();
        report.pirateShipMat = getPirateShipMat().createMockObject();
        report.nativeVillageMat = getNativeVillageMat().createMockObject();

        report.basicStats = getBasicStats().createMockObject();
        report.can_play_treasure_buy_phase = getPlayer().can_play_treasure_buy_phase;
        report.can_not_be_attacked = getPlayer().can_not_be_attacked;

        report.logger = getLogger().createMockObject();
        
        report  = JSON.stringify(report);

        return report;
    }
    async parse_report(report){
        if (report===undefined || report==='') return;
        try{
            report = JSON.parse(report);
        } catch(err){
            console.warn('INALID REPORT:', report);
            alert('INVALID REPORT');
            return;
        }

        CardHolder.generateCardFromMockObject = generateCardFromMockObject;
        CardPile.generateCardFromMockObject = generateCardFromMockObject;

        if(report.username === getPlayer().username){
            getPlayer().phase = report.phase;
            
            this.cards_played_this_turn = report.cards_played_this_turn.map(cardObject => generateCardFromMockObject(cardObject));
            this.cards_gained_this_turn = report.cards_gained_this_turn.map(cardObject => generateCardFromMockObject(cardObject));
            this.cards_buyed_this_turn = report.cards_buyed_this_turn.map(cardObject => generateCardFromMockObject(cardObject));
            
            this.activities_this_turn = report.activities_this_turn;
            this.last_activity = report.last_activity;   

            await getLandscapeEffectManager().parseDataFromMockObjectOwn(report.landscapeEffectManager);
            HexBoonManager.parseDataFromMockObjectOwn(report.hexboonManager);
            

            await getHand().parseDataFromMockObject(report.hand, generateCardFromMockObject);
            await getPlayField().parseDataFromMockObject(report.playField);
            await getDeck().parseDataFromMockObject(report.deck);
            await getDiscard().parseDataFromMockObject(report.discard);
            await getExile().parseDataFromMockObject(report.exile);
            await getPlayArea().parseDataFromMockObject(report.playArea);
            await getSetAside().parseDataFromMockObject(report.setAside);

            await getIslandMat().parseDataFromMockObject(report.islandMat);
            await getPirateShipMat().parseDataFromMockObject(report.pirateShipMat);
            await getNativeVillageMat().parseDataFromMockObject(report.nativeVillageMat);

            await getBasicStats().parseDataFromMockObject(report.basicStats); 

            getPlayer().can_play_treasure_buy_phase =  report.can_play_treasure_buy_phase;
            getPlayer().can_not_be_attacked = report.can_not_be_attacked;
            await getLogger().parseDataFromMockObject(report.logger);
        } 
        else{
            await getLandscapeEffectManager().parseDataFromMockObjectGeneral(report.landscapeEffectManager);
            HexBoonManager.parseDataFromMockObjectGeneral(report.hexboonManager);
        }
        
        getPlayer().turn = report.turn;
        getPlayer().move = report.move;
        
        await getKingdomSupply().parseDataFromMockObject(report.kingdomSupply);
        await getBasicSupply().parseDataFromMockObject(report.basicSupply);
        await nonSupplyManager.parseDataFromMockObject(report.nonSupply);

        await getTrash().parseDataFromMockObject(report.trash);
    }
}
const gameState = new GameState();


function generateCardFromMockObject(mockCard){
    let new_card_class = getClassFromName(mockCard.name);
    let new_card = new new_card_class();
    new_card.parseDataFromMockObject(mockCard);
    return new_card;    
}

function getGameState(){
    return gameState;
}

export {GameState, getGameState, generateCardFromMockObject};