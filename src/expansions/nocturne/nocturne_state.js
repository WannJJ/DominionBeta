import { RootCard } from "../cards.js";
import {
  REASON_START_TURN,
  REASON_START_BUY,
} from "../../game_logic/ReactionEffectManager.js";

import { getHand } from "../../features/PlayerSide/CardHolder/CardHolder.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";

import { discard_card, receive_boon } from "../../game_logic/Activity.js";
import { getPlayer } from "../../player.js";
import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import { stateHolder } from "./HexBoonManager.js";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";

class State extends RootCard {
  constructor(name) {
    super();
    this.name = name;
    this.cost = undefined;
    this.type = ["State"];
    this.src = "./img/Nocturne/Hex/State/" + name + ".JPG";
  }
  play() {}
  is_received() {}
  add_score() {}
}
// track Hex Delusion's effect, double-sided with Envious, one copy for each player
class Deluded extends State {
  constructor() {
    super("Deluded");
    this.activate_when_start_buy_phase = true;
    this.activate_currently = true;
    this.description =
      "At the start of your Buy phase, return this, and you can't buy Actions this turn.";
  }
  is_received() {
    this.activate_currently = true;
  }
  should_activate(reason, card) {
    return reason === REASON_START_BUY;
  }
  activate() {
    getPlayer().can_not_buy_action_this_turn = true;
    stateHolder.removeState(this);
  }
}
// track Hex Envy's effect, double-sided with Deluded, one copy for each player
class Envious extends State {
  constructor() {
    super("Envious");
    this.activate_when_start_buy_phase = true;
    this.activate_currently = true;
    this.description =
      "At the start of your Buy phase, return this, and Silver and Gold make $1 this turn.";
  }
  is_received() {
    this.activate_currently = true;
  }
  should_activate(reason, card) {
    return reason === REASON_START_BUY;
  }
  activate() {
    getPlayer().attacked_by_envious = true;
    stateHolder.removeState(this);
  }
}
// Used by Fool, only one copy
class Lost_in_the_Woods extends State {
  constructor() {
    super("Lost_in_the_Woods");
    this.activate_when_start_turn = true;
    this.activate_currently = true;
    this.description =
      "At the start of your turn, you may discard a card to receive a Boon.";
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  activate(reason) {
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        await getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction("You may discard a card to receive a Boon");

      getButtonPanel().add_button("Decline", async function () {
        await clearFunc();
        resolve();
      });
      getHand().mark_cards(
        (c) => true,
        async function (card) {
          await clearFunc();
          await discard_card(card);
          await receive_boon();
          resolve();
        },
        "discard"
      );
    });
  }
}
// Used by Hex Misery, doubled-sided
class Miserable extends State {
  constructor() {
    super("Miserable");
  }
  async is_received() {
    await getBasicStats().addScore(-2);
  }
  async add_score() {
    await getBasicStats().addScore(-2);
  }
}
// Used by Hex Misery, doubled-sided
class TwiceMiserable extends State {
  constructor() {
    super("TwiceMiserable");
  }
  async is_received() {
    await getBasicStats().addScore(-4);
  }
  async add_score() {
    await getBasicStats().addScore(-4);
  }
}

class StateList {
  constructor() {
    this.cards = [];
  }
  setup() {}
  add_card(card) {
    if (Array.isArray(card)) {
      this.cards.push(...card);
    } else {
      this.cards.push(card);
    }
    this.render();
  }
  remove(card) {
    let index = this.cards.indexOf(card);
    if (index !== -1) {
      this.cards.splice(index, 1);
    } else {
      return false;
    }
    card.html_card = undefined;
    this.render();
    return true;
  }
  length() {
    return this.cards.length;
  }
  pop() {
    let card = this.cards.pop();
    this.render();
    return card;
  }
  has_card(crit_func) {
    if (this.cards.length <= 0) {
      return false;
    }
    for (let i = 0; i < this.cards.length; i++) {
      let card = this.cards[i];
      if (crit_func(card)) {
        return true;
      }
    }
    return false;
  }
  render() {}
}

export {
  Deluded,
  Envious,
  Lost_in_the_Woods,
  Miserable,
  TwiceMiserable,
  StateList,
};
