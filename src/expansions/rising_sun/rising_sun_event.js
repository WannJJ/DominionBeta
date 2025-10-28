import { Card, Cost } from "../cards.js";
import {
  REASON_START_TURN,
  REASON_START_CLEANUP,
  REASON_AFTER_PLAY,
  REASON_END_TURN,
  REASON_END_YOUR_TURN,
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
import {
  getNativeVillageMat,
  getIslandMat,
} from "../../features/PlayerSide/BottomLeftCorner/PlayerMats.jsx";
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
  trashCardList,
  discardCardList,
} from "../../game_logic/Activity.js";
import { getGameState } from "../../game_logic/GameState.js";
import { findSupplyPile } from "../../features/TableSide/SupplyPile.jsx";
import { findNonSupplyPile } from "../../features/TableSide/NonSupplyPile.jsx";
import { Event } from "../landscape_effect.js";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import { PHASE_ACTION } from "../../utils/constants.js";
import { create_number_picker } from "../../Components/user_input/NumberPicker.jsx";
import { getSupportHand } from "../../features/SupportHand.jsx";
import { getCost, getType } from "../../game_logic/basicCardFunctions.js";

/*
Mẫu
class  extends Event {
  constructor() {
    super("", new Cost(), "RisingSun/Event/");
  }
  is_buyed() {}
}

*/

class Continue extends Event {
  constructor() {
    super("Continue", new Cost(0, 8), "RisingSun/Event/");
    this.turn = -1;
  }
  async is_buyed() {
    if (this.turn === getPlayer().turn) return;
    this.turn = getPlayer().turn;
    await this.is_buyed_step1();
  }
  is_buyed_step1() {
    return new Promise((resolve) => {
      let chosen = 0;
      let clearFunc = function () {
        removeMarkSupplyPile();
        setInstruction("");
      };
      setInstruction(
        "Continue: Gain a non-Attack Action card costing up to $4."
      );

      markSupplyPile(
        function (pile) {
          let cost = new Cost(4);
          return (
            chosen === 0 &&
            pile.getQuantity() > 0 &&
            pile.getType().includes(Card.Type.ACTION) &&
            !pile.getType().includes(Card.Type.ATTACK) &&
            cost.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          clearFunc();
          chosen += 1;
          let card = await gain_card(pile);
          if (card) {
            getBasicStats().addAction(1);
            getBasicStats().addBuy(1);
            getPlayer().setPhase(PHASE_ACTION);

            let removed = await getDiscard().remove(card);
            if (removed) await play_card(card);
          }
          resolve(card);
        }
      );
    });
  }
}

class Amass extends Event {
  constructor() {
    super("Amass", new Cost(2), "RisingSun/Event/");
  }
  is_buyed() {
    if (
      getPlayField().has_card((card) =>
        getType(card).includes(Card.Type.ACTION)
      )
    )
      return;
    return new Promise((resolve) => {
      let chosen = 0;
      let clearFunc = function () {
        removeMarkSupplyPile();
        setInstruction("");
      };
      setInstruction("Amass: Gain an Action card costing up to $5");

      markSupplyPile(
        function (pile) {
          let cost = new Cost(5);
          return (
            pile.getQuantity() > 0 &&
            pile.getType().includes(Card.Type.ACTION) &&
            cost.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          clearFunc();
          await gain_card(pile);
          resolve();
        }
      );
    });
  }
}
class Asceticism extends Event {
  constructor() {
    super("Asceticism", new Cost(2), "RisingSun/Event/");
  }
  async is_buyed() {
    let max = Math.min(getHand().getLength(), getBasicStats().getCoin());
    if (max <= 0) return;
    let count = await new Promise((resolve) => {
      create_number_picker(0, max, function (value) {
        resolve(value);
      });
    });

    if (count <= 0) return;
    await this.is_buyed_step1(count);
  }
  is_buyed_step1(value) {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getHand().remove_mark();
        setInstruction("");
      };
      let cardList = [];
      setInstruction(`Asceticism: Trash ${value} cards from your hand.`);
      getHand().mark_cards(
        function (card) {
          return cardList.length < value;
        },
        async function (card) {
          cardList.push(card);
          if (cardList.length < value) return;
          clearFunc();
          await trashCardList(cardList);
          resolve();
        },
        "trash"
      );
    });
  }
}

class Credit extends Event {
  constructor() {
    super("Credit", new Cost(2), "RisingSun/Event/");
  }
  is_buyed() {
    let cost = new Cost(8);
    return new Promise((resolve) => {
      let chosen = 0;
      let clearFunc = function () {
        removeMarkSupplyPile();
        setInstruction("");
      };
      setInstruction("Credit: Gain an Action or Treasure costing up to $8");

      markSupplyPile(
        function (pile) {
          return (
            chosen === 0 &&
            pile.getQuantity() > 0 &&
            (pile.getType().includes(Card.Type.ACTION) ||
              pile.getType().includes(Card.Type.TREASURE)) &&
            cost.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          clearFunc();
          let card = await gain_card(pile);
          if (card) await getBasicStats().addDebt(getCost(card).getCoin());
          resolve();
        }
      );
    });
  }
}
class Foresight extends Event {
  constructor() {
    super("Foresight", new Cost(2), "RisingSun/Event/");
    this.activate_currently = false;
    this.activate_when_end_your_turn = false;
    this.chosen_id_list = [];
  }
  async is_buyed() {
    let card = null,
      cardList = [];
    while (getDeck().getLength() > 0 || getDiscard().getLength() > 0) {
      card = await getDeck().pop();
      await reveal_card(card);
      if (getType(card).includes(Card.Type.ACTION)) {
        await set_aside_card(card);
        this.activate_currently = true;
        this.activate_when_end_turn = true;
        this.chosen_id_list.push(card.id);
        break;
      }
      cardList.push(card);
      if (getDeck().getLength() <= 0) await mix_discard_to_deck();
    }
    if (card == null) return;

    if (cardList.length > 0) {
      await discardCardList(cardList, false);
    }
  }
  should_activate(reason) {
    return reason === REASON_END_YOUR_TURN && this.chosen_id_list.length > 0;
  }
  async activate(reason) {
    for (let id of this.chosen_id_list) {
      let card = await getSetAside().removeCardById(id);
      if (card) await getHand().addCard(card);
    }

    this.activate_currently = false;
    this.activate_when_end_turn = false;
    this.chosen_id_list = [];
  }
}
class Kintsugi extends Event {
  constructor() {
    super("Kintsugi", new Cost(3), "RisingSun/Event/");
  }
  async is_buyed() {
    if (getHand().getLength() <= 0) return;
    let cost = await this.is_buyed_step1();
    if (
      getGameState().cards_gained_this_game.filter(
        (card) => card.name === "Gold"
      ).length <= 0
    )
      return;
    await this.is_buyed_step2(cost);
  }
  is_buyed_step1() {
    return new Promise((resolve) => {
      let chosen = 0;
      let clearFunc = function () {
        getHand().remove_mark();
        setInstruction("");
      };
      setInstruction("Kintsugi: Trash a card from your hand.");

      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          chosen += 1;
          clearFunc();
          await trash_card(card);
          resolve(getCost(card));
        },
        "trash"
      );
    });
  }
  is_buyed_step2(cost) {
    return new Promise((resolve) => {
      let cost2 = new Cost(2);
      cost2.addCost(cost);

      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 && cost2.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve();
        }
      );
    });
  }
}
class Practice extends Event {
  constructor() {
    super("Practice", new Cost(3), "RisingSun/Event/");
  }
  is_buyed() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
        getSupportHand().clear();
        getSupportHand().hide();
        getDeck().removeCanSelect();
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "Practice: You may play an Action card from your hand twice."
      );
      let chosen = 0;

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve();
      });

      let contain_action = mayPlayCardFromHand(
        function (card) {
          return getType(card).includes(Card.Type.ACTION) && chosen === 0;
        },
        async function (card) {
          chosen += 1;
          clearFunc();
          await play_card(card);
          await play_card(card, false);

          resolve();
        },
        "choose"
      );

      if (!contain_action) {
        clearFunc();
        resolve();
      }
    });
  }
}
class SeaTrade extends Event {
  constructor() {
    super("SeaTrade", new Cost(4), "RisingSun/Event/");
  }
  async is_buyed() {
    let count =
      getPlayField()
        .getCardAll()
        .filter((card) => getType(card).includes(Card.Type.ACTION)).length +
      getPlayArea()
        .getCardAll()
        .filter((card) => getType(card).includes(Card.Type.ACTION)).length;
    if (count <= 0) return;

    await drawNCards(count);
    await this.is_buyed_step1(count);
  }
  is_buyed_step1(count) {
    return new Promise((resolve) => {
      let cardList = [];
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction(`SeaTrade: Trash up to ${count} cards from your hand.`);

      getButtonPanel().add_button("Ok", async function () {
        clearFunc();
        for (let card0 of cardList) {
          await trash_card(card0);
        }
        resolve();
      });

      getHand().mark_cards(
        function (card) {
          return cardList.length < count;
        },
        async function (card) {
          cardList.push(card);
          if (cardList.length < count) return;
          clearFunc();
          if (cardList.length > 0) {
            await trashCardList(cardList);
          }
          resolve();
        },
        "trash"
      );
    });
  }
}
class ReceiveTribute extends Event {
  constructor() {
    super("ReceiveTribute", new Cost(5), "RisingSun/Event/");
  }
  is_buyed() {
    if (getGameState().cards_gained_this_turn.length < 3) return;
    return new Promise((resolve) => {
      let pileList = [],
        nameList = [];
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        removeMarkSupplyPile();
      };
      getButtonPanel().clear_buttons();
      setInstruction("");

      getButtonPanel().add_button("OK", async function () {
        clearFunc();
        for (let pile of pileList) {
          await gain_card(pile);
        }
        resolve();
      });

      markSupplyPile(
        function (pile) {
          if (
            !(
              pileList.length < 3 &&
              pile.getQuantity() > 0 &&
              pile.getType().includes(Card.Type.ACTION)
            )
          )
            return false;
          let cardName = pile.getNextCard().name;
          return (
            !nameList.includes(cardName) &&
            !getPlayField().has_card((c) => c.name === cardName) &&
            !getPlayArea().has_card((c) => c.name === cardName)
          );
        },
        async function (pile) {
          pileList.push(pile);
          let cardName = pile.getNextCard().name;
          nameList.push(cardName);
          if (pileList.length < 3) return;
          clearFunc();
          for (let pile0 of pileList) {
            await gain_card(pile0);
          }
          resolve();
        }
      );
    });
  }
}
class Gather extends Event {
  constructor() {
    super("Gather", new Cost(7), "RisingSun/Event/");
  }
  async is_buyed() {
    await this.is_buyed_step1(new Cost(3));
    await this.is_buyed_step1(new Cost(4));
    await this.is_buyed_step1(new Cost(5));
  }
  is_buyed_step1(cost) {
    if (
      !findSupplyPile(
        (pile) => pile.getQuantity() > 0 && pile.getCost().isEqual(cost)
      )
    )
      return;
    return new Promise((resolve) => {
      markSupplyPile(
        (pile) => pile.getQuantity() > 0 && pile.getCost().isEqual(cost),
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve();
        }
      );
    });
  }
}

export {
  Continue,
  Amass,
  Asceticism,
  Credit,
  Foresight,
  Kintsugi,
  Practice,
  SeaTrade,
  ReceiveTribute,
  Gather,
};
