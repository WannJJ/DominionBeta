import { Card, Cost } from "../cards.js";
import {
  draw1,
  drawNCards,
  mix_discard_to_deck,
  play_card,
  gain_card,
  gain_card_name,
  gainCardByType,
  discard_card,
  trash_card,
  reveal_card,
  revealCardList,
  set_aside_card,
  attack_other,
  mayPlayCardFromHand,
  message_other,
  trashCardList,
  discardCardList,
} from "../../game_logic/Activity.js";
import {
  findSupplyPile,
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
} from "../../features/PlayerSide/CardPile/CardPile.jsx";
import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";

import {
  REASON_START_TURN,
  REASON_WHEN_GAIN,
  REASON_START_CLEANUP,
  effectBuffer,
  REASON_WHEN_DISCARD_FROM_PLAY,
  REASON_WHEN_PLAY,
  REASON_WHEN_TRASH,
} from "../../game_logic/ReactionEffectManager.js";
import {
  getPlayArea,
  getSetAside,
} from "../../features/PlayerSide/BottomLeftCorner/SideArea.jsx";
import {
  PHASE_ACTION,
  PHASE_BUY,
  PHASE_REACTION,
  PHASE_WAITING,
} from "../../utils/constants.js";
import { opponentManager } from "../../features/OpponentSide/Opponent.js";
import { getSupportHand } from "../../features/SupportHand.jsx";
import { getClassFromName } from "../../setup.js";
import { getGameState } from "../../game_logic/GameState.js";
import { getCost, getType } from "../../game_logic/basicCardFunctions.js";
/*
class  extends Card{
    constructor(){
        super("", new Cost(), `${Card.Type.ACTION}`, "Empires/", );
    }
    async play(){
        
    } 
}
*/

class CityQuarter extends Card {
  constructor() {
    super("CityQuarter", new Cost(0, 8), Card.Type.ACTION, "Empires/");
  }
  async play() {
    await getBasicStats().addAction(2);
    await revealCardList(getHand().getCardAll());
    let actionCount = 0;
    for (let card of getHand().getCardAll()) {
      if (getType(card).includes(Card.Type.ACTION)) {
        actionCount += 1;
      }
    }
    await drawNCards(actionCount);
    await getBasicStats().addAction(actionCount);
  }
}
class Engineer extends Card {
  constructor() {
    super("Engineer", new Cost(0, 4), Card.Type.ACTION, "Empires/");
  }
  async play() {
    await this.play_step1();
    await this.play_step2();
  }
  play_step1() {
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          let cost = new Cost(4);
          return (
            cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity() > 0
          );
        },
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve("Engineer finish");
        }
      );
    });
  }
  play_step2() {
    return new Promise((resolve) => {
      setInstruction("You may trash Engineer to gain a card costing up to $4");
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };

      getButtonPanel().add_button(
        "Trash Engineer",
        async function () {
          await getPlayField().remove(this);
          await trash_card(this, false);
          clearFunc();

          await this.play_step1();

          resolve();
        }.bind(this)
      );
      getButtonPanel().add_button("Dont trash", function () {
        clearFunc();
        resolve();
      });
    });
  }
}

class Overlord extends Card {
  constructor() {
    super(
      "Overlord",
      new Cost(0, 8),
      `${Card.Type.ACTION} ${Card.Type.COMMAND}`,
      "Empires/"
    );
  }
  play() {
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          let cost = new Cost(5);
          return (
            pile.getQuantity() > 0 &&
            pile.getType().includes(Card.Type.ACTION) &&
            !pile.getType().includes(Card.Type.COMMAND) &&
            cost.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          let card = pile.getNextCard();
          removeMarkSupplyPile();

          if (card) {
            await play_card(card, false);
          }

          resolve();
        }
      );
    });
  }
}

class RoyalBlacksmith extends Card {
  constructor() {
    super("RoyalBlacksmith", new Cost(0, 8), Card.Type.ACTION, "Empires/");
  }
  async play() {
    await drawNCards(5);
    await revealCardList(getHand().getCardAll());
    let copperList = [];
    for (let card of getHand().getCardAll()) {
      if (card.name === "Copper") {
        copperList.push(card);
      }
    }
    if (copperList.length > 0) {
      await discardCardList(copperList);
    }
  }
}

//Split
class Encampment extends Card {
  constructor() {
    super("Encampment", new Cost(2), Card.Type.ACTION, "Empires/");
    this.activate_when_in_play = true;
    this.activate_when_start_cleanup = true;
  }
  createSplitPile() {
    return [
      new Plunder(),
      new Plunder(),
      new Plunder(),
      new Plunder(),
      new Plunder(),
      new Encampment(),
      new Encampment(),
      new Encampment(),
      new Encampment(),
      new Encampment(),
    ];
  }
  async play() {
    await drawNCards(2);
    await getBasicStats().addAction(2);

    await this.play_step1();
  }
  play_step1() {
    if (getHand().getLength() <= 0) return;
    return new Promise(async (resolve) => {
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("You may reveal a Gold or Plunder from your hand.");

      let setAsideSelf = async function () {
        // actually, the card is put to play area
        let removed = await getPlayField().remove(this);
        if (removed) {
          await getPlayArea().addCard(this);
          this.activate_when_in_play = true;
          this.activate_when_start_cleanup = true;
        }
      }.bind(this);

      getButtonPanel().add_button("Dont Reveal", async function () {
        clearFunc();
        await setAsideSelf();
        resolve();
      });

      let contain_gold_plunder = getHand().mark_cards(
        function (card) {
          return card.name === "Gold" || card.name === "Plunder";
        },
        async function (card) {
          clearFunc();
          await reveal_card(card);
          this.activate_when_in_play = false;
          resolve();
        }.bind(this),
        "choose"
      );

      if (!contain_gold_plunder) {
        clearFunc();
        await setAsideSelf();
        resolve();
      }
    });
  }
  should_activate(reason) {
    return reason === REASON_START_CLEANUP;
  }
  async activate() {
    let removed = await getPlayField().remove(this);
    let pile = findSupplyPile((pile) => pile.isOriginOf(this));
    if (!removed || !pile) return;

    await pile.return_card(this);
  }
}

class Plunder extends Card {
  constructor() {
    super("Plunder", new Cost(5), Card.Type.TREASURE, "Empires/");
  }
  async play() {
    await getBasicStats().addCoin(2);
    await getBasicStats().addVictoryToken(1);
  }
}

//Split
class Patrician extends Card {
  constructor() {
    super("Patrician", new Cost(2), Card.Type.ACTION, "Empires/");
  }
  createSplitPile() {
    return [
      new Emporium(),
      new Emporium(),
      new Emporium(),
      new Emporium(),
      new Emporium(),
      new Patrician(),
      new Patrician(),
      new Patrician(),
      new Patrician(),
      new Patrician(),
    ];
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);

    let card = getDeck().getTopCard();
    if (card) {
      await reveal_card(card);
      let cost = new Cost(5);
      if (getCost(card).isGreaterOrEqual(cost)) {
        await getDeck().pop();
        await getHand().addCard(card);
      }
    }
  }
}

class Emporium extends Card {
  constructor() {
    super("Emporium", new Cost(5), Card.Type.ACTION, "Empires/");
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);
    await getBasicStats().addCoin(1);
  }
  async is_gained() {
    let actionCount = 0;
    for (let card of getPlayField().getCardAll()) {
      if (getType(card).includes(Card.Type.ACTION)) {
        actionCount += 1;
      }
    }
    if (actionCount >= 5) {
      await getBasicStats().addVictoryToken(2);
    }
  }
}

//Split
class Settlers extends Card {
  constructor() {
    super("Settlers", new Cost(2), Card.Type.ACTION, "Empires/");
  }
  createSplitPile() {
    return [
      new BustlingVillage(),
      new BustlingVillage(),
      new BustlingVillage(),
      new BustlingVillage(),
      new BustlingVillage(),
      new Settlers(),
      new Settlers(),
      new Settlers(),
      new Settlers(),
      new Settlers(),
    ];
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);

    let copper = null;
    for (let card of getDiscard().getCardAll()) {
      if (card.name === "Copper") {
        copper = card;
        break;
      }
    }
    if (copper) await this.play_step1(copper);
  }
  play_step1(copper) {
    return new Promise((resolve) => {
      setInstruction(
        "You may reveal a Copper from your discard pile and put it into your hand"
      );
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };

      getButtonPanel().add_button("Reveal Copper", async function () {
        await reveal_card(copper);
        await getDiscard().remove(copper);
        await getHand().addCard(copper);

        clearFunc();
        resolve();
      });

      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve();
      });
    });
  }
}

class BustlingVillage extends Card {
  constructor() {
    super("BustlingVillage", new Cost(5), Card.Type.ACTION, "Empires/");
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(3);

    let settlers = null;
    for (let card of getDiscard().getCardAll()) {
      if (card.name === "Settlers") {
        settlers = card;
        break;
      }
    }
    if (settlers) await this.play_step1(settlers);
  }

  play_step1(settlers) {
    return new Promise((resolve) => {
      setInstruction(
        "You may reveal a Settlers from your discard pile and put it into your hand"
      );
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };

      getButtonPanel().add_button("Reveal Settlers", async function () {
        await reveal_card(settlers);
        await getDiscard().remove(settlers);
        await getHand().addCard(settlers);

        clearFunc();
        resolve();
      });

      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve();
      });
    });
  }
}

//Split
class Catapult extends Card {
  constructor() {
    super(
      "Catapult",
      new Cost(3),
      `${Card.Type.ACTION} ${Card.Type.ATTACK}`,
      "Empires/"
    );
  }
  createSplitPile() {
    return [
      new Rocks(),
      new Rocks(),
      new Rocks(),
      new Rocks(),
      new Rocks(),
      new Catapult(),
      new Catapult(),
      new Catapult(),
      new Catapult(),
      new Catapult(),
    ];
  }
  async play() {
    await getBasicStats().addCoin(1);

    if (getHand().getLength() <= 0) return;
    await this.play_step1();
  }
  play_step1() {
    return new Promise((resolve) => {
      let chosen = 0;
      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          getHand().remove_mark();
          chosen += 1;
          await trash_card(card);

          let cost = new Cost(3);
          if (getCost(card).isGreaterOrEqual(cost)) {
            await this.attack("Type 1");
          }
          if (getType(card).includes(Card.Type.TREASURE)) {
            await this.attack("Type 2");
          }
          resolve();
        }.bind(this),
        "trash"
      );
    });
  }
  async attack(additional_info) {
    await attack_other(this, additional_info);
  }
  async is_attacked(additional_info) {
    if (additional_info === "Type 1") {
      await gain_card_name("Curse");
    }
    if (additional_info === "Type 2") {
      await this.is_attacked_step1();
    }
  }
  is_attacked_step1() {
    if (getHand().getLength() <= 3) return;
    return new Promise((resolve) => {
      let chosen = 0;
      let discardList = [];
      let n = Math.max(getHand().length() - 3, 0);

      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        getHand().remove_mark();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Discard down to 3 cards in hand");

      getButtonPanel().add_button(
        "OK",
        async function () {
          if (this.chosen < n) return;
          clearFunc();
          await discardCardList(discardList);
          resolve("catapult finish");
        }.bind(this)
      );
      getHand().mark_cards(
        function (card) {
          return chosen < n;
        },
        function (card) {
          if (chosen < n) {
            chosen += 1;
            discardList.push(card);
          }
        },
        "discard"
      );
    });
  }
}

class Rocks extends Card {
  constructor() {
    super("Rocks", new Cost(4), Card.Type.TREASURE, "Empires/");
    this.activate_when_trash = true;
  }
  async play() {
    await getBasicStats().addCoin(1);
  }
  async is_gained() {
    await this.is_gained_step1();
  }
  async is_gained_step1() {
    if (getPlayer().phase === PHASE_BUY) {
      let silver = await gain_card_name("Silver", getDeck());
    } else {
      let silver = await gain_card_name("Silver", getHand());
    }
  }
  should_activate(reason, card) {
    return reason === REASON_WHEN_TRASH && card && card.id === this.id;
  }
  async activate(reason, card) {
    await this.is_gained_step1();
  }
}

class ChariotRace extends Card {
  static MESSAGE = {
    MORE: "MORE",
    LESS: "LESS",
    NOT: "NOT",
  };
  constructor() {
    super("ChariotRace", new Cost(3), Card.Type.ACTION, "Empires/");
    this.description =
      "Reveal the top card of your deck and put it into your hand. The player to your left reveals the top card of their deck. If your card costs more, +$1 and +1 VP.";
  }
  async play() {
    await getBasicStats().addAction(1);

    if (getDeck().getLength() <= 0) await mix_discard_to_deck();
    if (getDeck().getLength() <= 0) return;

    let topCard = await getDeck().pop();
    if (!topCard) return;
    await reveal_card(topCard);
    await getHand().addCard(topCard);

    if (opponentManager.getOpponentList().length <= 0) return;
    let leftPlayer = opponentManager.getLeftPlayer();
    let res = await message_other(this, `${topCard.name}`, leftPlayer.username);
    if (res === ChariotRace.MESSAGE.MORE) {
      await getBasicStats().addCoin(1);
      await getBasicStats().addVictoryToken(1);
    }
  }
  async receive_message(cardName) {
    let cardClass = getClassFromName(cardName);
    let opponentCard = new cardClass();

    if (getDeck().getLength() <= 0) await mix_discard_to_deck();
    if (getDeck().getLength() <= 0) return ChariotRace.MESSAGE.NOT;

    let topCard = await getDeck().pop();
    if (!topCard) return ChariotRace.MESSAGE.NOT;
    await reveal_card(topCard);

    if (getCost(opponentCard).isGreaterThan(getCost(topCard))) {
      return ChariotRace.MESSAGE.MORE;
    }
    return ChariotRace.MESSAGE.LESS;
  }
}

class Enchantress extends Card {
  constructor() {
    super(
      "Enchantress",
      new Cost(3),
      `${Card.Type.ACTION} ${Card.Type.ATTACK} ${Card.Type.DURATION}`,
      "Empires/"
    );
    this.activate_when_in_play = true;
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;

    this.activate_when_play = false;
    this.turn = -1;
  }
  async play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
    await this.attack();
  }
  async attack() {
    await attack_other(this);
  }
  is_attacked() {
    effectBuffer.addCard(this);
    this.activate_when_play = true;
    this.turn = getPlayer().turn;
  }

  should_activate(reason, card) {
    if (reason === REASON_START_TURN) return true;
    if (reason !== REASON_WHEN_PLAY) return false;
    if (this.turn + 1 < getPlayer().turn) {
      effectBuffer.removeCardById(this.id);
      this.activate_when_play = false;
      return false;
    }

    return (
      card &&
      getType(card).includes(Card.Type.ACTION) &&
      getGameState().cards_played_this_turn.filter((card0) =>
        getType(card0).includes(Card.Type.ACTION)
      ).length === 1
    );
  }
  async activate(reason, card) {
    if (reason === REASON_START_TURN) {
      await drawNCards(2);
      this.not_discard_in_cleanup = false;
      this.activate_when_start_turn = false;
    } else if (reason === REASON_WHEN_PLAY) {
      effectBuffer.removeCardById(this.id);
      this.activate_when_play = false;
      await draw1();
      await getBasicStats().addAction(1);
    }
  }
}

class FarmersMarket extends Card {
  constructor() {
    super(
      "FarmersMarket",
      new Cost(3),
      `${Card.Type.ACTION} ${Card.Type.GATHERING}`,
      "Empires/"
    );
  }
  async play() {
    await getBasicStats().addBuy(1);

    let FMpile = findSupplyPile((pile) => pile.getName() === "FarmersMarket");
    if (!FMpile) return;
    if (FMpile.getVictoryToken() >= 4) {
      await getBasicStats().addVictoryToken(FMpile.getVictoryToken());
      await FMpile.setVictoryToken(0);

      let removed = await getPlayField().remove(this);
      if (removed) {
        await trash_card(this, false);
      }
    } else {
      await FMpile.setVictoryToken(FMpile.getVictoryToken() + 1);
      await getBasicStats().addCoin(FMpile.getVictoryToken());
    }
  }
}

//Split
class Gladiator extends Card {
  constructor() {
    super("Gladiator", new Cost(3), Card.Type.ACTION, "Empires/");
  }
  createSplitPile() {
    return [
      new Fortune(),
      new Fortune(),
      new Fortune(),
      new Fortune(),
      new Fortune(),
      new Gladiator(),
      new Gladiator(),
      new Gladiator(),
      new Gladiator(),
      new Gladiator(),
    ];
  }
  async play() {
    await getBasicStats().addCoin(2);

    if (getHand().getLength() <= 0) return;
    await this.play_step1();
  }
  async receive_message(cardName) {
    if (!getHand().has_card((card) => card.name === cardName)) return "";

    let userReveal = false;
    userReveal = await new Promise((resolve) => {
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction(`Gladiator: You may reveal a ${cardName} from your hand.`);

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve(false);
      });
      getHand().mark_cards(
        function (card) {
          return card.name === cardName;
        },
        async function (card) {
          clearFunc();
          await reveal_card(card);
          resolve(true);
        }
      );
    });
    return userReveal ? "REVEAL" : "";
  }

  play_step1() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getHand().remove_mark();
        setInstruction("");
      };
      setInstruction("Gladiator: Reveal a card from your hand.");
      getHand().mark_cards(
        function (card) {
          return true;
        },
        async function (card) {
          clearFunc();
          await reveal_card(card);

          if (opponentManager.getOpponentList().length <= 0) {
            resolve();
            return;
          }
          let leftPlayer = opponentManager.getLeftPlayer(),
            leftPlayerName = leftPlayer.username;
          let res = await message_other(this, card.name, leftPlayerName);

          if (res === "") {
            await getBasicStats().addCoin(1);

            let gladPile = findSupplyPile(
              (pile) =>
                pile.getQuantity() > 0 &&
                pile.getNextCard().name === "Gladiator"
            );
            if (gladPile) {
              let card0 = await gladPile.popNextCard();
              if (card0) await trash_card(card0, false);
            }
          } else if (res === "REAVEAL") {
          }

          resolve();
        }.bind(this),
        "choose"
      );
    });
  }
}
class Fortune extends Card {
  constructor() {
    super("Fortune", new Cost(8, 8), Card.Type.TREASURE, "Empires/");
    this.turn = -1;
  }
  async play() {
    await getBasicStats().addBuy(1);

    if (
      getPlayField().has_card(
        (card) =>
          card.name === "Fortune" &&
          card.id !== this.id &&
          card.turn === getPlayer().turn
      )
    )
      return;
    await getBasicStats().setCoin(getBasicStats().getCoin() * 2);
    this.turn = getPlayer().turn;
  }
  async is_gained() {
    let gladCount = 0;
    for (let card of getPlayField().getCardAll()) {
      if (card.name === "Gladiator") {
        gladCount += 1;
      }
    }
    for (let i = 0; i < gladCount; i++) {
      await gain_card_name("Gold");
    }
  }
}

class Sacrifice extends Card {
  constructor() {
    super("Sacrifice", new Cost(4), Card.Type.ACTION, "Empires/");
  }
  play() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      let chosen = 0;

      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          chosen = 1;
          getHand().remove_mark();
          await trash_card(card);
          if (getType(card).includes(Card.Type.ACTION)) {
            await drawNCards(2);
            await getBasicStats().addAction(2);
          }
          if (getType(card).includes(Card.Type.TREASURE)) {
            await getBasicStats().addCoin(2);
          }
          if (getType(card).includes(Card.Type.VICTORY)) {
            await getBasicStats().addVictoryToken(2);
          }
          resolve();
        },
        "trash"
      );
    });
  }
}

class Temple extends Card {
  constructor() {
    super(
      "Temple",
      new Cost(4),
      `${Card.Type.ACTION} ${Card.Type.GATHERING}`,
      "Empires/"
    );
  }
  async play() {
    await getBasicStats().addVictoryToken(1);

    if (getHand().getLength() > 0) {
      await this.play_step1();
    }

    let templePile = findSupplyPile((pile) => pile.getName() === this.name);
    if (!templePile) return;
    await templePile.setVictoryToken(templePile.getVictoryToken() + 1);
  }
  play_step1() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      setInstruction("Trash from 1 to 3 differently named cards");
      getButtonPanel().clear_buttons();
      let nameList = [];
      let trashList = [];

      getButtonPanel().add_button("OK", async function () {
        if (trashList.length <= 0 || trashList.length > 3) return;
        clearFunc();
        await trashCardList(trashList);
        resolve();
      });

      getHand().mark_cards(
        function (card) {
          return !nameList.includes(card.name) && trashList.length < 3;
        },
        function (card) {
          if (nameList.includes(card.name) || trashList.length >= 3) return;
          nameList.push(card.name);
          trashList.push(card);
        },
        "trash"
      );
    });
  }
  async is_gained() {
    let templePile = findSupplyPile((pile) => pile.getName() === this.name);
    if (!templePile) return;
    await getBasicStats().addVictoryToken(templePile.getVictoryToken());
    await templePile.setVictoryToken(0);
  }
}
class Villa extends Card {
  constructor() {
    super("Villa", new Cost(4), Card.Type.ACTION, "Empires/");
    this.activate_when_gain = false;
  }
  async play() {
    await getBasicStats().addAction(2);
    await getBasicStats().addBuy(1);
    await getBasicStats().addCoin(1);
  }
  async is_gained() {
    this.activate_when_gain = true;
    effectBuffer.addCard(this);
    await getBasicStats().addAction(1);
    if (getPlayer().phase === PHASE_BUY) {
      getPlayer().phase = PHASE_ACTION;
    }
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    return reason === REASON_WHEN_GAIN && card.id === this.id;
  }
  async activate(reason, card, activity, cardLocationTrack) {
    this.activate_when_gain = false;
    await effectBuffer.removeCardById(this.id);
    if (!card || !cardLocationTrack) return;
    let cardLocation = cardLocationTrack.getLocation();

    if (cardLocation && cardLocation.getCardById(card.id)) {
      let removed = await cardLocation.removeCardById(card.id);
      if (removed) {
        await getHand().addCard(card);
        if (cardLocation.id !== getHand().id) cardLocationTrack.setLocation();
      }
    }
  }
}

class Archive extends Card {
  constructor() {
    super(
      "Archive",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.DURATION}`,
      "Empires/"
    );
    this.activate_when_in_play = false;
    this.activate_when_start_turn = true;
    this.not_discard_in_cleanup = false;
    this.chosen_id_list = [];
  }
  async play() {
    await getBasicStats().addAction(1);

    let n = 3;
    if (getDeck().getLength() <= 0) {
      await mix_discard_to_deck();
    }
    if (getDeck().getLength() <= 0) return;

    n = Math.min(getDeck().getLength(), 3);
    for (let i = 0; i < n; i++) {
      let card = await getDeck().pop();
      if (card) {
        await set_aside_card(card);
        this.chosen_id_list.push(card.id);
        this.activate_when_in_play = true;
        this.not_discard_in_cleanup = true;
      }
    }

    await this.activate_step1();
  }
  should_activate(reason) {
    return reason === REASON_START_TURN && this.chosen_id_list.length > 0;
  }
  async activate(reason, card) {
    await this.activate_step1();
  }
  async activate_step1() {
    if (this.chosen_id_list.length <= 0) return;
    if (this.chosen_id_list.length === 1) {
      await this.activate_step2();
      return;
    }

    await new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      setInstruction("Put a card into your hand");
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      for (let id of this.chosen_id_list) {
        let card = getSetAside().getCardById(id);
        if (!card) continue;

        getButtonPanel().add_button(
          `Put ${card.name}`,
          async function () {
            clearFunc();
            let removed = await getSetAside().removeCardById(id);
            const index = this.chosen_id_list.indexOf(id);
            if (index > -1) {
              this.chosen_id_list.splice(index, 1);
            }

            if (removed) {
              await getHand().addCard(card);
            }

            if (this.chosen_id_list.length <= 0) {
              this.activate_when_in_play = false;
              this.not_discard_in_cleanup = false;
            }
            resolve();
          }.bind(this)
        );
      }
    });
  }
  async activate_step2() {
    if (this.chosen_id_list.length !== 1) return;

    let id = this.chosen_id_list.pop();
    let card = await getSetAside().removeCardById(id);
    if (card) {
      await getHand().addCard(card);
    }

    if (this.chosen_id_list.length <= 0) {
      this.activate_when_in_play = false;
      this.not_discard_in_cleanup = false;
    }
  }
}

class Capital extends Card {
  constructor() {
    super("Capital", new Cost(5), Card.Type.TREASURE, "Empires/");
    this.activate_when_in_play = false;
    this.activate_when_discard_from_play = false;
  }
  async play() {
    this.activate_when_in_play = true;
    this.activate_when_discard_from_play = true;
    await getBasicStats().addCoin(6);
    await getBasicStats().addBuy(1);
  }
  should_activate(reason, card) {
    return (
      reason === REASON_WHEN_DISCARD_FROM_PLAY &&
      card.id === this.id &&
      getPlayField().getCardById(this.id)
    );
  }
  async activate(reason) {
    this.activate_when_discard_from_play = false;
    await getBasicStats().addDebt(6);
  }
}

class Charm extends Card {
  constructor() {
    super("Charm", new Cost(5), `${Card.Type.TREASURE}`, "Empires/");
    this.activate_when_gain = true;
    this.activate_when_in_play = true;
    this.turn = -1;
  }
  play() {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "+1 Buy +$2",
        async function () {
          await getBasicStats().addBuy(1);
          await getBasicStats().addCoin(2);
          this.activate_when_in_play = false;

          getButtonPanel().clear_buttons();
          resolve();
        }.bind(this)
      );
      getButtonPanel().add_button(
        "Gain card next time...",
        function () {
          this.turn = getPlayer().turn;
          this.activate_when_in_play = true;

          getButtonPanel().clear_buttons();
          resolve();
        }.bind(this)
      );
    });
  }
  should_activate(reason) {
    return reason === REASON_WHEN_GAIN && this.turn === getPlayer().turn;
  }
  activate(reason, card) {
    this.turn = -1;
    this.activate_when_in_play = false;
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        removeMarkSupplyPile();
      };
      getButtonPanel().clear_buttons();
      setInstruction("You may gain a card with the same cost");

      getButtonPanel().add_button(
        "Cancel",
        function () {
          clearFunc();
          resolve();
        }.bind(this)
      );

      let pileFound = markSupplyPile(
        function (pile) {
          return (
            pile.getName() !== card.name &&
            pile.getCost().isEqual(getCost(card))
          );
        },
        async function (pile) {
          clearFunc();
          await gain_card(pile);
          resolve();
        }.bind(this)
      );

      if (!pileFound) {
        clearFunc();
        resolve();
      }
    });
  }
}
class Crown extends Card {
  constructor() {
    super(
      "Crown",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.TREASURE}`,
      "Empires/"
    );
  }
  async play() {
    if (getPlayer().phase === "action") {
      await this.play_step1();
    }
    if (getPlayer().phase === "buy") {
      await this.play_step2();
    }
  }
  play_step1() {
    if (getHand().getLength() <= 0) return;
    return new Promise(async (resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        getHand().remove_mark();
        setInstruction("");

        getSupportHand().clear();
        getSupportHand().hide();
        getDeck().removeCanSelect();
      };
      setInstruction("Crown: You may play an Action from your hand twice");
      getButtonPanel().clear_buttons();
      this.chosen = 0;

      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve("Crown finish");
      });

      let mayPlayAction = mayPlayCardFromHand(
        function (card) {
          return this.chosen === 0 && getType(card).includes(Card.Type.ACTION);
        }.bind(this),
        async function (card) {
          if (this.chosen === 0) {
            this.chosen += 1;
            this.chosen_card = card;
          }
          clearFunc();

          await play_card(card);
          await play_card(card, false);
          /*
                    let removed = await getPlayField().remove(card);
                    if(removed) await play_card(card);
                    */

          resolve("Crown finish");
        }.bind(this)
      );
      if (!mayPlayAction) {
        clearFunc();
        resolve("no action");
      }
    });
  }
  play_step2() {
    if (getHand().getLength() <= 0) return;
    return new Promise(async (resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        getHand().remove_mark();
        setInstruction("");

        getSupportHand().clear();
        getSupportHand().hide();
        getDeck().removeCanSelect();
      };
      setInstruction("Crown: You may play a Treasure from your hand twice");
      getButtonPanel().clear_buttons();
      this.chosen = 0;

      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve("Crown finish");
      });

      let mayPlayTreasure = mayPlayCardFromHand(
        function (card) {
          return (
            this.chosen === 0 && getType(card).includes(Card.Type.TREASURE)
          );
        }.bind(this),
        async function (card) {
          if (this.chosen === 0) {
            this.chosen += 1;
            this.chosen_card = card;
          }
          clearFunc();

          await play_card(card);
          await play_card(card, false);

          resolve("Crown finish");
        }.bind(this)
      );
      if (!mayPlayTreasure) {
        clearFunc();
        resolve("no treasure");
      }
    });
  }
}

class Forum extends Card {
  constructor() {
    super("Forum", new Cost(5), `${Card.Type.ACTION}`, "Empires/");
  }
  async play() {
    await drawNCards(3);
    await getBasicStats().addAction(1);
    await this.play_step1();
  }
  play_step1() {
    if (getHand().getLength() < 2) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      this.card_list = [];
      setInstruction("Discard 2 cards");
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        setInstruction("");
        getButtonPanel().clear_buttons();
        getHand().remove_mark();
      };

      getButtonPanel().add_button(
        "Confirm Discard",
        async function () {
          if (this.chosen < 2) return;
          await discardCardList(this.card_list);

          clearFunc();
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
  async is_gained() {
    await getBasicStats().addBuy(1);
  }
}

class Groundskeeper extends Card {
  constructor() {
    super("Groundskeeper", new Cost(5), `${Card.Type.ACTION}`, "Empires/");
    this.activate_when_in_play = true;
    this.activate_when_gain = true;
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);
  }
  should_activate(reason, card) {
    return (
      reason === REASON_WHEN_GAIN && getType(card).includes(Card.Type.VICTORY)
    );
  }
  async activate(reason, card) {
    await getBasicStats().addVictoryToken(1);
  }
}

class Legionary extends Card {
  constructor() {
    super(
      "Legionary",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.ATTACK}`,
      "Empires/"
    );
  }
  async play() {
    await getBasicStats().addCoin(3);

    await this.play_step1();
  }
  play_step1() {
    if (getHand().getLength() <= 0) return;
    if (!getHand().has_card((card) => card.name === "Gold")) return;

    return new Promise((resolve) => {
      setInstruction("You may reveal a Gold from your hand");
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };

      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve();
      });
      let contain_gold = getHand().mark_cards(
        function (card) {
          return card.name === "Gold";
        },
        async function (card) {
          clearFunc();
          await reveal_card(card);

          await this.attack();

          resolve();
        }.bind(this),
        "choose"
      );

      if (!contain_gold) {
        clearFunc();
        resolve();
      }
    });
  }
  async attack() {
    await attack_other(this);
  }
  async is_attacked() {
    if (getHand().getLength() > 2) {
      await new Promise((resolve) => {
        let chosen = 0;
        let discardList = [];
        let n = Math.max(getHand().length() - 2, 0);
        setInstruction("Discard down to 2 cards in hand");
        let clearFunc = function () {
          getButtonPanel().clear_buttons();
          getHand().remove_mark();
          setInstruction("");
        };

        getButtonPanel().clear_buttons();
        getButtonPanel().add_button("Discard", async function () {
          if (chosen < n) return;
          clearFunc();

          await discardCardList(discardList);
          resolve("Legionary finish");
        });
        getHand().mark_cards(
          function (card) {
            return chosen < n;
          },
          function (card) {
            if (chosen < n) {
              chosen += 1;
              discardList.push(card);
            }
          },
          "discard"
        );
      });
    }

    await draw1();
  }
}

class WildHunt extends Card {
  constructor() {
    super(
      "WildHunt",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.GATHERING}`,
      "Empires/"
    );
  }
  play() {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      let WHpile = findSupplyPile((pile) => pile.getName() === "WildHunt");
      if (!WHpile) {
        resolve();
        return;
      }

      getButtonPanel().add_button("+3 Cards", async function () {
        getButtonPanel().clear_buttons();
        await drawNCards(3);
        if (WHpile) {
          await WHpile.setVictoryToken(WHpile.getVictoryToken() + 1);
        }
        resolve();
      });

      getButtonPanel().add_button("Gain an Estate", async function () {
        getButtonPanel().clear_buttons();
        let estate = await gain_card_name("Estate");
        if (estate) {
          await getBasicStats().addVictoryToken(WHpile.getVictoryToken());
          await WHpile.setVictoryToken(0);
        }
        resolve();
      });
    });
  }
}

//Split - Castle
class HumbleCastle extends Card {
  constructor() {
    super(
      "HumbleCastle",
      new Cost(3),
      `${Card.Type.TREASURE} ${Card.Type.VICTORY} ${Card.Type.CASTLE}`,
      "Empires/Castles/"
    );
  }
  createSplitPile() {
    if (opponentManager.getOpponentList().length < 2) {
      return [
        new KingsCastle(),
        new GrandCastle(),
        new SprawlingCastle(),
        new OpulentCastle(),
        new HauntedCastle(),
        new SmallCastle(),
        new CrumblingCastle(),
        new HumbleCastle(),
      ];
    }
    return [
      new KingsCastle(),
      new KingsCastle(),
      new GrandCastle(),
      new SprawlingCastle(),
      new OpulentCastle(),
      new OpulentCastle(),
      new HauntedCastle(),
      new SmallCastle(),
      new SmallCastle(),
      new CrumblingCastle(),
      new HumbleCastle(),
      new HumbleCastle(),
    ];
  }
  async play() {
    await getBasicStats().addCoin(1);
  }
  async is_gained() {
    await this.add_score();
  }
  async add_score() {
    let castleCount = getPlayer().all_cards.filter((card) =>
      getType(card).includes(Card.Type.CASTLE)
    ).length;
    await getBasicStats().addScore(castleCount);
  }
}
class CrumblingCastle extends Card {
  constructor() {
    super(
      "CrumblingCastle",
      new Cost(4),
      `${Card.Type.VICTORY} ${Card.Type.CASTLE}`,
      "Empires/Castles/"
    );
    this.activate_when_trash = true;
  }
  async play() {}
  async is_gained() {
    await this.add_score();
    await getBasicStats().addVictoryToken(1);
    await gain_card_name("Silver");
  }
  async add_score() {
    await getBasicStats().addScore(1);
  }
  should_activate(reason, card) {
    return reason === REASON_WHEN_TRASH && card && card.id === this.id;
  }
  async activate(reason, card) {
    await getBasicStats().addVictoryToken(1);
    await gain_card_name("Silver");
  }
}
class SmallCastle extends Card {
  constructor() {
    super(
      "SmallCastle",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.VICTORY} ${Card.Type.CASTLE}`,
      "Empires/Castles/"
    );
  }
  play() {
    return new Promise(async (resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
        getPlayField().remove_mark();
      };
      let trashSmallCastle = async function () {
        clearFunc();
        let removed = await getPlayField().removeCardById(this.id);
        if (removed) {
          await trash_card(this, false);

          await gainCardByType(Card.Type.CASTLE);
        }

        resolve();
      }.bind(this);
      getButtonPanel().clear_buttons();
      setInstruction("Trash Small Castle or a Castle from your hand");

      getButtonPanel().add_button("Trash Small Castle", async function () {
        await trashSmallCastle();
      });

      getPlayField().mark_cards(
        function (card) {
          return card.id === this.id;
        }.bind(this),
        async function (card) {
          clearFunc();
          let removed = await getPlayField().removeCardById(card.id);
          if (removed) {
            await trash_card(card, false);

            await gainCardByType(Card.Type.CASTLE);
          }

          resolve();
        },
        "trash"
      );

      let contain_castle = getHand().mark_cards(
        function (card) {
          return getType(card).includes(Card.Type.CASTLE);
        },
        async function (card) {
          clearFunc();
          let removed = await getHand().removeCardById(card.id);
          if (removed) {
            await trash_card(card, false);

            await gainCardByType(Card.Type.CASTLE);
          }
          resolve();
        },
        "trash"
      );

      if (!contain_castle) {
        await trashSmallCastle();
      }
    });
  }
  async is_gained() {
    await this.add_score();
  }
  async add_score() {
    await getBasicStats().addScore(2);
  }
}

class HauntedCastle extends Card {
  constructor() {
    super(
      "HauntedCastle",
      new Cost(6),
      `${Card.Type.VICTORY} ${Card.Type.CASTLE}`,
      "Empires/Castles/"
    );
  }
  async play() {}
  async is_gained() {
    await this.add_score();
    if (
      getPlayer().phase === PHASE_REACTION ||
      getPlayer().phase === PHASE_WAITING
    )
      return;

    await gain_card_name("Gold");

    let res = await message_other(this, "is_gained");
  }
  async receive_message(mess) {
    if (getHand().getLength() < 5) return;

    await new Promise((resolve) => {
      setInstruction("HauntedCastle: Put 2 cards onto your deck.");
      let chosen = 0;
      let cardList = [];
      let clearFunc = function () {
        setInstruction("");
        getHand().remove_mark();
      };

      getHand().mark_cards(
        function (card) {
          return chosen < 2;
        },
        async function (card) {
          chosen += 1;
          cardList.push(card);
          if (chosen !== 2) return;

          clearFunc();
          for (let card1 of cardList) {
            let removed = await getHand().removeCardById(card1.id);
            if (removed) await getDeck().topDeck(card1);
          }

          resolve();
        },
        "discard"
      );
    });

    return "done";
  }
  async add_score() {
    await getBasicStats().addScore(2);
  }
}
class OpulentCastle extends Card {
  constructor() {
    super(
      "OpulentCastle",
      new Cost(7),
      `${Card.Type.ACTION} ${Card.Type.VICTORY} ${Card.Type.CASTLE}`,
      "Empires/Castles/"
    );
  }
  play() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      let cardList = [];
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Discard any number of Victory cards, revealed");

      getButtonPanel().add_button("OK", async function () {
        clearFunc();
        if (cardList.length > 0) {
          await revealCardList(cardList);
          await discardCardList(cardList);
          await getBasicStats().addCoin(2 * cardList.length);
        }

        resolve();
      });

      let contain_victory = getHand().mark_cards(
        function (card) {
          return getType(card).includes(Card.Type.VICTORY);
        },
        async function (card) {
          cardList.push(card);
        },
        "discard"
      );
      if (!contain_victory) {
        clearFunc();
        resolve();
      }
    });
  }
  async is_gained() {
    await this.add_score();
  }
  async add_score() {
    await getBasicStats().addScore(3);
  }
}
class SprawlingCastle extends Card {
  constructor() {
    super(
      "SprawlingCastle",
      new Cost(8),
      `${Card.Type.VICTORY} ${Card.Type.CASTLE}`,
      "Empires/Castles/"
    );
  }
  async play() {}
  async is_gained() {
    await this.add_score();
    await new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Gain a Duchy or 3 Estates");

      getButtonPanel().add_button("Gain Duchy", async function () {
        clearFunc();
        await gain_card_name("Duchy");
        resolve();
      });

      getButtonPanel().add_button("Gain 3 Estates", async function () {
        clearFunc();
        await gain_card_name("Estate");
        await gain_card_name("Estate");
        await gain_card_name("Estate");
        resolve();
      });
    });
  }
  async add_score() {
    await getBasicStats().addScore(4);
  }
}
class GrandCastle extends Card {
  constructor() {
    super(
      "GrandCastle",
      new Cost(9),
      `${Card.Type.VICTORY} ${Card.Type.CASTLE}`,
      "Empires/Castles/"
    );
  }
  async play() {}
  async is_gained() {
    await this.add_score();
    if (getHand().getLength() > 0) await revealCardList(getHand().getCardAll());

    let victoryCount =
      getHand()
        .getCardAll()
        .filter((card) => getType(card).includes(Card.Type.VICTORY)).length +
      getPlayField()
        .getCardAll()
        .filter((card) => getType(card).includes(Card.Type.VICTORY)).length;
    await getBasicStats().addVictoryToken(victoryCount);
  }
  async add_score() {
    await getBasicStats().addScore(5);
  }
}
class KingsCastle extends Card {
  constructor() {
    super(
      "KingsCastle",
      new Cost(10),
      `${Card.Type.VICTORY} ${Card.Type.CASTLE}`,
      "Empires/Castles/"
    );
  }
  async play() {}
  async is_gained() {
    await this.add_score();
  }
  async add_score() {
    let castleCount = getPlayer().all_cards.filter((card) =>
      getType(card).includes(Card.Type.CASTLE)
    ).length;
    await getBasicStats().addScore(castleCount * 2);
  }
}

export {
  CityQuarter,
  Engineer,
  Overlord,
  RoyalBlacksmith,
  Encampment,
  Plunder,
  Patrician,
  Emporium,
  Settlers,
  BustlingVillage,
  Catapult,
  Rocks,
  ChariotRace,
  Enchantress,
  FarmersMarket,
  Gladiator,
  Fortune,
  Sacrifice,
  Temple,
  Villa,
  Archive,
  Capital,
  Charm,
  Crown,
  Forum,
  Groundskeeper,
  Legionary,
  WildHunt,
  HumbleCastle,
  CrumblingCastle,
  SmallCastle,
  HauntedCastle,
  OpulentCastle,
  SprawlingCastle,
  GrandCastle,
  KingsCastle,
};
