import { Prophecy } from "../landscape_effect";
import { Card, Cost } from "../cards.js";
import {
  REASON_START_TURN,
  REASON_START_CLEANUP,
  REASON_AFTER_PLAY,
  REASON_END_TURN,
  REASON_WHEN_GAIN,
  REASON_FIRST_WHEN_PLAY,
  REASON_WHEN_DISCARD_FROM_PLAY,
  REASON_WHEN_PLAY,
} from "../../game_logic/ReactionEffectManager.js";

import {
  markSupplyPile,
  removeMarkSupplyPile,
} from "../../features/TableSide/Supply.jsx";
import { getPlayer } from "../../player.js";
import {
  getPlayField,
  getHand,
} from "../../features/PlayerSide/CardHolder/CardHolder.jsx";
import {
  getDiscard,
  getDeck,
  getTrash,
} from "../../features/PlayerSide/CardPile/CardPile.jsx";
import {
  getPlayArea,
  getExile,
  getSetAside,
} from "../../features/PlayerSide/BottomLeftCorner/SideArea.jsx";

import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";
import {
  draw1,
  drawNCards,
  mix_discard_to_deck,
  play_card,
  gain_card,
  gain_card_name,
  discard_card,
  trash_card,
  reveal_card,
  attack_other,
  set_aside_card,
  mayPlayCardFromHand,
  discardCardList,
} from "../../game_logic/Activity.js";
import { getGameState } from "../../game_logic/GameState.js";
import { findSupplyPile } from "../../features/TableSide/SupplyPile.jsx";
import { findNonSupplyPile } from "../../features/TableSide/NonSupplyPile.jsx";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import {
  PHASE_ACTION,
  PHASE_REACTION,
  PHASE_WAITING,
} from "../../utils/constants.js";
import { create_number_picker } from "../../Components/user_input/NumberPicker.jsx";
import { getSupportHand } from "../../features/SupportHand.jsx";
import { getCost, getType } from "../../game_logic/basicCardFunctions.js";

/*
class  extends Prophecy {
  constructor() {
    super("", "RisingSun/Prophecy/");
  }
    should_activate(reason, card) {}
  async activate(reason, card) {}
    
}
*/
class ApproachingArmy extends Prophecy {
  constructor() {
    super("ApproachingArmy", "RisingSun/Prophecy/");
    this.activate_after_play = true;
  }
  async setup() {
    await super.setup();
  }
  should_activate(reason, card) {
    return (
      reason === REASON_AFTER_PLAY &&
      card &&
      getType(card).includes(Card.Type.ATTACK)
    );
  }
  async activate(reason, card) {
    await getBasicStats().addCoin(1);
  }
}

class BidingTime extends Prophecy {
  constructor() {
    super("BidingTime", "RisingSun/Prophecy/");
    this.activate_when_start_cleanup = true;
    this.activate_when_start_turn = false;
    this.chosen_id_list = [];
  }
  should_activate(reason, card) {
    return (
      (reason === REASON_START_CLEANUP && getHand().getLength() > 0) ||
      (reason === REASON_START_TURN && this.chosen_id_list.length > 0)
    );
  }
  async activate(reason) {
    if (reason === REASON_START_CLEANUP) {
      while (getHand().getLength() > 0) {
        let card = await getHand().pop();
        await set_aside_card(card);
        this.chosen_id_list.push(card.id);
      }
      this.activate_when_start_turn = true;
    } else if (reason === REASON_START_TURN) {
      while (this.chosen_id_list.length > 0) {
        let id = this.chosen_id_list.pop();
        let card = await getSetAside().removeCardById(id);
        await getHand().addCard(card);
      }

      this.activate_when_start_turn = false;
    }
  }
}

class Bureaucracy extends Prophecy {
  constructor() {
    super("Bureaucracy", "RisingSun/Prophecy/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card) {
    let cost = new Cost(0);
    return reason === REASON_WHEN_GAIN && card && !cost.isEqual(getCost(card));
  }
  async activate(reason, card) {
    await gain_card_name("Copper");
  }
}

class DivineWind extends Prophecy {
  constructor() {
    super("DivineWind", "RisingSun/Prophecy/");
    this.description =
      "When you remove the last Sun, remove all Kingdom card piles from the Supply, and set up 10 new random piles.";
  }
  async playerRemoveLastSunToken() {
    await super.playerRemoveLastSunToken();
    await this.activate();
  }
  should_activate(reason, card) {
    //TODO
  }
  async activate(reason, card) {}
}
class Enlightenment extends Prophecy {
  constructor() {
    super("Enlightenment", "RisingSun/Prophecy/");
    this.activate_when_play = true;
    //TODO: this not affect pile type
  }
  analyseCardType(card, tempType) {
    if (!this.activate_permanently) return tempType;
    if (
      tempType.includes(Card.Type.TREASURE) &&
      !tempType.includes(Card.Type.ACTION)
    ) {
      tempType.push(Card.Type.ACTION);
      return tempType;
    }
    return tempType;
  }
  should_activate(reason, card) {
    return (
      reason === REASON_WHEN_PLAY &&
      card &&
      getPlayer().phase === PHASE_ACTION &&
      getType(card).includes(Card.Type.TREASURE)
    );
  }
  async activate(reason, card) {
    await draw1();
    await getBasicStats().addAction(1);
  }
}
class FlourishingTrade extends Prophecy {
  constructor() {
    super("FlourishingTrade", "RisingSun/Prophecy/");
    this.description = "Cards cost $1 less. You may use Action plays as Buys.";
    //TODO: Use Actions as Buys
  }
  analyseCardCost(card, tempCost) {
    if (!this.activate_permanently) return tempCost;
    let cost = new Cost(0, 0);
    cost.addCost(tempCost);
    cost.subtractCost(new Cost(1));
    return cost;
  }
  should_activate(reason, card) {}
  async activate(reason, card) {}
}

class GoodHarvest extends Prophecy {
  constructor() {
    super("GoodHarvest", "RisingSun/Prophecy/");
    this.activate_first_when_play = true;
  }
  should_activate(reason, card) {
    return (
      reason === REASON_FIRST_WHEN_PLAY &&
      card &&
      getType(card).includes(Card.Type.TREASURE) &&
      !getGameState().cards_played_this_turn.find(
        (card) => card.name === this.name
      )
    );
  }
  async activate(reason, card) {
    await getBasicStats().addBuy(1);
    await getBasicStats().addCoin(1);
  }
}
class GreatLeader extends Prophecy {
  constructor() {
    super("GreatLeader", "RisingSun/Prophecy/");
    this.activate_after_play = true;
  }
  should_activate(reason, card) {
    return (
      reason === REASON_AFTER_PLAY &&
      card &&
      getType(card).includes(Card.Type.ACTION)
    );
  }
  async activate(reason, card) {
    await getBasicStats().addAction(1);
  }
}
class Growth extends Prophecy {
  constructor() {
    super("Growth", "RisingSun/Prophecy/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card) {
    return (
      reason === REASON_WHEN_GAIN &&
      card &&
      getType(card).includes(Card.Type.TREASURE)
    );
  }
  activate(reason, card) {
    let cost = getCost(card);
    if (
      !findSupplyPile(
        (pile) => pile.getQuantity() > 0 && cost.isGreaterThan(pile.getCost())
      )
    )
      return;

    return new Promise((resolve) => {
      let chosen = 0;
      let clearFunc = function () {
        removeMarkSupplyPile();
        setInstruction("");
      };
      setInstruction("Growth: Gain a cheaper card.");
      markSupplyPile(
        (pile) =>
          chosen === 0 &&
          pile.getQuantity() > 0 &&
          cost.isGreaterThan(pile.getCost()),
        async function (pile) {
          clearFunc();
          await gain_card(pile);
          resolve();
        }
      );
    });
  }
}

class HarshWinter extends Prophecy {
  constructor() {
    super("HarshWinter", "RisingSun/Prophecy/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card) {
    let phase = getPlayer().phase;
    return (
      reason === REASON_WHEN_GAIN &&
      phase !== PHASE_REACTION &&
      phase !== PHASE_WAITING &&
      card &&
      (findSupplyPile((pile) => pile.isOriginOf(card)) ||
        findNonSupplyPile((pile) => pile.isOriginOf(card)))
    );
  }
  async activate(reason, card) {
    let pile = findSupplyPile((pile) => pile.isOriginOf(card));
    if (!pile) pile = findNonSupplyPile((pile) => pile.isOriginOf(card));
    if (!pile) return;

    if (pile.getDebtToken() > 0) {
      await getBasicStats().addDebt(pile.getDebtToken());
      await pile.setDebtToken(0);
    } else {
      await pile.setDebtToken(2);
    }
  }
}
class KindEmperor extends Prophecy {
  constructor() {
    super("KindEmperor", "RisingSun/Prophecy/");
    this.activate_when_start_turn = true;
  }
  async playerRemoveLastSunToken() {
    await super.playerRemoveLastSunToken();
    await this.activate();
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  activate(reason, card) {
    return new Promise((resolve) => {
      let chosen = 0;
      let clearFunc = function () {
        removeMarkSupplyPile();
        setInstruction("");
      };
      setInstruction("KindEmperor: Gain an Action to your hand.");

      markSupplyPile(
        (pile) =>
          chosen === 0 &&
          pile.getQuantity() > 0 &&
          pile.getType().includes(Card.Type.ACTION),
        async function (pile) {
          clearFunc();
          await gain_card(pile, getHand());
          resolve();
        }
      );
    });
  }
}

class Panic extends Prophecy {
  constructor() {
    super("Panic", "RisingSun/Prophecy/");
    this.activate_after_play = true;
    this.activate_when_discard_from_play = true;
  }
  should_activate(reason, card) {
    return (
      (reason === REASON_AFTER_PLAY &&
        card &&
        getType(card).includes(Card.Type.TREASURE)) ||
      (reason === REASON_WHEN_DISCARD_FROM_PLAY &&
        card &&
        getType(card).includes(Card.Type.TREASURE) &&
        getPlayField().getCardById(card.id))
    );
  }
  async activate(reason, card) {
    if (reason === REASON_AFTER_PLAY) {
      await getBasicStats().addBuy(2);
    } else if (reason === REASON_WHEN_DISCARD_FROM_PLAY) {
      let pile = findSupplyPile((pile) => pile.isOriginOf(card));
      if (!pile) pile = findNonSupplyPile((pile) => pile.isOriginOf(card));
      if (!pile) return;

      let card0 = await getPlayField().removeCardById(card.id);
      if (!card0) return;
      await pile.return_card(card);
    }
  }
}
class Progress extends Prophecy {
  constructor() {
    super("Progress", "RisingSun/Prophecy/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    return reason === REASON_WHEN_GAIN && card;
  }
  async activate(reason, card, activity, cardLocationTrack) {
    if (!card || !cardLocationTrack) return;
    let cardLocation = cardLocationTrack.getLocation();

    if (
      !cardLocation ||
      cardLocation.id === getDeck().id ||
      !cardLocation.getCardById(card.id)
    ) {
      return;
    }

    let removed = await cardLocation.removeCardById(card.id);
    if (removed) {
      await getDeck().topDeck(card);
      cardLocationTrack.setLocation();
    }
  }
}
class RapidExpansion extends Prophecy {
  constructor() {
    super("RapidExpansion", "RisingSun/Prophecy/");
    this.activate_when_gain = true;
    this.activate_when_start_turn = false;
    this.chosen_id_list = [];
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    return (
      (reason === REASON_WHEN_GAIN &&
        card &&
        (getType(card).includes(Card.Type.ACTION) ||
          getType(card).includes(Card.Type.TREASURE))) ||
      (reason === REASON_START_TURN && this.chosen_id_list.length > 0)
    );
  }
  async activate(reason, card, activity, cardLocationTrack) {
    if (reason === REASON_WHEN_GAIN) {
      if (!card || !cardLocationTrack) return;
      let cardLocation = cardLocationTrack.getLocation();

      if (
        !cardLocation ||
        cardLocation.id === getSetAside().id ||
        !cardLocation.getCardById(card.id)
      )
        return;

      let removed = await cardLocation.removeCardById(card.id);
      if (removed) {
        await set_aside_card(card);
        this.chosen_id_list.push(card.id);
        cardLocationTrack.setLocation();
        this.activate_when_start_turn = true;
      }
    } else if (reason === REASON_START_TURN) {
      while (this.chosen_id_list.length > 0) {
        let id = this.chosen_id_list.pop();
        let card0 = await getSetAside().removeCardById(id);
        if (card0) await play_card(card0); //TODO: Player may choose which order to play
      }
      this.activate_when_start_turn = false;
    }
  }
}
class Sickness extends Prophecy {
  constructor() {
    super("Sickness", "RisingSun/Prophecy/");
    this.activate_when_start_turn = true;
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason, card) {
    if (getHand().getLength() < 3) {
      await gain_card_name("Curse", getDeck());
      return;
    }
    if (
      !findSupplyPile(
        (pile) => pile.getQuantity() > 0 && pile.getName() === "Curse"
      )
    ) {
      await this.activate_step1();
      return;
    }
    await this.activate_step2();
  }
  activate_step1() {
    if (getHand().getLength() < 3) return;
    return new Promise((resolve) => {
      let cardList = [];
      let clearFunc = function () {
        getHand().remove_mark();
        setInstruction("");
      };
      setInstruction("Sickness: Discard 3 cards");

      getHand().mark_cards(
        (card) => cardList.length < 3,
        async function (card) {
          cardList.push(card);
          if (cardList.length < 3) return;
          clearFunc();
          await discardCardList(cardList);

          resolve();
        },
        "discard"
      );
    });
  }
  activate_step2() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Sickness: Chosse one: Gain a Curse, or discard 3 cards");

      getButtonPanel().add_button("Gain Curse", async function () {
        clearFunc();
        await gain_card_name("Curse", getDeck());
        resolve();
      });

      getButtonPanel().add_button(
        "Discard 3",
        async function () {
          clearFunc();
          await this.activate_step1();
          resolve();
        }.bind(this)
      );
    });
  }
}

export {
  ApproachingArmy,
  BidingTime,
  Bureaucracy,
  DivineWind,
  Enlightenment,
  FlourishingTrade,
  GoodHarvest,
  GreatLeader,
  Growth,
  HarshWinter,
  KindEmperor,
  Panic,
  Progress,
  RapidExpansion,
  Sickness,
};
