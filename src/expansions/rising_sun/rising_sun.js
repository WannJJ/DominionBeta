import { Card, Cost } from "../cards.js";
import {
  REASON_START_TURN,
  REASON_START_CLEANUP,
  REASON_AFTER_PLAY,
} from "../../game_logic/ReactionEffectManager.js";

import {
  markSupplyPile,
  removeMarkSupplyPile,
} from "../../features/TableSide/Supply.jsx";

import {
  getPlayField,
  getHand,
} from "../../features/PlayerSide/CardHolder/CardHolder.jsx";
import {
  getDiscard,
  getDeck,
  getTrash,
} from "../../features/PlayerSide/CardPile/CardPile.jsx";

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
  remove_sun_token,
  trashCardList,
  discardCardList,
} from "../../game_logic/Activity.js";
import { getGameState } from "../../game_logic/GameState.js";
import { findSupplyPile } from "../../features/TableSide/SupplyPile.jsx";
import { findNonSupplyPile } from "../../features/TableSide/NonSupplyPile.jsx";
import { getCost, getType } from "../../game_logic/basicCardFunctions.js";

/*
Mẫu
class  extends Card{
    constructor(){
        super("", new Cost(), `${Card.Type.ACTION}`, "RisingSun/");
    }
    play(){} 
}

*/

class Alley extends Card {
  constructor() {
    super(
      "Alley",
      new Cost(4),
      `${Card.Type.ACTION} ${Card.Type.SHADOW}`,
      "RisingSun/"
    );
  }
  getCardBack() {
    return "./img/RisingSun/AlleyBack.JPG";
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      getHand().mark_cards(
        function (card) {
          return true;
        },
        async function (card) {
          await getHand().remove_mark();
          await discard_card(card);
          resolve();
        },
        "discard"
      );
    });
  }
}

class Aristocrat extends Card {
  constructor() {
    super("Aristocrat", new Cost(3), `${Card.Type.ACTION}`, "RisingSun/");
  }
  async play() {
    let counter = 0;
    for (let card of getPlayField().getCardAll()) {
      if (card.name === this.name) counter += 1;
    }
    switch (counter) {
      case 1:
      case 5:
        await getBasicStats().addAction(3);
        break;
      case 2:
      case 6:
        await drawNCards(3);
        break;
      case 3:
      case 7:
        await getBasicStats().addCoin(3);
        break;
      case 4:
      case 8:
        await getBasicStats().addBuy(3);
        break;
    }
  }
}

class Artist extends Card {
  constructor() {
    super("Artist", new Cost(0, 8), `${Card.Type.ACTION}`, "RisingSun/");
  }
  async play() {
    await getBasicStats().addAction(1);

    let name_list = [];
    let count_list = [];
    for (let i = 0; i < getPlayField().getLength(); i++) {
      let card = getPlayField().getCardAll()[i];
      if (name_list.includes(card.name)) {
        let index = name_list.indexOf(card.name);
        count_list[index] = count_list[index] + 1;
      } else {
        name_list.push(card.name);
        count_list.push(1);
      }
    }
    let one_copy_count = count_list.filter((c) => c === 1).length;
    await drawNCards(one_copy_count);
  }
}

class Change extends Card {
  constructor() {
    super("Change", new Cost(4), `${Card.Type.ACTION}`, "RisingSun/");
    this.description =
      "If you have any D, +$3. Otherwise, trash a card from your hand, and gain a card costing more $ than it. +D equal to the difference in $.";
  }
  async play() {
    if (getBasicStats().getDebt() > 0) {
      await getBasicStats().addCoin(3);
      return;
    }
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      getHand().mark_cards(
        function (card) {
          return this.chosen == 0;
        }.bind(this),
        async function (card) {
          await getHand().remove_mark();
          this.chosen += 1;
          await trash_card(card);
          let isCardExist = markSupplyPile(
            function (pile) {
              return (
                pile.getQuantity() > 0 &&
                pile.getCost().getCoin() > getCost(card).getCoin()
              );
            },
            async function (pile) {
              let coinDiff = pile.getCost().getCoin() - getCost(card).getCoin();
              removeMarkSupplyPile();
              await gain_card(pile);
              await getBasicStats().addDebt(coinDiff);
              resolve("Change finish");
            }.bind(this)
          );
          if(!isCardExist){
            removeMarkSupplyPile();
            resolve();
          }
        }.bind(this),
        "trash"
      );
    });
  }
  async play_step1() {}
}

class CraftsMan extends Card {
  constructor() {
    super("CraftsMan", new Cost(3), `${Card.Type.ACTION}`, "RisingSun/");
  }
  async play() {
    await getBasicStats().addDebt(2);
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          let cost = new Cost(5);
          return (
            pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve("CraftsMan finish");
        }
      );
    });
  }
}
class Daimyo extends Card {
  constructor() {
    super(
      "Daimyo",
      new Cost(0, 6),
      `${Card.Type.ACTION} ${Card.Type.COMMAND}`,
      "RisingSun/"
    );
    this.activate_when_in_play = true;
    this.activate_after_play = false;
  }
  async play() {
    this.activate_after_play = true;
    await draw1();
    await getBasicStats().addAction(1);
  }
  should_activate(reason, card) {
    return (
      reason === REASON_AFTER_PLAY &&
      card &&
      !getType(card).includes(Card.Type.COMMAND) &&
      getType(card).includes(Card.Type.ACTION)
    );
  }
  async activate(reason, card) {
    this.activate_after_play = false;
    await play_card(card, false);
  }
}

class Fishmonger extends Card {
  constructor() {
    super(
      "Fishmonger",
      new Cost(2),
      `${Card.Type.ACTION} ${Card.Type.SHADOW}`,
      "RisingSun/"
    );
  }
  getCardBack() {
    return "./img/RisingSun/FishmongerBack.JPG";
  }
  async play() {
    await getBasicStats().addBuy(1);
    await getBasicStats().addCoin(1);
  }
}

class GoldMine extends Card {
  constructor() {
    super("GoldMine", new Cost(5), `${Card.Type.ACTION}`, "RisingSun/");
  }
  async play() {
    await draw1();
    await getBasicStats().addBuy(1);
    await getBasicStats().addAction(1);

    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Gain Gold",
        async function () {
          getButtonPanel().clear_buttons();
          await gain_card_name("Gold");
          await getBasicStats().addDebt(4);
          resolve("GoldMine finish");
        }.bind(this)
      );
      getButtonPanel().add_button("Cancel", async function () {
        getButtonPanel().clear_buttons();
        resolve("GoldMine finish");
      });
    });
  }
}

class ImperialEnvoy extends Card {
  constructor() {
    super("ImperialEnvoy", new Cost(5), `${Card.Type.ACTION}`, "RisingSun/");
  }
  async play() {
    await drawNCards(5);
    await getBasicStats().addBuy(1);
    await getBasicStats().addDebt(2);
  }
}

class Kitsune extends Card {
  constructor() {
    super(
      "Kitsune",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.ATTACK} ${Card.Type.OMEN}`,
      "RisingSun/"
    );
  }
  async play() {
    await remove_sun_token();

    await new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("+2 Actions", async function () {
        await getBasicStats().addAction(2);
        getButtonPanel().clear_buttons();
        resolve();
      });
      getButtonPanel().add_button("+2 Coins", async function () {
        await getBasicStats().addCoin(2);
        getButtonPanel().clear_buttons();
        resolve();
      });
    });
    await attack_other(this);
    await gain_card_name("Silver");
  }
  async is_attacked() {
    await gain_card_name("Curse");
  }
}

class Litter extends Card {
  constructor() {
    super("Litter", new Cost(5), `${Card.Type.ACTION}`, "RisingSun/");
  }
  async play() {
    await drawNCards(2);
    await getBasicStats().addAction(2);
    await getBasicStats().addDebt(1);
  }
}

class MountainShrine extends Card {
  constructor() {
    super(
      "MountainShrine",
      new Cost(0, 5),
      `${Card.Type.ACTION} ${Card.Type.OMEN}`,
      "RisingSun/"
    );
  }
  async play() {
    await remove_sun_token();
    await getBasicStats().addCoin(2);

    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        await getHand().remove_mark();
      };

      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Cancel",
        async function () {
          await clearFunc();
          resolve("MountainShrine finish");
        }.bind(this)
      );

      getHand().mark_cards(
        function (card) {
          return true;
        },
        async function (card) {
          await clearFunc();
          await trash_card(card);
          if (
            getTrash().has_card((card1) =>
              getType(card1).includes(Card.Type.ACTION)
            )
          ) {
            await drawNCards(2);
          }
          resolve("MountainShrine finish");
        },
        "trash"
      );
    });
  }
}

class Ninja extends Card {
  constructor() {
    super(
      "Ninja",
      new Cost(4),
      `${Card.Type.ACTION} ${Card.Type.ATTACK} ${Card.Type.SHADOW}`,
      "RisingSun/"
    );
  }
  getCardBack() {
    return "./img/RisingSun/NinjaBack.JPG";
  }
  async play() {
    await draw1();

    await attack_other(this);
  }

  attack() {}
  is_attacked() {
    if (getHand().length() <= 3) {
      return;
    }
    return new Promise((resolve) => {
      this.chosen = 0;
      let n = Math.max(getHand().length() - 3, 0);
      getHand().state.cards.forEach((c) => (c.ninja = undefined));
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        await getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "OK",
        async function () {
          if (this.chosen < n) return;
          let i = 0;
          while (i < getHand().length()) {
            let card = getHand().getCardAll()[i];
            if (card.ninja) {
              await discard_card(card, true);
            } else {
              i++;
            }
          }
          await clearFunc();
          resolve("Ninja finish");
        }.bind(this)
      );
      getHand().mark_cards(
        function (card) {
          return this.chosen < n;
        }.bind(this),
        function (card) {
          if (this.chosen < n) {
            this.chosen += 1;
            card.ninja = true;
          }
        }.bind(this),
        "discard"
      );
    });
  }
}

class Poet extends Card {
  constructor() {
    super(
      "Poet",
      new Cost(4),
      `${Card.Type.ACTION} ${Card.Type.OMEN}`,
      "RisingSun/"
    );
  }
  async play() {
    await remove_sun_token();
    await draw1();
    await getBasicStats().addAction(1);

    if (getDeck().getLength() <= 0) await mix_discard_to_deck();
    let card = getDeck().getTopCard();
    if (card === undefined) return;
    await reveal_card(card);
    let cost = new Cost(3);
    if (cost.isGreaterOrEqual(getCost(card))) {
      card = await getDeck().pop();
      await getHand().addCard(card);
    }
  }
}

class Rice extends Card {
  constructor() {
    super("Rice", new Cost(7), `${Card.Type.TREASURE}`, "RisingSun/");
  }
  async play() {
    await getBasicStats().addBuy(1);

    let typeList = [];
    for (let card of getPlayField().getCardAll()) {
      typeList.push(...getType(card));
    }
    let typeCount = [...new Set(typeList)].length;
    await getBasicStats().addCoin(typeCount);
  }
}
class RiceBroker extends Card {
  constructor() {
    super("RiceBroker", new Cost(5), `${Card.Type.ACTION}`, "RisingSun/");
  }
  async play() {
    await getBasicStats().addAction(1);

    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      getHand().mark_cards(
        function (card) {
          return true;
        },
        async function (card) {
          await getHand().remove_mark();
          await trash_card(card);
          if (getType(card).includes(Card.Type.TREASURE)) {
            await drawNCards(2);
          } else if (getType(card).includes(Card.Type.ACTION)) {
            await drawNCards(5);
          }
          resolve("RiceBroker finish");
        },
        "trash"
      );
    });
  }
}

class RiverShrine extends Card {
  constructor() {
    super(
      "RiverShrine",
      new Cost(4),
      `${Card.Type.ACTION} ${Card.Type.OMEN}`,
      "RisingSun/"
    );
    this.activate_when_start_cleanup = true;
    this.activate_when_in_play = true;
  }
  async play() {
    await remove_sun_token();
    if (getHand().getLength() <= 0) return;
    await new Promise((resolve) => {
      this.card_list = [];
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        await getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Confirm Trashing",
        async function () {
          await clearFunc();
          let cardList = getHand().getSelectedList();
          if (cardList.length > 0) {
            await trashCardList(cardList);
          }
          resolve("RiverShrine finish");
        }.bind(this)
      );

      getHand().mark_cards(
        function () {
          return getHand().getSelectedList().length < 2;
        },
        function (card) {
          this.card_list.push(card);
        }.bind(this),
        "trash",
        true
      );
    });
  }
  should_activate(reason, card) {
    return (
      reason === REASON_START_CLEANUP &&
      getGameState().cards_gained_this_buy_phase.length === 0
    );
  }
  activate(reason, card) {
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          let cost = new Cost(4);
          return (
            pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve("RiverShrine finish");
        }.bind(this)
      );
    });
  }
}

class RiverBoat extends Card {
  constructor() {
    super(
      "RiverBoat",
      new Cost(3),
      `${Card.Type.ACTION} ${Card.Type.DURATION}`,
      "RisingSun/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = true;
  }
  async setup() {}
  async play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate(reason) {
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    let riverBoatPile = findNonSupplyPile(
      (pile) => pile.getName() === "RiverBoat_Card" && pile.getQuantity() > 0
    );
    if (riverBoatPile) {
      let card = riverBoatPile.getNextCard();
      if (card) {
        await play_card(card, false);
      }
    }
  }
}

class Ronin extends Card {
  constructor() {
    super(
      "Ronin",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.SHADOW}`,
      "RisingSun/"
    );
  }
  getCardBack() {
    return "./img/RisingSun/RoninBack.JPG";
  }
  async play() {
    if (getHand().getLength() >= 7) return;
    let toDraw = 7 - getHand().getLength();
    await drawNCards(toDraw);
  }
}

class RootCellar extends Card {
  constructor() {
    super("RootCellar", new Cost(3), `${Card.Type.ACTION}`, "RisingSun/");
  }
  async play() {
    await drawNCards(3);
    await getBasicStats().addAction(1);
    await getBasicStats().addDebt(3);
  }
}

class RusticVillage extends Card {
  constructor() {
    super(
      "RusticVillage",
      new Cost(4),
      `${Card.Type.ACTION} ${Card.Type.OMEN}`,
      "RisingSun/"
    );
  }
  async play() {
    await remove_sun_token();
    await draw1();
    await getBasicStats().addAction(2);

    if (getHand().getLength() < 2) return;
    await new Promise((resolve) => {
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        await getHand().remove_mark();
      };

      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Cancel",
        async function () {
          await clearFunc();
          resolve();
        }.bind(this)
      );

      let chosen = 0;
      let card_list = [];
      getHand().mark_cards(
        (c) => chosen < 3,
        async function (card) {
          chosen += 1;
          card_list.push(card);
          if (chosen == 2 && card_list.length == 2) {
            await discardCardList(card_list);

            await draw1();
            await clearFunc();
            resolve();
          }
        }.bind(this),
        "discard"
      );
    });
  }
}

class Samurai extends Card {
  constructor() {
    super(
      "Samurai",
      new Cost(6),
      `${Card.Type.ACTION} ${Card.Type.DURATION} ${Card.Type.ATTACK}`,
      "RisingSun/"
    );
    this.not_discard_in_cleanup = true;
    this.activate_when_in_play = true;
    this.activate_when_start_turn = true;
  }
  async play() {
    await attack_other(this);
  }
  is_attacked() {
    if (getHand().length() <= 3) {
      return;
    }
    return new Promise((resolve) => {
      this.chosen = 0;
      let n = Math.max(getHand().length() - 3, 0);
      getHand()
        .getCardAll()
        .forEach((c) => (c.samurai = undefined));
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        await getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "OK",
        async function () {
          if (this.chosen < n) return;
          let i = 0;
          while (i < getHand().length()) {
            let card = getHand().getCardAll()[i];
            if (card.samurai) {
              await discard_card(card, true);
            } else {
              i++;
            }
          }
          await clearFunc();
          resolve("Samurai finish");
        }.bind(this)
      );
      getHand().mark_cards(
        function (card) {
          return this.chosen < n;
        }.bind(this),
        function (card) {
          if (this.chosen < n) {
            this.chosen += 1;
            card.samurai = true;
          }
        }.bind(this),
        "discard"
      );
    });
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate() {
    await getBasicStats().addCoin(1);
  }
}

class SnakeWitch extends Card {
  constructor() {
    super(
      "SnakeWitch",
      new Cost(2),
      `${Card.Type.ACTION} ${Card.Type.ATTACK}`,
      "RisingSun/"
    );
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);

    let nameSet = new Set(
      getHand()
        .getCardAll()
        .map((card) => card.name)
    );
    if (nameSet.size === getHand().getLength()) {
      await this.play_step1();
    }
  }
  play_step1() {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Reveal Hand",
        async function () {
          getButtonPanel().clear_buttons();
          await reveal_card(getHand().getCardAll());
          let snakeWitchPile = findSupplyPile(
            (pile) => pile.getName() === this.name
          );
          if (snakeWitchPile !== undefined) {
            let c = await getPlayField().remove(this);
            if (c !== undefined) await snakeWitchPile.return_card(this);
          }

          await attack_other(this);
          resolve("SnakeWitch play step 1 finish");
        }.bind(this)
      );
      getButtonPanel().add_button("Cancel", function () {
        getButtonPanel().clear_buttons();
        resolve("SnakeWitch play step 1 finish");
      });
    });
  }
  async is_attacked() {
    await gain_card_name("Curse");
  }
}

class Tanuki extends Card {
  constructor() {
    super(
      "Tanuki",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.SHADOW}`,
      "RisingSun/"
    );
  }
  getCardBack() {
    return "./img/RisingSun/TanukiBack.JPG";
  }
  async play() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      getHand().mark_cards(
        function (card) {
          return this.chosen === 0;
        }.bind(this),
        async function (card) {
          await getHand().remove_mark();
          this.chosen += 1;
          await trash_card(card);
          markSupplyPile(
            function (pile) {
              let cost = new Cost(2);
              cost.addCost(getCost(card));
              return (
                pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost())
              );
            },
            async function (pile) {
              removeMarkSupplyPile();
              await gain_card(pile);
              resolve("Tanuki finish");
            }.bind(this)
          );
        }.bind(this),
        "trash"
      );
    });
  }
}

class TeaHouse extends Card {
  constructor() {
    super(
      "TeaHouse",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.OMEN}`,
      "RisingSun/"
    );
  }
  async play() {
    await remove_sun_token();
    await draw1();
    await getBasicStats().addAction(1);
    await getBasicStats().addCoin(2);
  }
}

export {
  Alley,
  Aristocrat,
  Artist,
  Change,
  CraftsMan,
  Daimyo,
  Fishmonger,
  GoldMine,
  ImperialEnvoy,
  Kitsune,
  Litter,
  MountainShrine,
  Ninja,
  Poet,
  Rice,
  RiceBroker,
  RiverShrine,
  RiverBoat,
  Ronin,
  RootCellar,
  RusticVillage,
  Samurai,
  SnakeWitch,
  Tanuki,
  TeaHouse,
};
