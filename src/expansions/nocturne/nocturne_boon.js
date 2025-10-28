import { RootCard, Cost, Card } from "../cards.js";
import {
  REASON_START_CLEANUP,
  REASON_END_TURN,
  REASON_END_YOUR_TURN,
} from "../../game_logic/ReactionEffectManager.js";
import { getHand } from "../../features/PlayerSide/CardHolder/CardHolder.jsx";
import {
  getDeck,
  getDiscard,
} from "../../features/PlayerSide/CardPile/CardPile.jsx";

import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";
import { getSupportHand } from "../../features/SupportHand.jsx";

import {
  markSupplyPile,
  removeMarkSupplyPile,
} from "../../features/TableSide/Supply.jsx";

import {
  draw1,
  drawNCards,
  mix_discard_to_deck,
  gain_card,
  gain_card_name,
  discard_card,
  trash_card,
  discardCardList,
} from "../../game_logic/Activity.js";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import { getType } from "../../game_logic/basicCardFunctions.js";

class Boon extends RootCard {
  constructor(name) {
    super();
    this.name = name;
    this.cost = new Cost();
    this.type = ["Boon"];
    this.src = "./img/Nocturne/Boon/" + name + ".JPG";
  }
  play() {}
  is_received() {}
}
class TheEarthsGift extends Boon {
  constructor() {
    super("TheEarthsGift");
  }
  is_received() {
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "TheEarthsGift: You may discard a Treasure to gain a card costing up to $4."
      );

      getButtonPanel().add_button(
        "Cancel",
        async function () {
          clearFunc();
          resolve("TheEarhsGift finish");
        }.bind(this)
      );
      let is_marked = getHand().mark_cards(
        function (card) {
          return (
            getType(card).includes(Card.Type.TREASURE) && this.chosen === 0
          );
        }.bind(this),
        async function (card) {
          clearFunc();
          this.chosen += 1;
          let c = await discard_card(card, true);
          if (c != undefined) {
            await this.play_step1();
          }
          resolve("TheEarhsGift finish");
        }.bind(this),
        "discard"
      );
      if (!is_marked) {
        clearFunc();
        resolve("TheEarhsGift finish");
      }
    });
  }
  play_step1() {
    return new Promise((resolve) => {
      let chosen = 0;
      let is_marked = markSupplyPile(
        function (pile) {
          let cost = new Cost(4);
          return (
            pile.getQuantity() > 0 &&
            cost.isGreaterOrEqual(pile.getCost()) &&
            chosen === 0
          );
        },
        async function (pile) {
          chosen += 1;
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve("TheEarhsGift step 1 finish");
        }.bind(this)
      );
      if (!is_marked) {
        resolve("TheEarhsGift step 1 finish");
      }
    });
  }
}
class TheFieldsGift extends Boon {
  constructor() {
    super("TheFieldsGift");
    this.activate_when_start_cleanup = false;
    this.activate_currently = false;
  }
  async is_received() {
    this.activate_currently = true;
    this.activate_when_start_cleanup = false;

    await getBasicStats().addAction(1);
    await getBasicStats().addCoin(1);
  }
  should_activate(reason, card) {
    return reason == REASON_START_CLEANUP;
  }
  async activate(reason, card) {}
}
class TheFlamesGift extends Boon {
  constructor() {
    super("TheFlamesGift");
  }
  is_received() {
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      let clearFunc = async function () {
        await getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("TheFlamesGift: You may trash a card from your hand.");

      getButtonPanel().add_button(
        "Decline",
        async function () {
          await clearFunc();
          resolve("TheFlamesGift finish");
        }.bind(this)
      );

      getHand().mark_cards(
        function () {
          return true;
        },
        async function (card) {
          await clearFunc();
          await trash_card(card);

          resolve("TheFlamesGift finish");
        }.bind(this),
        "trash"
      );
    });
  }
}
class TheForestsGift extends Boon {
  constructor() {
    super("TheForestsGift");
    this.activate_when_start_cleanup = false;
    this.activate_currently = false;
  }
  async is_received() {
    await getBasicStats().addBuy(1);
    await getBasicStats().addCoin(1);
  }
  should_activate(reason, card) {
    return reason == REASON_END_TURN;
  }
  async activate(reason, card) {}
}
class TheMoonsGift extends Boon {
  constructor() {
    super("TheMoonsGift");
  }
  is_received() {
    if (getDiscard().length() <= 0) return;
    return new Promise(async (resolve) => {
      let chosen = 0;
      let supportHand = getSupportHand();
      supportHand.clear();
      supportHand.getCardAll().forEach((card) => (card.moon = undefined));
      while (getDiscard().length() > 0) {
        await supportHand.addCard(await getDiscard().pop());
      }

      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        supportHand.remove_mark();
        supportHand.clear();
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "TheMoonsGift: You may put a card from your discard pile onto deck."
      );

      getButtonPanel().add_button(
        "OK",
        async function () {
          await getDiscard().setCardAll(supportHand.getCardAll());

          clearFunc();
          resolve("TheMoonfGift finish");
        }.bind(this)
      );

      supportHand.mark_cards(
        function (card) {
          return chosen == 0;
        },
        async function (card) {
          card.moon = true;
          chosen = 1;
          await supportHand.setCardAll(
            supportHand.getCardAll().filter((card) => !card.moon)
          );
          await getDiscard().addCardList(supportHand.getCardAll());
          await getDeck().addCard(card);

          clearFunc();
          resolve("TheMoonsGift finish");
        }.bind(this)
      );
    });
  }
}
class TheMountainsGift extends Boon {
  constructor() {
    super("TheMountainsGift");
  }
  async is_received() {
    await gain_card_name("Silver");
  }
}
class TheRiversGift extends Boon {
  constructor() {
    super("TheRiversGift");
    this.activate_when_end_turn = true;
    this.activate_when_end_your_turn = true;
    this.activate_currently = true;
  }
  async is_received() {}
  should_activate(reason, card) {
    return reason == REASON_END_TURN || reason === REASON_END_YOUR_TURN;
  }
  async activate(reason, card) {
    await draw1();
  }
}
class TheSeasGift extends Boon {
  constructor() {
    super("TheSeasGift");
  }
  async is_received() {
    await draw1();
  }
}
class TheSkysGift extends Boon {
  constructor() {
    super("TheSkysGift");
  }
  is_received() {
    if (getHand().length() < 3) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      this.card_list = [];
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("TheSkysGift: You may discard 3 cards to gain a Gold.");

      getButtonPanel().add_button(
        "Confirm Discard",
        async function () {
          clearFunc();
          if (this.chosen == 3) {
            await discardCardList(this.card_list);
            await gain_card_name("Gold");
          }
          resolve("TheEarhsGift finish");
        }.bind(this)
      );
      getHand().mark_cards(
        function (card) {
          return this.chosen < 3;
        }.bind(this),
        function (card) {
          this.chosen += 1;
          this.card_list.push(card);
        }.bind(this),
        "discard"
      );
    });
  }
}
class TheSunsGift extends Boon {
  constructor() {
    super("TheSunsGift");
  }
  async is_received() {
    let supportHand = getSupportHand();
    supportHand.clear();

    if (getDeck().length() < 4) {
      await mix_discard_to_deck();
    }
    const n = Math.min(getDeck().length(), 4);
    if (n <= 0) return;
    for (let i = 0; i < n; i++) {
      await supportHand.addCard(await getDeck().pop());
    }

    let cardList = supportHand.getCardAll();
    cardList.reverse();
    await supportHand.setCardAll(cardList);
    supportHand.getCardAll().forEach((card) => (card.sunsgift = undefined));
    await this.play_step1();

    // put the rest back in any order
    while (supportHand.length() >= 1) {
      await this.play_step2();
    }
    supportHand.clear();
  }
  play_step1() {
    return new Promise(async (resolve) => {
      let supportHand = getSupportHand();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        supportHand.remove_mark();
      };
      setInstruction("TheSunsGift: Discard any number of cards.");

      supportHand.mark_cards(
        function () {
          return true;
        },
        function (card) {
          card.sunsgift = true;
        }.bind(this),
        "discard"
      );
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Confirm Discarding",
        async function () {
          let i = 0;
          clearFunc();

          while (i < supportHand.length()) {
            let card = supportHand.getCardAll()[i];
            if (card.sunsgift) {
              await supportHand.remove(card);
              await discard_card(card, false);
              continue;
            }
            i++;
          }
          resolve("Sunsgift step 1 finish");
        }.bind(this)
      );
    });
  }
  async play_step2() {
    let supportHand = getSupportHand();
    if (supportHand.length() == 1) {
      let card = supportHand.getCardAll()[0];
      await supportHand.remove(card);
      await getDeck().addCard(card);
      return;
    }
    if (supportHand.length() <= 0) return;

    let clearFunc = function () {
      getButtonPanel().clear_buttons();
      setInstruction("");
      supportHand.remove_mark();
    };
    setInstruction("TheSunsGift: Put the cards back in any order.");

    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "OK",
        async function () {
          clearFunc();
          await getDeck().addCardList(supportHand.getCardAll());
          supportHand.clear();
          resolve("Sunsgift step 2 finish");
        }.bind(this)
      );
      supportHand.mark_cards(
        function () {
          return true;
        },
        async function (card) {
          clearFunc();
          await supportHand.remove(card);
          await getDeck().addCard(card);
          resolve("Sunsgift step 2 finish");
        }.bind(this)
      );
    });
  }
}
class TheSwampsGift extends Boon {
  constructor() {
    super("TheSwampsGift");
  }
  async is_received() {
    await gain_card_name("Will_o_Wisp");
  }
}
class TheWindsGift extends Boon {
  constructor() {
    super("TheWindsGift");
  }
  async is_received() {
    await drawNCards(2);
    if (getHand().getLength() <= 2) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      this.card_list = [];
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("TheWindsGift: Discard 2 cards");

      getButtonPanel().add_button(
        "Confirm Discard",
        async function () {
          if (this.chosen < 2) return;
          clearFunc();
          await discardCardList(this.card_list);
          resolve();
        }.bind(this)
      );

      getHand().mark_cards(
        function () {
          return this.chosen < 2;
        }.bind(this),
        function (card) {
          if (this.chosen < 2) {
            this.chosen += 1;
            this.card_list.push(card);
          }
        }.bind(this),
        "discard"
      );
    });
  }
}

export {
  TheEarthsGift,
  TheFieldsGift,
  TheFlamesGift,
  TheForestsGift,
  TheMoonsGift,
  TheMountainsGift,
  TheRiversGift,
  TheSeasGift,
  TheSkysGift,
  TheSunsGift,
  TheSwampsGift,
  TheWindsGift,
};
