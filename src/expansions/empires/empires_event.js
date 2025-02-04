import { Card, Cost } from '../cards.js';
import { Event } from "../landscape_effect.js";
import { REASON_START_TURN, REASON_WHEN_GAIN } from '../../game_logic/ReactionEffectManager.js';

import { getHand } from '../../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getButtonPanel } from '../../features/PlayerSide/ButtonPanel.jsx';
import {
  drawNCards,
  gain_card, gain_card_name, shuffleCardsIntoDeck, shuffleDeck, trash_card,
} from '../../game_logic/Activity.js';
import { getDeck, getDiscard } from '../../features/PlayerSide/CardPile/CardPile.jsx';
import { getBasicStats } from '../../features/PlayerSide/PlayerSide.jsx';
import { getGameState } from '../../game_logic/GameState.js';
import { getSupportHand } from '../../features/SupportHand.jsx';
import { markSupplyPile, removeMarkSupplyPile } from '../../features/TableSide/Supply.jsx';
import { findSupplyPile, findSupplyPileAll } from '../../features/TableSide/SupplyPile.jsx';
import { getPlayer } from '../../player.js';
import { PHASE_BUY } from '../../utils/constants.js';
import { setInstruction } from '../../features/PlayerSide/Instruction.jsx';
/*
class  extends Event{
    constructor(player){
        super('', , "Empires/Event/", player);
    }
    is_buyed(){

    }
}
*/

class Triumph extends Event {
  constructor(player) {
    super("Triumph", new Cost(0, 5), "Empires/Event/", player);
    this.description = "Gain an Estate. If you did, +1 VP per card you've gained this turn.";
  }
  async is_buyed() {
    let estate = await gain_card_name("Estate");
    if (estate) {
      let card_gained_count = getGameState().cards_gained_this_turn.length;
      await getBasicStats().addVictoryToken(card_gained_count)

    }
  }
}
class Annex extends Event {
  constructor(player) {
    //Debt
    super("Annex", new Cost(0, 8), "Empires/Event/", player);
    this.description =
      "Look through your discard pile. Shuffle all but up to 5 cards from it into your deck. Gain a Duchy.";
  }
  async is_buyed() {
    if (getDiscard().getLength() <= 0) return;
    this.chosen = 0;
    this.card_list = [];
    return new Promise(async (resolve) => {
      let supportHand = getSupportHand();
      supportHand.clear();

      while (getDiscard().getLength() > 0) {
        await supportHand.addCard(await getDiscard().pop());
      }
      supportHand.getCardAll().forEach((card) => (card.annex = false));

      let cardList = [];
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction('');
        supportHand.remove_mark();
      }
      getButtonPanel().clear_buttons();
      setInstruction('Annex: Shuffle all but up to 5 cards from discard pile into your deck.');

      getButtonPanel().add_button(
        "OK",
        async function () {
          clearFunc();
          for (let card of supportHand.getCardAll()) {
            if (!card.annex) {
              cardList.push(card);
            }
          }

          await shuffleCardsIntoDeck(cardList);

          await supportHand.setCardAll(supportHand.getCardAll().filter((card) => card.annex));
          await getDiscard().addCardList(supportHand.getCardAll());
          supportHand.clear();
          supportHand.hide();

          await gain_card_name("Duchy");
          resolve("Annex finish");
        }
      );

      supportHand.mark_cards(
        function (card) {
          return this.chosen < 5 && this.card_list.length < 5;
        }.bind(this),
        function (card) {
          card.annex = true;
          this.chosen += 1;
          this.card_list.push(card);
        }.bind(this),
        'discard',
      );
    });
  }
}
class Donate extends Event {
  constructor(player) {
    super("Donate", new Cost(0, 8), "Empires/Event/", player);
    this.activate_when_start_turn = true;
    this.activate_currently = false;
    this.turn = -1;
    this.description = "At the start of your next turn, first, put your deck and discard pile into your hand, trash any number of cards from it, then shuffle the rest into your deck and draw 5 cards.";
  }
  is_buyed() {
    this.activate_currently = true;
    this.turn = getPlayer().turn;
  }
  should_activate(reason, card) {
    if (this.turn + 1 !== getPlayer().turn) {
      this.activate_currently = false;
      return false;
    }
    return reason === REASON_START_TURN;
  }
  async activate() {
    this.activate_currently = false;
    getButtonPanel().clear_buttons();
    await getHand().addCardList(getDeck().getCardAll());
    await getDeck().setCardAll([])
    await getHand().addCardList(getDiscard().getCardAll());
    await getDiscard().setCardAll([]);
    return new Promise((resolve) => {
      this.chosen = 0;
      this.card_list = [];

      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        setInstruction('');
        await getHand().remove_mark();
      }
      getButtonPanel().clear_buttons();
      setInstruction('Donate: Trash any number of cards, then shuffle the rest into your deck.');

      getButtonPanel().add_button(
        "Confirm Trashing",
        async function () {
          if (this.card_list.length > 0) {
            for (let i = 0; i < this.card_list.length; i++) {
              let card = this.card_list[i];
              await trash_card(card);
            }
          }
          await this.activate_step1();
          await clearFunc();
          resolve("Donate finish");
        }.bind(this)
      );

      getHand().mark_cards(
        function () {
          return true;
        },
        function (card) {
          this.chosen += 1;
          this.card_list.push(card);
        }.bind(this),
        "trash"
      );
    });
  }
  async activate_step1() {
    await getDeck().setCardAll(getHand().getCardAll());
    await getHand().setCardAll([]);
    await shuffleDeck();
    await drawNCards(5);
  }
}
class Advance extends Event {
  constructor(player) {
    super("Advance", new Cost(0), "Empires/Event/", player);
    this.description =
      "You may trash an Action card from your hand. If you do, gain an Action card costing up to $6.";
  }
  is_buyed() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      this.card = null;
      this.chosen = 0;

      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        await getHand().remove_mark();
      }

      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Confirm Trashing",
        async function () {
          if (this.chosen === 1 && this.card) {
            await trash_card(this.card);
            await clearFunc();
            await this.is_buyed_step1();
          }

          resolve("Advance finish");
        }.bind(this)
      );

      getHand().mark_cards(
        function (card) {
          return (
            this.chosen === 0 &&
            !this.card &&
            card.type.includes(Card.Type.ACTION)
          );
        }.bind(this),
        function (card) {
          if (this.chosen === 0) {
            this.chosen += 1;
            this.card = card;
          }
        }.bind(this),
        "trash"
      );
    });
  }
  is_buyed_step1() {
    let chosen = 0;
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          let cost = new Cost(6);
          return (
            pile.getType().includes(Card.Type.ACTION) &&
            cost.isGreaterOrEqual(pile.getCost()) &&
            pile.getQuantity() > 0 &&
            chosen === 0
          );
        },
        async function (pile) {
          chosen += 1;
          await gain_card(pile);

          removeMarkSupplyPile();
          resolve("Advance buyed step 1 finish");
        }
      );
    });
  }
}
class Delve extends Event {
  constructor(player) {
    super("Delve", new Cost(2), "Empires/Event/", player);
  }
  async is_buyed() {
    await getBasicStats().addBuy(1);
    await gain_card_name("Silver");
  }
}
class Tax extends Event {
  constructor(player) {
    super("Tax", new Cost(2), "Empires/Event/", player);
    this.activate_when_gain = true;
    this.activate_permanently = true;
    this.description = "Add 2D to a Supply pile.Setup: Add 1D to each Supply pile. When a player gains a card in their Buy phase, they take the D from its pile.";
  }
  async setup() {
    for (let pile of findSupplyPileAll(p => true)) {
      await pile.setDebtToken(pile.getDebtToken() + 1);
    }
  }

  is_buyed() {
    return new Promise((resolve) => {
      markSupplyPile(
        p => true,
        async function (pile) {
          await pile.setDebtToken(pile.getDebtToken() + 2);
          removeMarkSupplyPile();
          resolve('Tax finish');
        }
      );
    });
  }
  should_activate(reason, card) {
    return reason === REASON_WHEN_GAIN
      && card
      && getPlayer().phase === PHASE_BUY
      && findSupplyPile(pile => pile.isOriginOf(card))
      && findSupplyPile(pile => pile.isOriginOf(card)).getDebtToken() > 0;
  }
  async activate(reason, card) {
    if (!card) return;
    let pile = findSupplyPile(pile => pile.isOriginOf(card));
    if (!pile || pile.getDebtToken() <= 0) return;
    await getBasicStats().addDebt(pile.getDebtToken());
    await pile.setDebtToken(0);
  }
}
class Banquet extends Event {
  constructor(player) {
    super("Banquet", new Cost(3), "Empires/Event/", player);
    this.description =
      "Gain 2 Coppers and a non-Victory card costing up to $5.";
  }
  is_buyed() {
    return new Promise(async (resolve) => {
      getButtonPanel().clear_buttons();
      await gain_card_name("Copper");
      await gain_card_name("Copper");
      let chosen = 0;
      markSupplyPile(
        function (pile) {
          let cost = new Cost(5);
          return (
            cost.isGreaterOrEqual(pile.getCost()) &&
            pile.getQuantity() > 0 &&
            !pile.getType().includes(Card.Type.VICTORY) &&
            chosen === 0
          );
        },
        async function (pile) {
          chosen += 1;
          await gain_card(pile);
          removeMarkSupplyPile();
          resolve("Banquet finish");
        }
      );
    });
  }
}
class Ritual extends Event {
  constructor(player) {
    super("Ritual", new Cost(4), "Empires/Event/", player);
    this.description =
      "Gain a Curse. If you do, trash a card from your hand. +1 VP per $1 it cost.";
  }
  async is_buyed() {
    let curse = await gain_card_name("Curse");
    if (curse) {
      await this.is_buyed_step1();
    }
  }
  is_buyed_step1() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      this.trash_card = null;

      getHand().mark_cards(
        function (card) {
          return this.chosen === 0;
        }.bind(this),
        async function (card) {
          this.chosen += 1;
          let card_cost = card.cost.getCoin();

          await getHand().remove_mark();
          await trash_card(card);
          await getBasicStats().setVictoryToken(getBasicStats().getVictoryToken + card_cost);
          resolve('Ritual is buyed step 1 finish');
        }.bind(this),
        "trash"
      );
    });
  }
}

class Salt_the_Earth extends Event {
  constructor(player) {
    super("Salt_the_Earth", new Cost(4), "Empires/Event/", player);
    this.description = "+1 VP Trash a Victory card from the Supply.";
  }
  is_buyed() {
    return new Promise(async (resolve) => {
      await getBasicStats().addVictoryToken(1);
      let chosen = 0;
      let is_marked = markSupplyPile(
        function (pile) {
          return pile.getQuantity() > 0 && pile.getType().includes(Card.Type.VICTORY) && chosen === 0;
        },
        async function (pile) {
          chosen += 1;
          removeMarkSupplyPile();
          let card = await pile.popNextCard();
          await trash_card(card, false);
          resolve("Salt the Earth finish");
        }
      );
      if (!is_marked) {
        removeMarkSupplyPile();
        resolve("Salt the Earth finish");
      }
    });
  }
  async add_score() {
    await getBasicStats().addScore(1);
  }
}
class Wedding extends Event {
  constructor(player) {
    //Debt
    super("Wedding", new Cost(4, 3), "Empires/Event/", player);
    this.description = "+1 VP Gain a Gold.";
  }
  async is_buyed() {
    await getBasicStats().addVictoryToken(1);
    await gain_card_name("Gold");
  }
}
class Windfall extends Event {
  constructor(player) {
    super("Windfall", new Cost(5), "Empires/Event/", player);
    this.description = "If your deck and discard pile are empty, gain 3 Golds.";
  }
  async is_buyed() {
    if (getDeck().getLength() === 0 && getDiscard().length() === 0) {
      await gain_card_name("Gold");
      await gain_card_name("Gold");
      await gain_card_name("Gold");
    }
  }
}
class Conquest extends Event {
  constructor(player) {
    super("Conquest", new Cost(6), "Empires/Event/", player);
    this.description =
      "Gain 2 Silvers. +1 VP per Silver you've gained this turn.";
  }
  async is_buyed() {
    await gain_card_name("Silver");
    await gain_card_name("Silver");
    let silver_count = getGameState().cards_gained_this_turn.filter(
      (c) => c.name === "Silver"
    ).length;
    await getBasicStats().addVictoryToken(silver_count);
  }
}
class Dominate extends Event {
  constructor(player) {
    super("Dominate", new Cost(14), "Empires/Event/", player);
    this.description = "Gain a Province. If you do, +9 VP.";
  }
  async is_buyed() {
    let province = await gain_card_name("Province");
    if (province) {
      await getBasicStats().addVictoryToken(9);
    }
  }
}

export {
  Triumph,
  Annex,
  Donate,
  Advance,
  Delve,
  Tax,
  Banquet,
  Ritual,
  Salt_the_Earth,
  Wedding,
  Windfall,
  Conquest,
  Dominate,
};
