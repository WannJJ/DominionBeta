import { getPlayer, Player } from "./player";
import { getGameState } from "./game_logic/GameState";
import { createChatSocket, getSetupData, finish_setup } from "./api/GameAPI";
import { SetupEngine } from "./setup";
import { Opponent, opponentManager } from "./features/OpponentSide/Opponent";
import PregameEngine from "./pregame/PregameEngine";

import { react_other } from "./game_logic/Activity";
import { GAME_STATUS } from "./utils/constants";
import { PlayerProfile } from "./game_logic/PlayerProfile";

import { test } from "./pregame/test";

//test();

const USERNAME = PlayerProfile.getUsername();

export const MULTIPLAYER_MODE = false;

const ACTIVITY_END_TURN = "END_TURN",
  ACTIVITY_END_GAME = "END_GAME",
  ACTIVITY_END_REACT = "END_REACT",
  CATEGORY_SERVER_MESSAGE = "SERVER_MESSAGE",
  CATEGORY_PLAYING = "PLAYING",
  CATEGORY_START_GAME = "START_GAME",
  CATEGORY_END_TURN = "END_TURN",
  CATEGORY_REACTING = "REACTING",
  CATEGORY_END_GAME = "END_GAME",
  CATEGORY_END_ACTIVITY = "END_ACTIVITY",
  STATUS_IDLE = "IDLE",
  STATUS_PLAYING = "PLAYING",
  STATUS_REACTING = "REACTING",
  STATUS_WAITING = "WAITING",
  MESSAGE_START_GAME = "START_GAME",
  MESSAGE_END_TURN = "END_TURN",
  MESSAGE_END_GAME = "END_GAME";

const MAX_RETRIES = 5;

class GameEngine {
  constructor(username = USERNAME) {
    this.setup_engine = new SetupEngine();
    this.player = new Player(
      username,
      0,
      this.report_ingame.bind(this),
      this.end_turn.bind(this),
      this.end_game.bind(this)
    );
    this.username = username;

    this.multiplayer_mode = MULTIPLAYER_MODE;
    this.opponent_list = [];
    this.ordinal_number = 0;
    this.name_order = [];
    this.prev_player = undefined;
    this.next_player = undefined;
    this.status = STATUS_IDLE; // [IDLE, WAITING, PLAYING, REACTING]

    // for interacting with server
    this.chatSocket = null;
    this.last_report_id = -1;
    this.players_react_my_activity = 0;
  }

  async run() {
    if (!this.multiplayer_mode) {
      await this.start_game_singleplayer();
    } else {
      var data = await getSetupData();
      var username = data.username,
        //game_code = data.game_code,
        game_status = data.game_status,
        //game_mode = data.game_mode,
        name_order = data.name_order,
        basic = data.basic,
        kingdom = data.kingdom,
        landscape_effect = data.landscape_effect,
        nonSupply = data.nonSupply,
        player_status = data.player_status,
        report = data.report,
        report_id = parseInt(data.report_id);

      if (
        game_status === GAME_STATUS.NOT_EXISTS ||
        game_status === GAME_STATUS.NEW
      ) {
      }

      this.username = username;
      this.player = new Player(
        username,
        0,
        this.report_ingame.bind(this),
        this.end_turn.bind(this),
        this.end_game.bind(this)
      );
      console.log("Multiplayer mode", username);
      if (this.multiplayer_mode && name_order && name_order !== "") {
        if (!this.set_player_turn(name_order))
          throw new Error("FAIL TO SET ORDER");
      }
      let d = {
        basic: basic,
        kingdom: kingdom,
        landscape_effect: landscape_effect,
        nonSupply: nonSupply,
      };
      await this.setup_engine.finish_setup(
        d,
        this.player,
        game_status === GAME_STATUS.NEW
      );

      if (game_status === GAME_STATUS.NEW) {
        await this.run_new_game();
        return;
      } else if (game_status === GAME_STATUS.PLAYING) {
        await this.run_playing_game(player_status, report, report_id);
        return;
      } else {
        // game_status ===  GAME_STATUS.END
        alert("Game is END");
      }
    }
  }

  async run_new_game() {
    console.log("NEW GAME");

    await this.start_game_multiplayer();

    let report = getGameState().create_report();
    let request_data = {
      username: this.username,
      report: report,
    };

    let complete = false;
    let retries = 0;
    while (!complete && retries < MAX_RETRIES) {
      await new Promise((resolve) => {
        finish_setup(
          request_data,
          async function (data) {
            //console.log("finish_setup from server", data);
            //await this.start_game_multiplayer();
            await this.createGameWebSocket();
            complete = true;
            resolve();
          }.bind(this),
          async function () {
            console.log("finish_setup unsuccessful, try again in 1s");
            await new Promise((resolve1) => {
              setTimeout(() => {
                resolve1();
              }, 1000);
            });
            resolve();
          }
        );
      });

      retries += 1;
    }
  }

  async run_playing_game(player_status, report, report_id) {
    console.log("Game is PLAYING, continue");
    this.player.last_report_id = report_id;

    await getGameState().parse_report(report);

    this.status = player_status;
    let data = {
      username: this.username,
      report: report,
    };
    return new Promise((resolve) => {
      finish_setup(
        data,
        async function (data) {
          console.log("data from finish_setup", data);
          await this.createGameWebSocket();
          if (player_status === STATUS_IDLE) {
          } else if (player_status === STATUS_PLAYING) {
            if (!["action", "buy", "night"].includes(this.player.phase)) {
              alert(
                `FORCE CHANGING PHASE! From current phase ${this.player.phase} to action phase`
              );
              this.player.phase = "action";
            }

            this.player.continue_phase();
          } else if (player_status === STATUS_WAITING) {
          }

          resolve();
          return;
        }.bind(this)
      );
    });
  }

  set_player_turn(name_order) {
    if (!name_order || name_order === "") return false;
    let name_list = name_order.split(",");
    if (name_list.length === 0 || !name_list.includes(this.username))
      return false;
    this.name_order = name_list;

    //this.player.player_list = [];
    let set_turn_complete = false;

    for (let i = 0; i < name_list.length; i++) {
      let name = name_list[i];
      if (name === "") continue;

      if (name === this.username) {
        this.ordinal_number = i;
        PlayerProfile.setOrdinalNumber(i);
        this.player.ordinal_number = i;

        //this.player.player_list.push(this.player);
        this.next_player = name_list[(i + 1) % name_list.length];
        this.prev_player =
          name_list[(i - 1 + name_list.length) % name_list.length];
        set_turn_complete = true;
      }
    }

    for (let i = 0; i < name_list.length; i++) {
      let name = name_list[i];
      if (name === "") continue;

      if (name !== this.username) {
        let new_opponent = new Opponent(name, i);
        opponentManager.addOpponent(new_opponent);

        if (name === this.next_player) {
          opponentManager.setLeftPlayer(new_opponent);
        }
        if (name === this.prev_player) {
          opponentManager.setRightPlayer(new_opponent);
        }
      }
    }

    return set_turn_complete;
  }
  async createGameWebSocket() {
    this.chatSocket = await createChatSocket();

    this.chatSocket.onmessage = async function (e) {
      //const jsonSizeInBytes = new Blob([e.data]).size;
      //console.log(`Kích thước ${jsonSizeInBytes} bytes.`);

      const data = JSON.parse(e.data);

      //console.log('receive message:', data.username, data.activity, data.message);

      const category = data.category,
        message = data.message,
        username = data.username,
        player_status = data.player_status,
        game_status = data.game_status,
        report = data.report,
        time = data.time,
        timeToReact = data.timeToReact;
      //console.log("chatSocket on message", `category ${category}, message ${message}, player_status ${player_status}`);
      //console.log(`Message player name ${username}, prev_player name ${this.prev_player}, current status ${this.status}`)

      if (
        ![
          CATEGORY_START_GAME,
          CATEGORY_REACTING,
          CATEGORY_PLAYING,
          CATEGORY_END_TURN,
          CATEGORY_END_GAME,
          CATEGORY_END_ACTIVITY,
          CATEGORY_SERVER_MESSAGE,
        ].includes(category)
      ) {
        console.error("Category", category);
        throw new Error("Invalid category");
      }

      if (
        (category === CATEGORY_START_GAME || message === MESSAGE_START_GAME) &&
        this.status === STATUS_IDLE &&
        this.ordinal_number === 0
      ) {
        console.log(
          `Received status: ${player_status}, should be: ${STATUS_PLAYING}`
        );
        this.status = STATUS_PLAYING;
        this.start_turn();
      } else if (
        category === CATEGORY_END_TURN ||
        message === MESSAGE_END_TURN
      ) {
        if (username !== this.prev_player) {
          return;
        }
        if (this.status !== STATUS_IDLE) {
          console.error("Status", this.status);
          throw new Error("");
          return;
        }

        console.log(
          `Received status: ${player_status}, should be: ${STATUS_PLAYING}`
        );

        //getPlayer().setTurn(JSON.parse(report).turn);

        let opponent = opponentManager
          .getOpponentList()
          .find((o) => o.username === username);
        if (opponent) {
          await opponent.execute_report(report);
        }
        this.status = STATUS_PLAYING;
        this.start_turn();
      } else if (
        username !== this.username &&
        category === CATEGORY_END_ACTIVITY
      ) {
        await getGameState().parse_report(report);
      } else if (
        username !== this.username &&
        data.activity === ACTIVITY_END_REACT
      ) {
        //TODO

        //TODO: Cai nay bo dc
        let opponent = opponentManager
          .getOpponentList()
          .find((o) => o.username === username);
        if (opponent) {
          await opponent.execute_report(report);
        }
        await this.receive_reaction(data);

        //} else if (category === CATEGORY_PLAYING && username !== this.username) {
      } else if (username !== this.username) {
        //TODO

        let opponent = opponentManager
          .getOpponentList()
          .find((o) => o.username === username);
        if (opponent) {
          await opponent.execute_report(report);
        }
        await getGameState().parse_report(report);

        await this.react_other(username, data.activity, message, time);
      } else if (
        category === CATEGORY_END_GAME ||
        message === MESSAGE_END_GAME
      ) {
        //TODO
        this.player.end_game();
      }
    }.bind(this);
  }

  async receive_reaction(data) {
    socketStack.checkReceivedMessage(data);

    if (data.activity !== "END_REACT") {
      throw new Error("");
    }
  }

  async start_game_singleplayer() {
    console.log("Single player mode");
    this.multiplayer_mode = false;
    //this.player.player_list = [this.player];

    let materials = PregameEngine.generate_materials();
    let data = {
      kingdom: JSON.stringify(materials[0]),
      basic: JSON.stringify(materials[1]),
      landscape_effect: JSON.stringify(materials[2]),
      nonSupply: JSON.stringify(materials[3]),
    };
    await this.setup_engine.finish_setup(data, this.player);
    //await this.setup_engine.finish_setup("", this.player);

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
    this.report_ingame(
      ACTIVITY_END_TURN,
      report,
      MESSAGE_END_TURN,
      CATEGORY_END_TURN,
      false
    );
  }
  end_game() {
    if (!this.multiplayer_mode) return;

    const report = getGameState().create_report();
    this.status = STATUS_IDLE;
    this.report_ingame(
      ACTIVITY_END_GAME,
      report,
      MESSAGE_END_GAME,
      CATEGORY_END_GAME,
      false
    );
  }

  async react_other(username, activity, message, timeToReact) {
    if (!this.chatSocket) return;

    //TODO
    //const currentStatus = this.status;
    if (this.status === STATUS_IDLE) {
      //this.status = STATUS_REACTING;
    }

    let [reactReport, reactMessage] = await react_other(
      username,
      activity,
      message
    );
    let category = CATEGORY_REACTING;
    this.chatSocket.send(
      JSON.stringify({
        username: this.username,
        activity: ACTIVITY_END_REACT,
        message: reactMessage,
        report: reactReport,
        category: category,
        status: this.status,
        move: this.player.move,
        time: 0,
        timeToReact: timeToReact,
      })
    );

    //this.status = STATUS_IDLE;
    //this.status = currentStatus;
  }
  execute_report(report) {}

  /**
   *
   * @param {{String}} activity
   * @param {{String}} report JSON string of report object, the current game state of this.player
   * @param {{String}} message
   * @param {{String}} category [REACTING, PLAYING, END_TURN, START_GAME]
   * @param {{boolean}} async if true, return promise. This promise only resolved when all other players reacted this activity
   * @returns
   */
  report_ingame(activity, report, message = "", category = "", async = true) {
    if (!this.multiplayer_mode || !this.chatSocket) return;
    let category1 = category;

    if (this.status === STATUS_REACTING) {
      //category1 = CATEGORY_REACTING;
    } else if (this.status === STATUS_PLAYING) {
      category1 = CATEGORY_PLAYING;
    }

    if (activity === ACTIVITY_END_REACT)
      console.warn("category reacting", activity);

    let time = new Date().getTime();
    this.chatSocket.send(
      JSON.stringify({
        username: this.username,
        activity: activity,
        message: message,
        report: report,
        category: category,
        status: this.status,
        move: this.player.move,
        time: time,
        timeToReact: 0,
      })
    );

    if (async) {
      //this.time_to_resolve = time;
      this.players_react_my_activity = 0;
      this.last_status = this.status;
      //this.status = STATUS_WAITING;
      return new Promise((resolve) => {
        socketStack.addPendingActivity(activity, time, resolve);
      });
      //this.status = this.last_status;
    } else {
      //if(![CATEGORY_END_ACTIVITY, CATEGORY_END_TURN, CATEGORY_END_GAME].includes(category)) socketStack.addPendingActivity(activity, time);
    }
    return;
  }
}

const socketStack = {
  activityList: [],
  getActivityList: function () {
    return this.activityList;
  },
  addPendingActivity: function (activityName, time, pending_resolve = null) {
    this.activityList.push({
      activity: activityName,
      time: time,
      resolve: pending_resolve,
      players_react_my_activity: 0,
    });
    if (this.activityList.length >= 5) {
      console.error(
        this.activityList[0],
        this.activityList[1],
        this.activityList[2]
      );
    }
  },
  findPendingActivity: function (time) {
    return this.activityList.find((value, index) => value.time === time);
  },
  popPendingActivity: function (time) {
    let index = this.activityList.findIndex((value) => value.time === time);
    if (index === -1) return undefined;
    return this.activityList.splice(index, 1);
  },
  checkReceivedMessage(data) {
    let activityObject = this.findPendingActivity(data.timeToReact);

    if (!activityObject) return;
    activityObject.players_react_my_activity += 1;
    if (
      activityObject.players_react_my_activity ===
      opponentManager.getOpponentList().length
    ) {
      this.popPendingActivity(data.timeToReact);
      if (activityObject.resolve) {
        activityObject.resolve(data);
      }
    }
  },
};

export { GameEngine };
