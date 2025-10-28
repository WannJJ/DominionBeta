import { RootCard, Cost, Card } from "../cards.js";
import {
  Deluded,
  Envious,
  Lost_in_the_Woods,
  Miserable,
  TwiceMiserable,
} from "./nocturne_state.js";
import { stateHolder } from "./HexBoonManager.js";

import { getHand } from "../../features/PlayerSide/CardHolder/CardHolder.jsx";
import {
  getDiscard,
  getDeck,
} from "../../features/PlayerSide/CardPile/CardPile.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";

import {
  markSupplyPile,
  removeMarkSupplyPile,
} from "../../features/TableSide/Supply.jsx";
import {
  mix_discard_to_deck,
  gain_card,
  gain_card_name,
  discard_card,
  trash_card,
  reveal_card,
  receive_state,
  shuffleDeck,
} from "../../game_logic/Activity.js";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import { getCost, getType } from "../../game_logic/basicCardFunctions.js";
import { get } from "jquery";

class Hex extends RootCard {
  constructor(name) {
    super();
    this.name = name;
    this.cost = new Cost();
    this.type = ["Hex"];
    this.src = "./img/Nocturne/Hex/" + name + ".JPG";
  }
  play() {}
  is_received() {}
}
class BadOmens extends Hex {
  constructor() {
    super("BadOmens");
  }
  async is_received() {
    while (getDeck().getLength() > 0) {
      await getDiscard().addCard(await getDeck().pop());
    }
    let copper_count = 0;
    let i = 0;
    while (i < getDiscard().getLength()) {
      let card = getDiscard().getCardAll()[i];
      if (
        card.name === "Copper" &&
        copper_count < 2 &&
        getDeck().getLength() < 2
      ) {
        copper_count += 1;
        await getDiscard().remove(card);
        await getDeck().addCard(card);
      }
      if (copper_count >= 2 || getDeck().getLength() >= 2) break;
      i++;
    }
    if (copper_count < 2) {
      await reveal_card(getDiscard().getCardAll());
    }
  }
}
class Delusion extends Hex {
  constructor() {
    super("Delusion");
  }
  async is_received() {
    if (
      !stateHolder.has_card((c) => c.name === "Deluded" || c.name === "Envious")
    ) {
      await receive_state(new Deluded());
    }
  }
}
class Envy extends Hex {
  constructor() {
    super("Envy");
  }
  async is_received() {
    if (
      !stateHolder.has_card((c) => c.name === "Deluded" || c.name === "Envious")
    ) {
      await receive_state(new Envious());
    }
  }
}
class Famine extends Hex {
  constructor() {
    super("Famine");
  }
  async is_received() {
    if (getDeck().getLength() < 3) await mix_discard_to_deck();
    if (getDeck().getLength() <= 0) return;
    let n = Math.min(3, getDeck().getLength());
    let revealed_list = [];
    for (let i = 0; i < n; i++) {
      let card = await getDeck().pop();
      await reveal_card(card);
      if (getType(card).includes(Card.Type.ACTION)) {
        await discard_card(card, false);
      } else {
        revealed_list.push(card);
      }
    }
    while (revealed_list.length > 0) {
      let card = revealed_list.pop();
      await getDeck().addCard(card);
    }
    await shuffleDeck();
  }
}
class Fear extends Hex {
  constructor() {
    super("Fear");
  }
  is_received() {
    if (getHand().getLength() < 5) return;
    return new Promise(async (resolve) => {
      this.chosen = 0;
      getHand()
        .getCardAll()
        .forEach((c) => (c.fear = undefined));
      let clearFunc = async function () {
        await getHand().remove_mark();
        setInstruction("");
      };
      setInstruction(
        "Fear: Discard an Action or Treasure (or reveal your hand)."
      );

      let is_marked = getHand().mark_cards(
        function (card) {
          return (
            this.chosen === 0 &&
            (getType(card).includes(Card.Type.ACTION) ||
              getType(card).includes(Card.Type.TREASURE))
          );
        }.bind(this),
        async function (card) {
          await clearFunc();
          if (this.chosen === 0) {
            this.chosen = 1;
            card.fear = true;
            await discard_card(card, true);
            resolve();
          }
        }.bind(this),
        "discard"
      );
      if (!is_marked) {
        await clearFunc();
        for (let card of getHand().getCardAll()) {
          await reveal_card(card);
        }
        resolve();
      }
    });
  }
}
class Greed extends Hex {
  constructor() {
    super("Greed");
  }
  async is_received() {
    await gain_card_name("Copper", getDeck());
  }
}
class Haunting extends Hex {
  constructor() {
    super("Haunting");
  }
  is_received() {
    if (getHand().getLength() < 4) return;
    return new Promise((resolve) => {
      let clearFunc = async function () {
        await getHand().remove_mark();
        setInstruction("");
      };
      setInstruction("Haunting: Put a card onto your deck.");

      getHand().mark_cards(
        function (card) {
          return true;
        },
        async function (card) {
          await clearFunc();
          await getHand().remove(card);
          await getDeck().addCard(card);
          resolve();
        },
        "discard"
      );
    });
  }
}
class Locusts extends Hex {
  constructor() {
    super("Locusts");
  }
  async is_received() {
    if (getDeck().getLength() <= 0) await mix_discard_to_deck();
    if (getDeck().getLength() <= 0) return;
    let top_card = await getDeck().pop();
    const type = getType(top_card),
      cost = this.getCost(top_card);
    await trash_card(top_card, false);
    if (top_card.name === "Copper" || top_card.name === "Estate")
      await gain_card_name("Curse");
    else {
      if (cost.coin <= 0) {
        return;
      }
      return new Promise((resolve) => {
        let clearFunc = function () {
          removeMarkSupplyPile();
          setInstruction("");
        };
        setInstruction("Locusts: Gain a cheaper card.");

        let is_marked = markSupplyPile(
          function (pile) {
            return (
              pile.getType().find((t) => type.includes(t)) &&
              cost.isGreaterThan(pile.getCost()) &&
              pile.getQuantity() > 0
            );
          },
          async function (pile) {
            await gain_card(pile);

            removeMarkSupplyPile();
            resolve("Locusts finish");
          }
        );
        if (!is_marked) {
          clearFunc();
          resolve("Locusts finish");
        }
      });
    }
  }
}
class Misery extends Hex {
  constructor() {
    super("Misery");
    this.description = "";
  }
  async is_received() {
    if (stateHolder.has_card((c) => c.name === "TwiceMiserable")) return;
    if (stateHolder.has_card((c) => c.name === "Miserable")) {
      let miserable = stateHolder.getStateByName("Miserable");
      if (miserable) {
        stateHolder.removeState(miserable);
      }
      await receive_state(new TwiceMiserable());
    } else {
      await receive_state(new Miserable());
    }
  }
}
class Plague extends Hex {
  constructor() {
    super("Plague");
  }
  async is_received() {
    await gain_card_name("Curse", getHand());
  }
}
class Poverty extends Hex {
  constructor() {
    super("Poverty");
  }
  is_received() {
    if (getHand().getLength() <= 3) {
      return;
    }
    return new Promise((resolve) => {
      this.chosen = 0;
      let n = Math.max(getHand().getLength() - 3, 0);

      let clearFunc = async function () {
        await getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Poverty: Discard down to 3 cards in hand.");

      getHand()
        .getCardAll()
        .forEach((c) => (c.poverty = undefined));
      getButtonPanel().add_button(
        "OK",
        async function () {
          if (this.chosen < n) return;
          clearFunc();
          for (let i = 0; i < getHand().getLength(); i++) {
            let card = getHand().getCardAll()[i];
            if (card.poverty) {
              await discard_card(card, true);
            }
          }
          resolve("Poverty finish");
        }.bind(this)
      );
      getHand().mark_cards(
        function (card) {
          return this.chosen < n;
        }.bind(this),
        function (card) {
          if (this.chosen < n) {
            this.chosen += 1;
            card.poverty = true;
          }
        }.bind(this),
        "discard"
      );
    });
  }
}
class War extends Hex {
  constructor() {
    super("War");
  }
  async is_received() {
    let shuffled = false;
    let to_discard = [];
    if (getDeck().getLength() <= 0) {
      await mix_discard_to_deck();
      shuffled = true;
    }
    if (getDeck().getLength() <= 0) return;
    let card = await getDeck().pop();
    let minCost = new Cost(3),
      maxCost = new Cost(4);
    while (
      !(minCost.isEqual(getCost(card)) || maxCost.isEqual(getCost(card)))
    ) {
      to_discard.push(card);
      await reveal_card(card);
      if (getDeck().getLength() === 0) {
        if (shuffled) {
          await getDiscard().addCardList(to_discard);
          return;
        } else {
          await mix_discard_to_deck();
          shuffled = true;
        }
      }
      if (getDeck().getLength() <= 0) {
        await getDiscard().addCardList(to_discard);
        return;
      }
      card = await getDeck().pop();
    }
    await trash_card(card, false);
    await getDiscard().addCardList(to_discard);
  }
}

export {
  BadOmens,
  Delusion,
  Envy,
  Famine,
  Fear,
  Greed,
  Haunting,
  Locusts,
  Misery,
  Plague,
  Poverty,
  War,
};
