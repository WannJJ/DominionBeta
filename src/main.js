import { Player } from "./player";
import { getGameState } from "./game_logic/GameState";
import { createChatSocket, getSetupData, getSetupDataWithRetry, finish_setup, signin } from "./api/signin";
import { SetupEngine } from "./setup";
import { Opponent, opponentManager } from "./features/OpponentSide/Opponent";


import { react_other } from "./game_logic/Activity";

const USERNAME = 'QUAN' + Math.floor(Math.random() * 100);
const DELAY = 5000;

const MULTIPLAYER_MODE = false,      
      ACTIVITY_END_TURN = 'END_TURN',
      ACTIVITY_END_GAME = 'END_GAME',

      CATEGORY_PLAYING = 'PLAYING',
      CATEGORY_START_GAME = 'START_GAME',
      CATEGORY_END_TURN = 'END_TURN', 
      CATEGORY_REACTING = 'REACTING',
      CATEGORY_END_GAME = 'END_GAME',
      
      STATUS_IDLE = 'IDLE',
      STATUS_PLAYING = 'PLAYING',
      STATUS_REACTING = 'REACTING',
      STATUS_WAITING = 'WAITING',
      
      MESSAGE_START_GAME = 'START_GAME',
      MESSAGE_END_TURN = 'END_TURN',
      MESSAGE_END_GAME = 'END_GAME';

const MAX_RETRIES = 5;

let gameEngine = null;



class GameEngine {
    constructor(username=USERNAME) {
        this.setup_engine = new SetupEngine();
        this.player = new Player(
          username,
          0,
          this.report_ingame.bind(this),
          this.end_turn.bind(this),
          this.end_game.bind(this),
        );
        this.username = username;
    
        this.multiplayer_mode = MULTIPLAYER_MODE;
        this.opponent_list = [];
        this.ordinal_number = 0;
        this.name_order = [];
        this.prev_player = undefined;
        this.next_layer = undefined;
        this.status = STATUS_IDLE; // [IDLE, WAITING, PLAYING, REACTING]
        this.last_status = this.status;
    
        // for interacting with server
        this.chatSocket = null;
        this.last_report_id = -1;
        this.players_react_my_activity = 0;
        this.can_do_next_activity = false;
    
        this.remaining_resolve = null;

        gameEngine = this;
    }

    async run(){
      if(!this.multiplayer_mode){

        await this.start_game_singleplayer();

      } else{

        await signin(USERNAME);

        var data = await getSetupData();
        var username = data.username,
            game_code = data.game_code,
            game_status = data.game_status,
            game_mode = data.game_mode,
            name_order = data.name_order,
            basic = data.basic,
            kingdom = data.kingdom,
            landscape_effect = data.landscape_effect,
            nonSupply = data.nonSupply,
            player_status = data.player_status,
            report = data.report,
            report_id = parseInt(data.report_id);
        
        if(game_status == 'NOT EXISTS' || game_status == 'NEW'){
          await new Promise((resolve) => {
            setTimeout(async() => {
              try{
                  await this.setup_engine.prepare_game(); 
              }
              catch(e){
                  console.log('Prepare game failed!!', e);
              }
              finally{
                resolve();
              }
            }, 50);
          });

          console.log(`Wait ${DELAY/1000}s`)
          await new Promise((resolve) => {setTimeout(()=>resolve(), DELAY)});
          console.log('finish. Now getSetupData');

          var data = await getSetupData();
          var username = data.username,
            game_code = data.game_code,
            game_status = data.game_status,
            game_mode = data.game_mode,
            name_order = data.name_order,
            basic = data.basic,
            kingdom = data.kingdom,
            landscape_effect = data.landscape_effect,
            nonSupply = data.nonSupply,
            player_status = data.player_status,
            report = data.report,
            report_id = parseInt(data.report_id);
        }

                
        this.username = username;
        this.player = new Player(
          username,
          0,
          this.report_ingame.bind(this),
          this.end_turn.bind(this),
          this.end_game.bind(this),
        );
        console.log("Multiplayer mode", username);
        if (
          this.multiplayer_mode &&
          name_order != undefined &&
          name_order != ""
        ) {
          if (!this.set_player_turn(name_order)) alert("FAIL TO SET ORDER");
        }
        let d = { basic: basic, kingdom: kingdom, landscape_effect: landscape_effect, nonSupply: nonSupply };
        await this.setup_engine.finish_setup(d, this.player);

        if (game_status == "NEW") {
          await this.run_new_game();
          return;
        } else if (game_status == "PLAYING") {
          await this.run_playing_game(player_status, report, report_id);
          return;
        } else {
          // game_status == 'END'
          alert("Game is END");
        }
      }
    }

    async run_new_game(){
      console.log("NEW GAME");
      let report = getGameState().create_report();
      let request_data = {
          username: this.username,
          report: report,
      }

      let complete = false;
      let retries = 0;
      while(!complete && retries < MAX_RETRIES){
        await new Promise((resolve) =>{
          finish_setup(
            request_data, 
            async function(data){
              console.log("finish_setup from server", data);
              await this.start_game_multiplayer();
              await this.createGameWebSocket();
              complete = true;
              resolve();
            }.bind(this),
            async function(){
              console.log('finish_setup unsuccessful, try again in 1s');
              await new Promise((resolve1) =>{
                setTimeout(()=>{resolve1()}, 1000);
              });
              resolve();
            }
          )
        });

        retries += 1;

      }
    }

    async run_playing_game(player_status, report, report_id){
      console.log("Game is PLAYING, continue");
      this.player.last_report_id = report_id;
      await getGameState().parse_report(report);
      this.status = player_status;
      let data = {
          username: this.username,
          report: report,
      }
      return new Promise((resolve) => {
          finish_setup(
              data, 
              async function (data) {
                  console.log("data from finish_setup", data);
                  await this.createGameWebSocket();
                  if (player_status == STATUS_IDLE) {

                  } else if (player_status == STATUS_PLAYING) {
                    if (!["action", "buy", "night"].includes(this.player.phase)) {
                      alert(
                        "FORCE CHANGING PHASE! Current phase: " + this.player.phase
                      );
                      this.player.phase = "action";
                    }
                    
                    this.player.continue_phase();
                  } else if (player_status == STATUS_WAITING) {
                  }
                  
                  resolve();
                  return;
                }.bind(this),
          );
      });
    }


    set_player_turn(name_order) {
      if (name_order == undefined || name_order == "") return false;
      let name_list = name_order.split(",");
      if (name_list.length == 0 || !name_list.includes(this.username))
        return false;
      this.name_order = name_list;
  
      this.player.player_list = [];
      let set_turn_complete = false;
      for (let i = 0; i < name_list.length; i++) {
        let name = name_list[i];
        if (name == "") continue;
        if (name == this.username) {
          this.ordinal_number = i;
          this.player.ordinal_number = i;
          this.player.player_list.push(this.player);
          this.next_layer = name_list[(i+1) % name_list.length];
          this.prev_player = name_list[(i-1 + name_list.length) % name_list.length];
          set_turn_complete = true;
        }else{
          let new_opponent = new Opponent(name, i);

          opponentManager.addOpponent(new_opponent);

          //this.opponent_list.push(new_opponent);
          //this.player.player_list.push(new_opponent);
        }
      }
      return set_turn_complete;
    }
    async createGameWebSocket(){
      this.chatSocket = await createChatSocket();

      this.chatSocket.onmessage = async function (e) {
        const jsonSizeInBytes = new Blob([e.data]).size;
        //console.log(`Kích thước ${jsonSizeInBytes} bytes.`);

        const data = JSON.parse(e.data);

        console.log('receive message:', data.username, data.activity, data.message);

        const category = data.category,
          message = data.message,
          username = data.username,
          player_status = data.player_status,
          game_status = data.game_status, 
          report = data.report;
        //console.log("chatSocket on message", `category ${category}, message ${message}, player_status ${player_status}`);
        //console.log(`Message player name ${username}, prev_player name ${this.prev_player}, current status ${this.status}`)

        if ((category == CATEGORY_START_GAME || message == MESSAGE_START_GAME) 
              && this.status == STATUS_IDLE && this.ordinal_number == 0){

          console.log(`Received status: ${player_status}, should be: ${STATUS_PLAYING}`);
          this.status = STATUS_PLAYING;
          this.start_turn();

        } else if((category == CATEGORY_END_TURN || message == MESSAGE_END_TURN) 
                    && username == this.prev_player && this.status == STATUS_IDLE){

          console.log(`Received status: ${player_status}, should be: ${STATUS_PLAYING}`);
          let opponent = opponentManager.getOpponentList().find(o => o.username == username);
          if(opponent != undefined){
            await opponent.execute_report(report);
          }
          this.status = STATUS_PLAYING;
          this.start_turn();

        } else if (category == CATEGORY_PLAYING && username != this.username) {

          let opponent = opponentManager.getOpponentList().find(o => o.username == username);
          if(opponent != undefined){
            await opponent.execute_report(report);
          }
          let report_username = username;
          await getGameState().parse_report(report);
          await react_other(report_username, data.activity, message);
          
          this.status = STATUS_IDLE
        } else if (category == CATEGORY_REACTING && username != this.username) {

          let opponent = opponentManager.getOpponentList().find(o => o.username == username);
          if(opponent != undefined){
            await opponent.execute_report(report);
          }
          await this.receive_reaction(data);

        } else if(category == CATEGORY_END_GAME || message == MESSAGE_END_GAME){
          
          //TODO
          this.player.end_game();

        }

      }.bind(this);
    }

    async receive_reaction(data){
      if(data.activity == 'END_REACT'){
        if(this.status == STATUS_WAITING) {
          this.players_react_my_activity += 1;
         }
      } else {
        await getGameState().parse_report(data.report);

      }
      if(this.players_react_my_activity == this.name_order.length - 1) {
        this.can_do_next_activity = true;
        if(this.status == STATUS_WAITING && this.remaining_resolve != null){
          this.players_react_my_activity = 0;
          this.status = STATUS_PLAYING;
          this.remaining_resolve();
          this.remaining_resolve = null;
        }
      }
    }

    async start_game_singleplayer() {
      console.log("Single player mode");
      this.multiplayer_mode = false;
      this.player.player_list = [this.player];
      await this.setup_engine.finish_setup("", this.player);

      await this.player.start_game();
      await this.player.start_turn();
    }
    async start_game_multiplayer() {
      this.multiplayer_mode = true;
      await this.player.start_game();
    }

    async start_turn() {
      this.status = "PLAYING";
      await this.player.start_turn();
    }
    end_turn() {
      if (!this.multiplayer_mode) {
        this.start_turn();
        return;
      }
      const report = getGameState().create_report();
      this.status = STATUS_IDLE;
      this.report_ingame(ACTIVITY_END_TURN, report, MESSAGE_END_TURN, CATEGORY_END_TURN, false);
    }
    end_game(){
      if(!this.multiplayer_mode) return;

      const report = getGameState().create_report();
      this.status = STATUS_IDLE;
      this.report_ingame(ACTIVITY_END_GAME, report, MESSAGE_END_GAME, CATEGORY_END_GAME, false);

    }

    async react_other(username, activity) {
      this.status = STATUS_REACTING; console.log('change to reacting')
      await react_other(username, activity);
      this.status = STATUS_IDLE; console.log('change from reacting to idle')
    }
    execute_report(report){
    }

    /**
     *
     * @param {{String}} activity
     * @param {{String}} report JSON string of report object, the current game state of this.player
     * @param {{String}} message
     * @param {{String}} category [REACTING, PLAYING, END_TURN, START_GAME]
     * @param {{boolean}} async if true, return promise. This promise only resolved when all other players reacted this activity
     * @returns
     */
    async report_ingame(activity, report, message = "", category = "", async = true) {
      if (!this.multiplayer_mode) return;
      let category1 = category;
      if(this.status == STATUS_REACTING){
        category1 = CATEGORY_REACTING;
      } else if(this.status == STATUS_PLAYING){
        category1 = CATEGORY_PLAYING;
      } 
      this.chatSocket.send(
        JSON.stringify({
          username: this.username,
          activity: activity,
          message: message,
          report: report,
          category: category1,
          status: this.status,
          move: this.player.move,
        })
      );
      if (async) {  
        this.players_react_my_activity = 0;
        this.last_status = this.status;
        this.status = STATUS_WAITING;
        await new Promise((resolve)=> {
          this.remaining_resolve = resolve;
        });
        this.remaining_resolve = null;
        this.status = this.last_status;  
        //return new Promise((resolve) => {this.remaining_resolve = resolve;});
      }
      return;
    }
}



export {GameEngine};