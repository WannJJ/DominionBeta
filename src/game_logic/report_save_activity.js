import { getPlayer } from "../player";
import { getLogger } from "../Components/Logger";
import { getGameState } from "./GameState";
import { opponentManager } from "../features/OpponentSide/Opponent";
import { ACTIVITY_PLAY_AS_WAY, PHASE_REACTION } from "../utils/constants";
import {
  ACTIVITY_PLAY,
  ACTIVITY_GAIN,
  ACTIVITY_BUY_GAIN,
  ACTIVITY_ATTACK,
} from "../utils/constants";
import { generateCardFromMockObject } from "./GameState";

class Activity {
  static current = null;
  static id = 0;
  constructor(username, name, card = null, cardList = []) {
    this.id = Activity.id++;
    this.username = username;
    this.name = name;
    this.card = card;
    this.cardList = cardList;
    this.child_activity_list = [];

    this.origin = Activity.current; // 'Play in action phase, Play in buy phase, Buy in buy phase, Gain in buy phase, Play in night phase, other Activity, ...'
    Activity.current = this;
  }
  getCard() {
    return this.card;
  }
  getCardList() {
    return this.cardList;
  }
  setFinish() {
    Activity.current = this.origin;
  }
  createMockObject() {
    let card = null;
    if (this.card && this.card.createMockObject)
      card = this.card.createMockObject(true);
    return {
      username: this.username,
      name: this.name,
      card: card,
      cardList: this.cardList.map((card) => card.createMockObject(true)),
    };
  }
  static generateCardFromMockObject = function (mockObj) {
    if (!mockObj || !Array.isArray(mockObj.cardList))
      throw new Error("Invalid mock Activity");

    const card = mockObj.card
        ? generateCardFromMockObject(mockObj.card, true)
        : null,
      cardList = mockObj.cardList.map((cardObj) =>
        generateCardFromMockObject(cardObj, true)
      );
    let newActivity = new Activity(
      mockObj.username,
      mockObj.name,
      card,
      cardList
    );
    newActivity.setFinish();
    return newActivity;
  };
}

function report_save_activity(
  activity_name,
  card = null,
  cardList = [],
  additionalMessage = ""
) {
  let new_activity = new Activity(
    getPlayer().username,
    activity_name,
    card,
    cardList
  );
  getLogger().writeActivity(new_activity, additionalMessage);

  getGameState().update_activity(activity_name, card, cardList);
  return new_activity;
}

async function report_save_activity2(
  activity_name,
  card = null,
  cardList = [],
  additional_info
) {
  if (opponentManager.getOpponentList().length <= 0) return;

  let report = getGameState().create_report();
  let message = additional_info;
  let activity = undefined;
  //let currentPhase = getPlayer().phase;
  const category = "PLAYING";

  /*
    if(card){
        activity = {name: activity_name, card: card.name};
    } else if(Array.isArray(cardList)){
        activity = {name: activity_name, card: null, cardList: cardList.map(c => c.name)};
    }
    */
  activity = new Activity(getPlayer().username, activity_name, card, cardList);
  activity.setFinish();
  let start = new Date().getTime();

  /*
    //if(currentPhase === PHASE_REACTION){
    if(false){
        const category = 'REACTING';
        await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, false);
    } else{
        let otherPlayerMayReact = false;
        for(let p of opponentManager.getOpponentList()){
            if(p.onAnotherGain){
                otherPlayerMayReact = true;
                break;
            }
        }
        // wait for other players to react, in case activity is either play Attack or gain card
        if(card && card.type && ((activity.name === ACTIVITY_PLAY && card.type.includes(Card.Type.ATTACK)) 
            || activity_name === ACTIVITY_ATTACK 
            || activity.name === ACTIVITY_GAIN || activity.name === ACTIVITY_BUY_GAIN)){
            
            // Khong hieu qua
            if((activity.name === ACTIVITY_GAIN || activity.name === ACTIVITY_BUY_GAIN) && !otherPlayerMayReact){ 
                console.log('Other player cannot react to gain activity');
                await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, false);
            } 

            
            await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, true);
            
        } else{
            
            await getPlayer().report_ingame(JSON.stringify(activity), report, message, category, false);
            
        }

    }      
    */

  let result = await getPlayer().report_ingame(
    JSON.stringify(activity.createMockObject()),
    report,
    message,
    category,
    true
  );
  //getPlayer().setPhase(currentPhase);
  //let end = new Date().getTime(); console.log('Waiting time',end- start, activity.name);

  return result;
}

async function report_save_activity3(
  activity_name,
  card = null,
  cardList = [],
  additional_info
) {
  if (opponentManager.getOpponentList().length <= 0) return;

  let activity = new Activity(
    getPlayer().username,
    activity_name,
    card,
    cardList
  );
  activity.setFinish();
  let report = getGameState().create_report();
  let message = additional_info;
  const category = "END_ACTIVITY";

  await getPlayer().report_ingame(
    JSON.stringify(activity.createMockObject()),
    report,
    message,
    category,
    false
  );
}

export {
  Activity,
  report_save_activity,
  report_save_activity2,
  report_save_activity3,
};
