import { getPlayer } from "../player";
import { getLogger } from "../Components/Logger";
import { getGameState } from "./GameState";
import { opponentManager } from "../features/OpponentSide/Opponent";

const  ACTIVITY_PLAY = 'Play',
        ACTIVITY_BUY = 'Buy',
        ACTIVITY_GAIN = 'Gain',
        ACTIVITY_BUY_GAIN = 'Buy and Gain',
        ACTIVITY_EXILE = 'Exile',
        ACTIVITY_RECEIVE = 'Receive',       
        ACTIVITY_DISCARD = 'Discard',
        ACTIVITY_TRASH = 'Trash',
        ACTIVITY_REVEAL = 'Reveal',
        ACTIVITY_DRAW = 'Draw',
        ACTIVITY_SHUFFLE = 'Shuffle',
        ACTIVITY_AUTOPLAY_TREASURES = 'Autoplay Treasures',
        ACTIVITY_ATTACK = 'Attack',
        ACTIVITY_END_REACT = 'END_REACT',
        ACTIVITY_ACTIVATE = 'Activate',
        ACTIVITY_SET_ASIDE = 'Set aside';

    const PHASE_ACTION = 'action',
    PHASE_BUY = 'buy',
    PHASE_NIGHT = 'night',
    PHASE_REACTION = 'reaction',
    PHASE_WAITING = 'waiting',
    PHASE_START_TURN = 'start turn',
    PHASE_CLEAN_UP = 'clean up',
    PHASE_END_TURN = 'end turn';


class Activity{
    current = null;
    constructor(username, name, card=null, card_list=[]){
        this.username = username;
        this.name = name;
        this.card = card;
        this.card_list = card_list;
        this.child_activity_list = [];
        this.origin = Activity.current; // 'Play in action phase, Play in buy phase, Buy in buy phase, Gain in buy phase, Play in night phase, other Activity, ...'
        Activity.current = this;
    }
    getCard(){
        return this.card;
    }
    getCardList(){
        return this.card_list;
    }
}

function report_save_activity(activity_name, card=null, cardList=[], additionalMessage=''){
    let new_activity = new Activity(getPlayer().username, activity_name, card, cardList);
    getLogger().writeActivity(new_activity, additionalMessage);  
    getGameState().update_activity(activity_name, card, cardList);
}   
async function report_save_activity2(activity_name, card){
    if(opponentManager.getOpponentList().length <= 0) return;
    
    let report = getGameState().create_report(),
    message = '';
    let activity = undefined;
    if(activity_name == ACTIVITY_AUTOPLAY_TREASURES  && Array.isArray(card)){
        activity = {name: activity_name, card: card.map(c => c.name)};
    } else {
        activity = {name: activity_name, card: card.name};
    }
    if(getPlayer().phase == PHASE_REACTION){
        const category = 'REACTING';
        await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, false);
    } else{
        const category = 'PLAYING';
        let otherPlayerMayReact = false;
        for(let p of opponentManager.getOpponentList()){
            if(p.onAnotherGain){
                otherPlayerMayReact = true;
                break;
            }
        }
        // wait for other players to react, in case activity is either play Attack or gain card
        if(card!=undefined && card.type!= undefined && ((activity.name == ACTIVITY_PLAY && card.type.includes('Attack')) 
            || activity_name == ACTIVITY_ATTACK 
            || activity.name == ACTIVITY_GAIN || activity.name == ACTIVITY_BUY_GAIN)){
            if((activity.name == ACTIVITY_GAIN || activity.name == ACTIVITY_BUY_GAIN) && !otherPlayerMayReact){ 
                console.log('Other player cannot react to gain activity');
                await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, false);
            } else{
                let start = new Date().getTime();
                await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, true);
                let end = new Date().getTime();
                //console.log('Waiting time',end- start, activity.name);
            }
            
            
        } else{
            await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, false);
        }
    }        
}

export{ report_save_activity, report_save_activity2};