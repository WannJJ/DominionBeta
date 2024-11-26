import { Player } from "./player.js";
import { SetupEngine } from "./setup.js";
import {Opponent} from './opponent/opponent.js';







const ACTIVITY_END_TURN = 'END_TURN',

      CATEGORY_PLAYING = 'PLAYING',
      CATEGORY_START_GAME = 'START_GAME',
      CATEGORY_END_TURN = 'END_TURN',
      CATEGORY_REACTING = 'REACTING',
      
      STATUS_IDLE = 'IDLE',
      STATUS_PLAYING = 'PLAYING',
      STATUS_REACTING = 'REACTING',
      STATUS_WAITING = 'WAITING',
      
      MESSAGE_START_GAME = 'START_GAME',
      MESSAGE_END_TURN = 'END_TURN';

/*
  Thứ tự duyệt: Base, Seaside, Guilds, Menagerie, Plunder, Nocturne, Empires
*/
  


/**
 *
 */
class GameEngine {
  constructor(username) {
    this.setup_engine = new SetupEngine();
    this.player = new Player(
      username,
      0,
      this.report_ingame.bind(this),
      this.end_turn.bind(this)
    );
    this.username = username;

    this.multiplayer_mode = false;
    this.opponent_list = [];
    this.ordinal_number = 0;
    this.name_order = [];
    this.prev_player = undefined;
    this.next_layer = undefined;
    this.status = STATUS_IDLE; // [IDLE, WAITING, PLAYING, REACTING]
    this.last_status = this.status;

    // for interacting with server
    this.last_report_id = -1;
    this.players_react_my_activity = 0;
    this.can_do_next_activity = false;

    this.remaining_resolve = null;
  }
  run() {
    let game_code = data.game_code,
      game_status = data.game_status,
      game_mode = data.game_mode,
      name_order = data.name_order,
      basic = data.basic,
      kingdom = data.kingdom,
      landscape_effect = data.landscape_effect,
      nonSupply = data.nonsupply,
      player_status = data.player_status,
      report = data.report,
      report_id = parseInt(data.report_id);
    if (
      game_mode == "" ||
      game_mode == "SINGLEPLAYER" ||
      game_code == undefined ||
      game_code == "" ||
      game_status == "NOT EXISTS"
    ) {
      this.start_game_singleplayer();
    } else {
      console.log("Multiplayer mode");
      this.multiplayer_mode = true;
      if (
        this.multiplayer_mode &&
        name_order != undefined &&
        name_order != ""
      ) {
        if (!this.set_player_turn(name_order)) alert("FAIL TO SET ORDER");
      }
      let d = { basic: basic, kingdom: kingdom, landscape_effect: landscape_effect, nonSupply: nonSupply };
      this.setup_engine.finish_setup(d, this.player);
      if (game_status == "NEW") {
        return this.run_new_game();
      } else if (game_status == "PLAYING") {
        return this.run_playing_game(player_status, report, report_id);
      } else {
        // game_status == 'END'
        alert("Game is END");
      }
    }
  }
  run_new_game() {
    console.log("NEW GAME");
    this.start_game_multiplayer();
    let report = this.player.gameState.create_report();
    const csrftoken = document.querySelector(
      "[name=csrfmiddlewaretoken]"
    ).value;
    return new Promise((resolve) => {
      $.ajax({
        type: "POST",
        url: "/game/finish_setup",
        data: {
          csrfmiddlewaretoken: csrftoken,
          username: this.username,
          report: report,
        },
        success: function (data) {
          console.log("finish_setup from server", data);
          this.start_game_multiplayer();
          this.open_websocket();
          resolve();
          return;
        }.bind(this),
        fail: function () {
          resolve();
          this.start_game_singleplayer();
        },
      });
    });
  }
  run_playing_game(player_status, report, report_id) {
    console.log("Game is PLAYING");
    this.player.last_report_id = report_id;
    this.player.gameState.parse_report(report);
    this.status = player_status;
    const csrftoken = document.querySelector(
      "[name=csrfmiddlewaretoken]"
    ).value;
    return new Promise((resolve) => {
      $.ajax({
        type: "POST",
        url: "/game/finish_setup",
        data: {
          csrfmiddlewaretoken: csrftoken,
          username: this.username,
          report: report,
        },
        success: function (data) {
          console.log("data from finish_setup", data);
          if (player_status == STATUS_IDLE) {
            this.player.render();
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
          this.open_websocket();
          resolve();
          return;
        }.bind(this),
      });
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
        this.opponent_list.push(new_opponent);
        this.player.player_list.push(new_opponent);
      }
    }
    return set_turn_complete;
  }
  open_websocket() {
    // setup chat scoket
    this.chatSocket = new WebSocket(
      "ws://" + window.location.host + "/ws/game/playing/" + this.username + "/"
    );
    // on socket open
    this.chatSocket.onopen = function (e) {
      console.log("Chat socket successfully connected.");
    };
    // on socket close
    this.chatSocket.onclose = function (e) {
      console.log("Chat socket closed unexpectedly");
      //this.open_websocket();
    }.bind(this);
    // on receiving message on group
    this.chatSocket.onmessage = async function (e) {
      const data = JSON.parse(e.data);
      const category = data.category,
        message = data.message,
        username = data.username,
        player_status = data.player_status,
        game_status = data.game_status, 
        report = data.report;
      //console.log("chatSocket on message", `category ${category}, message ${message}, player_status ${player_status}`);
      //if ((category == CATEGORY_START_GAME || message == MESSAGE_START_GAME) && player_status == STATUS_PLAYING && this.status == STATUS_IDLE){
      if ((category == CATEGORY_START_GAME || message == MESSAGE_START_GAME) 
            && this.status == STATUS_IDLE && this.ordinal_number == 0){
        console.log(`Received status: ${player_status}, should be: ${STATUS_PLAYING}`);
        this.status = STATUS_PLAYING;
        this.start_turn();
      } else if((category == CATEGORY_END_TURN || message == MESSAGE_END_TURN) 
                  && username == this.prev_player && this.status == STATUS_IDLE){
        console.log(`Received status: ${player_status}, should be: ${STATUS_PLAYING}`);
        let opponent = this.opponent_list.find(o => o.username == username);
        if(opponent != undefined){
          opponent.execute_report(report);
        }
        this.status = STATUS_PLAYING;
        this.start_turn();
      } else if (category == CATEGORY_PLAYING && username != this.username) {
        let opponent = this.opponent_list.find(o => o.username == username);
        if(opponent != undefined){
          opponent.execute_report(report);
        }        
        this.status = STATUS_REACTING; 
        let report_username = username;
        this.player.gameState.parse_report(report);
        //this.player.render();
        this.player.trash.render();
        this.player.basicSupply.render();
        this.player.kingdomSupply.render();
        this.player.nonSupply.render();
        this.player.landscapeEffectManager.render();
        await this.react_other(report_username, data.activity, message);
        
        this.status = STATUS_IDLE
      } else if (category == CATEGORY_REACTING && username != this.username) {
        let opponent = this.opponent_list.find(o => o.username == username);
        if(opponent != undefined){
          opponent.execute_report(report);
        }
        this.receive_reaction(data);
      }
    }.bind(this);
  }
  receive_reaction(data){
    if(data.activity == 'END_REACT'){
      if(this.status == STATUS_WAITING) {
        this.players_react_my_activity += 1;
       }
    } else {
      this.player.gameState.parse_report(data.report);

      this.player.trash.render();
      this.player.basicSupply.render();
      this.player.kingdomSupply.render();
      this.player.nonSupply.render();
      this.player.landscapeEffectManager.render();
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
  start_game() {
    if (!this.multiplayer_mode) {
      console.log("Single player mode");
      this.multiplayer_mode = false;
      this.setup_engine.finish_setup("", this.player);
      this.player.start_game();
      this.player.start_turn();
    } else {
      //this.multiplayer_mode = true
      this.player.start_game();
    }
  }
  start_game_singleplayer() {
    console.log("Single player mode");
    this.multiplayer_mode = false;
    this.setup_engine.finish_setup("", this.player);
    this.player.start_game();
    this.player.start_turn();
  }
  start_game_multiplayer() {
    this.multiplayer_mode = true;
    this.player.start_game();
  }
  async start_turn() {
    console.log("START TURN");
    this.status = "PLAYING";
    await this.player.start_turn();
  }
  end_turn() {
    if (!this.multiplayer_mode) {
      this.start_turn();
      return;
    }
    const report = this.player.gameState.create_report();
    this.status = STATUS_IDLE;
    this.report_ingame(ACTIVITY_END_TURN, report, MESSAGE_END_TURN, CATEGORY_END_TURN, false);
  }
  async react_other(username, activity) {
    this.status = STATUS_REACTING;
    await this.player.react_other(username, activity);
    this.status = STATUS_IDLE;
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


let engine = new GameEngine(username);
await engine.run();

document.onclick = function(){
  console.log('STATUS:', engine.status, engine.player.phase);
}

