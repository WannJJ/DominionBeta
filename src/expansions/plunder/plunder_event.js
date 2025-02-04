import { Card, Cost } from "../cards.js";
import { Event } from "../landscape_effect.js";
import {
  REASON_SHUFFLE,
  REASON_START_TURN,
  REASON_END_TURN,
  REASON_WHEN_GAIN,
} from "../../game_logic/ReactionEffectManager.js";

import {
  markSupplyPile,
  removeMarkSupplyPile,
} from "../../features/TableSide/Supply.jsx";
import { getPlayer } from "../../player.js";
import { getHand } from "../../features/PlayerSide/CardHolder/CardHolder.jsx";
import {
  getDiscard,
  getDeck,
  getTrash,
} from "../../features/PlayerSide/CardPile/CardPile.jsx";
import { getSetAside } from "../../features/PlayerSide/BottomLeftCorner/SideArea.jsx";

import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";
import { getSupportHand } from "../../features/SupportHand.jsx";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import {
  draw1,
  drawNCards,
  play_card,
  gain_card,
  gain_card_name,
  gain_card_from_trash,
  discard_card,
  trash_card,
  set_aside_card,
  attack_other,
  gainCardByType,
  mayPlayCardFromHand,
} from "../../game_logic/Activity.js";

/*
class  extends Event{
    constructor(player){
        super('', , "Plunder/Event/", player);
    }
    is_buyed(){

    } 
}
*/
class Bury extends Event {
  constructor(player) {
    super("Bury", new Cost(1), "Plunder/Event/", player);
  }
  async is_buyed() {
    await getBasicStats().addBuy(1);
    if (getDiscard().length() <= 0) return;
    return new Promise(async (resolve) => {
      let chosen = 0;
      let supportHand = getSupportHand();
      supportHand.clear();
      while (getDiscard().length() > 0) {
        await supportHand.addCard(await getDiscard().pop());
      }
      supportHand.getCardAll().forEach((card) => (card.bury = undefined));

      supportHand.mark_cards(
        function () {
          return chosen === 0;
        },
        async function (card) {
          supportHand.remove_mark();
          card.bury = true;
          chosen += 1;
          for (let c of supportHand.getCardAll()) {
            if (c.bury) {
              await getDeck().bottomDeck(c);
            }
          }
          await supportHand.setCardAll(
            supportHand.getCardAll().filter((card) => !card.bury)
          );
          await getDiscard().addCardList(supportHand.getCardAll());
          supportHand.clear();
          resolve("Bury finish");
        },
        "choose"
      );
    });
  }
}
class Avoid extends Event {
  constructor(player) {
    super("Avoid", new Cost(2), "Plunder/Event/", player);
    this.turn = -1;
    this.activate_when_shuffle = true;
    this.activate_currently = false;
    this.description =
      "The next time you shuffle this turn, pick up to 3 of those cards to put into your discard pile.";
  }
  async is_buyed() {
    this.activate_currently = true;
    this.turn = getPlayer().turn;
    await getBasicStats().addBuy(1);
  }
  should_activate(reason, cardList) {
    if (getPlayer().turn !== this.turn) {
      this.activate_currently = false;
      return false;
    }
    return (
      reason === REASON_SHUFFLE &&
      cardList &&
      Array.isArray(cardList) &&
      cardList.length > 0
    );
  }
  activate(reason, cardList) {
    this.activate_currently = false;
    if (!cardList || !Array.isArray(cardList)) throw new Error();

    return new Promise(async (resolve) => {
      let supportHand = getSupportHand();
      supportHand.clear();

      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        supportHand.remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "Avoid: Pick up to 3 cards to put into your discard pile."
      );

      await supportHand.addCardList(cardList);

      supportHand.getCardAll().forEach((card) => (card.avoid = false));
      await supportHand.setCardAll(supportHand.getCardAll().reverse());

      let chosen = 0;
      getButtonPanel().add_button("OK", async function () {
        clearFunc();
        for (let c of supportHand.getCardAll()) {
          if (c.avoid) {
            await getDiscard().addCard(c);

            let index = cardList.indexOf(c);
            if (index !== -1) {
              cardList.splice(index, 1);
            }
          }
        }
        await supportHand.setCardAll(
          supportHand.getCardAll().filter((c) => !c.avoid)
        );
        supportHand.clear();
        resolve("Avoid finish");
      });
      supportHand.mark_cards(
        function (card) {
          return chosen < 3 && card.avoid === false;
        },
        async function (card) {
          chosen += 1;
          card.avoid = true;
        },
        "discard"
      );
    });
  }
}
class Deliver extends Event {
  constructor(player) {
    super("Deliver", new Cost(2), "Plunder/Event/", player);
    this.activate_when_end_turn = true;
    this.activate_when_gain = true;
    this.activate_currently = false;
    this.description =
      "This turn, each time you gain a card, set it aside, and put it into your hand at end of turn.";
    this.chosen_id_list = [];
  }
  async is_buyed() {
    this.activate_currently = true;
    this.turn = getPlayer().turn;
    await getBasicStats().addBuy(1);
    this.chosen_id_list = [];
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    if (this.turn !== getPlayer().turn) {
      this.activate_currently = false;
      return false;
    }
    return (
      (reason === REASON_WHEN_GAIN && card) ||
      (reason === REASON_END_TURN && this.chosen_id_list.length > 0)
    );
  }
  async activate(reason, card, activity, cardLocationTrack) {
    if (this.turn !== getPlayer().turn) {
      this.activate_currently = false;
      return false;
    }

    if (reason === REASON_WHEN_GAIN && card && cardLocationTrack) {
      let cardLocation = cardLocationTrack.getLocation();
      if (!cardLocation) return;
      if (cardLocation.getCardById(card.id)) {
        let removed = await cardLocation.removeCardById(card.id);
        if (removed) {
          await set_aside_card(card);
          if (cardLocation.id !== getSetAside().id)
            cardLocationTrack.setLocation();

          this.chosen_id_list.push(card.id);
          this.activate_currently = true;
        }
      }
    } else if (reason === REASON_END_TURN && this.chosen_id_list.length > 0) {
      while (this.chosen_id_list.length > 0) {
        let id = this.chosen_id_list.pop();
        let card = await getSetAside().removeCardById(id);
        if (card) {
          await getHand().addCard(card);
        }
      }
      this.activate_currently = false;
    }
  }
}
class Peril extends Event {
  constructor(player) {
    super("Peril", new Cost(2), "Plunder/Event/", player);
  }
  is_buyed() {
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      let chosen = 0;
      this.card = undefined;
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "You may trash an Action card from your hand to gain a Loot"
      );

      getButtonPanel().add_button("Cancel", async function () {
        clearFunc();
        resolve("Peril finish");
      });

      let is_marked = getHand().mark_cards(
        function (card) {
          return chosen < 1 && card.type.includes("Action");
        },
        async function (card) {
          if (chosen === 0) {
            chosen += 1;
            clearFunc();
            await trash_card(card);
            await gainCardByType(Card.Type.LOOT);
          }
          resolve();
        },
        "trash"
      );

      if (!is_marked) {
        clearFunc();
        resolve("Peril finish");
      }
    });
  }
}
class Rush extends Event {
  constructor(player) {
    super("Rush", new Cost(2), "Plunder/Event/", player);
    this.turn = -1;
    this.activate_when_gain = true;
    this.activate_currently = false;
    this.description =
      "The next time you gain an Action card this turn, play it.";
  }
  async is_buyed() {
    this.activate_currently = true;
    this.turn = getPlayer().turn;
    await getBasicStats().addBuy(1);
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    if (this.turn !== getPlayer().turn) {
      this.activate_currently = false;
      return false;
    }
    return (
      REASON_WHEN_GAIN &&
      this.turn === getPlayer().turn &&
      card &&
      card.type.includes(Card.Type.ACTION)
    );
    //&& getDiscard().has_card(c => c.id === card.id);
  }
  async activate(reason, card, activity, cardLocationTrack) {
    this.activate_currently = false;
    if (!card || !cardLocationTrack) return;
    let cardLocation = cardLocationTrack.getLocation();
    if (!cardLocation || !cardLocation.getCardById(card.id)) return;

    let removed = await cardLocation.removeCardById(card.id);
    if (!removed) return;
    cardLocationTrack.setLocation();
    await play_card(card);
  }
}
class Foray extends Event {
  constructor(player) {
    super("Foray", new Cost(3), "Plunder/Event/", player);
  }
  is_buyed() {
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      let chosen = 0;
      this.card_list = [];
      let n = Math.min(3, getHand().length());
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Discard 3 cards, reveal them.");

      getButtonPanel().add_button(
        "Confirm Discard",
        async function () {
          clearFunc();
          if (this.card_list.length > 0) {
            for (let i = 0; i < this.card_list.length; i++) {
              let card = this.card_list[i];
              await discard_card(card);
            }
          }
          await drawNCards(chosen);
          resolve("Foray finish");
        }.bind(this)
      );

      let is_marked = getHand().mark_cards(
        function () {
          return chosen < n;
        },
        async function (card) {
          chosen += 1;
          this.card_list.push(card);

          if (chosen === n) {
            let card_names = [];
            for (let i = 0; i < this.card_list.length; i++) {
              let card = this.card_list[i];
              await discard_card(card);
              if (!card_names.includes(card.name)) {
                card_names.push(card.name);
              }
            }
            if (n === 3 && card_names.length === 3) {
              clearFunc();
              await gainCardByType(Card.Type.LOOT);
            }
            resolve("Foray finish");
          }
        }.bind(this),
        "discard"
      );
      if (!is_marked) {
        clearFunc();
        resolve("Foray finish");
        return;
      }
    });
  }
}
class Launch extends Event {
  constructor(player) {
    super("Launch", new Cost(3), "Plunder/Event/", player);
    this.description =
      "Once per turn: Return to your Action phase. +1 Card, +1 Action, and +1 Buy.";
    this.last_turn = -1;
  }
  async is_buyed() {
    if (this.last_turn < getPlayer().turn) {
      this.last_turn = getPlayer().turn;

      await draw1();
      await getBasicStats().addAction(1);
      await getBasicStats().addBuy(1);
      getPlayer().start_action_phase();
    }
  }
}
class Mirror extends Event {
  constructor(player) {
    super("Mirror", new Cost(3), "Plunder/Event/", player);
    this.turn = -1;
    this.activate_when_gain = true;
    this.activate_currently = false;
    this.description =
      "The next time you gain an Action card this turn, gain a copy of it.";
  }
  async is_buyed() {
    await getBasicStats().addBuy(1);
    this.activate_currently = true;
    this.turn = getPlayer().turn;
  }
  should_activate(reason, card) {
    if (this.turn !== getPlayer().turn) {
      this.activate_currently = false;
      return false;
    }
    return (
      reason === REASON_WHEN_GAIN &&
      card &&
      card.type.includes(Card.Type.ACTION) &&
      this.turn === getPlayer().turn
    );
  }
  async activate(reason, card) {
    this.activate_currently = false;
    if (reason === REASON_WHEN_GAIN && card && card.name) {
      await gain_card_name(card.name);
    }
  }
}
class Prepare extends Event {
  constructor(player) {
    super("Prepare", new Cost(3), "Plunder/Event/", player);
    this.activate_when_start_turn = true;
    this.activate_currently = false;
    this.chosen_id_list = [];
    this.description =
      "Set aside your hand face up. At the start of your next turn, play those Actions and Treasures in any order, then discard the rest.";
  }
  async is_buyed() {
    if (getHand().length() <= 0) return;
    this.chosen_id_list = [];
    while (getHand().length() > 0) {
      let card = await getHand().pop();
      this.chosen_id_list.push(card.id);
      await set_aside_card(card);
      this.activate_currently = true;
    }
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN && this.chosen_id_list.length > 0;
  }
  async activate(reason, card) {
    this.activate_currently = false;
    if (!this.chosen_id_list.length > 0) return;
    let card_list = [];
    while (this.chosen_id_list.length > 0) {
      let id = this.chosen_id_list.pop();
      let card = await getSetAside().removeCardById(id);
      if (card.type.includes("Action") || card.type.includes("Treasure")) {
        card_list.push(card);
      } else {
        await discard_card(card, false);
      }
    }
    while (card_list.length > 0) {
      if (card_list.length === 1) {
        let card = card_list.pop();
        await play_card(card);
      } else {
        await this.activate_step1(card_list);
      }
    }
  }
  activate_step1(card_list) {
    return new Promise((resolve) => {
      for (let i = 0; i < card_list.length; i++) {
        let card = card_list[i];
        getButtonPanel().clear_buttons();
        getButtonPanel().add_button(`Play ${card.name}`, async function () {
          getButtonPanel().clear_buttons();
          await play_card(card);
          let index = card_list.indexOf(card);
          if (index !== -1) {
            card_list.splice(index, 1);
          }
          resolve();
        });
      }
    });
  }
}
class Scrounge extends Event {
  constructor(player) {
    super("Scrounge", new Cost(3), "Plunder/Event/", player);
    this.description =
      "Choose one: Trash a card from your hand; or gain an Estate from the trash, and if you did, gain a card costing up to $5.";
  }
  is_buyed() {
    getButtonPanel().clear_buttons();
    let clearFunc = function () {
      getHand().remove_mark();
      getButtonPanel().clear_buttons();
    };
    return new Promise((resolve) => {
      let sufficient = false;
      if (getHand().length() > 0) {
        sufficient = true;
        let chosen = 0;
        this.trash_card = null;
        getHand().mark_cards(
          function (card) {
            return chosen === 0;
          },
          async function (card) {
            clearFunc();
            chosen += 1;
            await trash_card(card);
            resolve("Scrounge finish");
          },
          "trash"
        );
      }
      if (getTrash().length() > 0) {
        if (getTrash().has_card((card) => card.name === "Estate")) {
          sufficient = true;
          let estate = getTrash()
            .getCardAll()
            .find((card) => card.name === "Estate");
          if (!estate) throw new Error("ERROR! No estate found in trash");
          getButtonPanel().add_button(
            "Gain Estate from trash",
            async function () {
              clearFunc();
              await gain_card_from_trash(estate);
              await this.is_buyed_step1();
              resolve("Scrounge finish");
            }.bind(this)
          );
        }
      }
      if (!sufficient) {
        resolve("Scrounge finish");
      }
    });
  }
  is_buyed_step1() {
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          let cost = new Cost(5);
          return (
            cost.isGreaterOrEqual(pile.getCost()) && pile.getQuantity() > 0
          );
        },
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve("Scrounge step 1 finish");
        }
      );
    });
  }
}
class Journey extends Event {
  constructor(player) {
    super("Journey", new Cost(4), "Plunder/Event/", player);
    this.description =
      "You don't discard cards from play in Clean-up this turn. Take an extra turn after this one (but not a 3rd turn in a row).";
  }
  is_buyed() {
    //TODO
  }
}
class Maelstrom extends Event {
  constructor(player) {
    super("Maelstrom", new Cost(4), "Plunder/Event/", player);
    this.description =
      "Trash 3 cards from your hand. Each other player with 5 or more cards in hand trashes one of them.";
  }
  is_buyed() {
    if (getHand().length() < 3) return;
    return new Promise((resolve) => {
      let chosen = 0;
      let cardList = [];
      let n = Math.min(getHand().length(), 3);

      getHand().mark_cards(
        function (card) {
          return chosen < n;
        },
        async function (card) {
          if (chosen < n) {
            chosen += 1;
            cardList.push(card);
          }
          if (chosen === n) {
            getHand().remove_mark();
            for (let card of cardList) {
              await trash_card(card);
            }
            await this.attack();

            resolve("Maelstrom finish");
          }
        }.bind(this),
        "trash"
      );
    });
  }
  async attack() {
    await attack_other(this);
  }
  is_attacked() {
    if (getHand().getLength() < 5) return;
    return new Promise((resolve) => {
      let chosen = 0;
      let clearFunc = function () {
        getHand().remove_mark();
        setInstruction("");
      };
      setInstruction("Trash a card from your hand");

      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          clearFunc();
          chosen += 1;
          await trash_card(card);
          resolve();
        },
        "trash"
      );
    });
  }
}
class Looting extends Event {
  constructor(player) {
    super("Looting", new Cost(6), "Plunder/Event/", player);
  }
  async is_buyed() {
    await gainCardByType(Card.Type.LOOT);
  }
}
class Invasion extends Event {
  constructor(player) {
    super("Invasion", new Cost(10), "Plunder/Event/", player);
  }
  async is_buyed() {
    await this.play_step1();
    await gain_card_name("Duchy");
    await this.play_step2();
    let new_loot = await gainCardByType(Card.Type.LOOT);
    if (!new_loot) return;
    let removed = await getDiscard().removeCardById(new_loot.id);
    if (removed) await play_card(new_loot);
  }
  play_step1() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");

        getSupportHand().clear();
        getSupportHand().hide();
        getDeck().removeCanSelect();
      };
      getButtonPanel().clear_buttons();
      setInstruction("Invasion: You may play an Attack from your hand.");

      let mayPlayAttack = mayPlayCardFromHand(
        (card) => card.type.includes(Card.Type.ATTACK),
        async function (card) {
          clearFunc();
          await play_card(card);

          resolve("Invasion step 1 finish");
        }
      );
      if (!mayPlayAttack) {
        clearFunc();
        resolve("Invasion step 1 finish");
      }

      /*
            getHand().mark_cards(card => card.type.includes('Attack'), async function(card){
                clearFunc();
                await getHand().remove(card);
                await play_card(card, true);
                
                resolve('Invasion step 1 finish');
            });
            */

      getButtonPanel().add_button("Don't play", async function () {
        clearFunc();
        resolve("Invasion step 1 finish");
      });
    });
  }
  play_step2() {
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 && pile.getType().includes(Card.Type.ACTION)
          );
        },
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile, getDeck());
          resolve("Invasion step 2 finish");
        }
      );
    });
  }
}
class Prosper extends Event {
  constructor(player) {
    super("Prosper", new Cost(10), "Plunder/Event/", player);
  }
  async is_buyed() {
    await gainCardByType(Card.Type.LOOT);
    await this.play_step1();
  }
  play_step1() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        removeMarkSupplyPile();
      };
      getButtonPanel().clear_buttons();
      setInstruction("Gain any number of differently named Treasures");

      getButtonPanel().add_button("OK", function () {
        clearFunc();
        resolve();
      });

      let treasureNameList = [];
      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 &&
            pile.getType().includes(Card.Type.TREASURE) &&
            !treasureNameList.includes(pile.getName())
          );
        },
        async function (pile) {
          if (treasureNameList.includes(pile.getName())) return;
          treasureNameList.push(pile.getName());
          await gain_card(pile);
        }
      );
    });
  }
}

export {
  Bury,
  Avoid,
  Deliver,
  Peril,
  Rush,
  Foray,
  Launch,
  Mirror,
  Prepare,
  Scrounge,
  Journey,
  Maelstrom,
  Looting,
  Invasion,
  Prosper,
};
