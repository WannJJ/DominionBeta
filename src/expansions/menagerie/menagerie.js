import { Card, Cost } from "../cards.js";
import {
  REASON_START_TURN,
  REASON_WHEN_PLAY,
  REASON_WHEN_GAIN,
  REASON_WHEN_ANOTHER_GAIN,
  effectBuffer,
} from "../../game_logic/ReactionEffectManager.js";
import { getPlayer } from "../../player.js";
import {
  markSupplyPile,
  removeMarkSupplyPile,
} from "../../features/TableSide/Supply.jsx";
import {
  findSupplyPile,
  findSupplyPileAll,
} from "../../features/TableSide/SupplyPile.jsx";
import { findNonSupplyPile } from "../../features/TableSide/NonSupplyPile.jsx";
import {
  getPlayField,
  getHand,
} from "../../features/PlayerSide/CardHolder/CardHolder.jsx";
import {
  getDiscard,
  getDeck,
} from "../../features/PlayerSide/CardPile/CardPile.jsx";
import { getExile } from "../../features/PlayerSide/BottomLeftCorner/SideArea.jsx";
import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";
import { getSupportHand } from "../../features/SupportHand.jsx";
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
  exile_card,
  attack_other,
  mayPlayCardFromHand,
} from "../../game_logic/Activity.js";
import {
  PHASE_ACTION,
  PHASE_BUY,
  PHASE_CLEAN_UP,
  PHASE_REACTION,
  PHASE_WAITING,
} from "../../utils/constants.js";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import { opponentManager } from "../../features/OpponentSide/Opponent.js";
import audioManager from "../../Audio/audioManager.js";

/*
Mẫu
class  extends Card{
    constructor(player){
        super("", , Card.Type.ACTION, "Menagerie/", player);
    }
    play(){} 
}
*/

class Horse extends Card {
  constructor(player) {
    super("Horse", new Cost(3), Card.Type.ACTION, "Menagerie/", player);
  }
  getInitAmount() {
    return 30;
  }
  async play() {
    await drawNCards(2);
    await getBasicStats().addAction(1);
    audioManager.playSound("horse");

    if (getPlayField().getCardAll().includes(this)) {
      await getPlayField().remove(this);
      let horsePile = findNonSupplyPile((pile) => pile.getName() === "Horse");
      if (horsePile) {
        horsePile.return_card(this);
      }
    }
  }
}
class Supplies extends Card {
  constructor(player) {
    super("Supplies", new Cost(2), Card.Type.TREASURE, "Menagerie/", player);
  }
  async play() {
    await getBasicStats().addCoin(1);
    await getBasicStats().addAction(1);
    let horse = await gain_card_name("Horse", getDeck());
  }
}
class Sleigh extends Card {
  constructor(player) {
    super(
      "Sleigh",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.REACTION,
      "Menagerie/",
      player
    );
    this.activate_when_in_hand = true;
    this.activate_when_gain = true;
    this.description =
      "When you gain a card, you may discard this, to put that card into your hand or onto your deck.";
  }
  async play() {
    await gain_card_name("Horse");
    await gain_card_name("Horse");
  }

  should_activate(reason, card, activity, cardLocationTrack) {
    return reason === REASON_WHEN_GAIN && card;
    //&& getDiscard().has_card(c => c.id === card.id);
  }
  activate(reason, card, activity, cardLocationTrack) {
    if (
      !card ||
      !cardLocationTrack ||
      !getHand().has_card((c) => c.id === this.id)
    )
      return;
    let cardLocation = cardLocationTrack.getLocation();

    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      setInstruction(
        `Sleigh: You may discard Sleigh to put ${card.name} into your hand or onto your deck.`
      );
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().add_button(
        "Discard Sleigh",
        async function () {
          clearFunc();
          await discard_card(this);
          if (cardLocation && cardLocation.getCardById(card.id)) {
            let removed = await cardLocation.removeCardById(card.id);
            if (!removed) {
              console.error(`Cant remove card from location: ${cardLocation}`);
              throw new Error(`Cant remove card`);
            } else {
              await this.activate_step1(card, cardLocationTrack);
            }
          }

          resolve("Sleigh finish");
        }.bind(this)
      );

      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve("Sleigh finish");
      });

      getHand().mark_cards(
        function (c) {
          return c.id === this.id;
        }.bind(this),
        async function (c) {
          clearFunc();
          await discard_card(this);
          if (cardLocation && cardLocation.getCardById(card.id)) {
            let removed = cardLocation.removeCardById(card.id);
            if (!removed) {
              console.error(`Cant remove card from location: ${cardLocation}`);
              throw new Error(`Cant remove card`);
            } else {
              await this.activate_step1(card, cardLocationTrack);
            }
          }
          resolve("Sleigh finish");
        }.bind(this),
        "discard"
      );
    });
  }
  activate_step1(card, cardLocationTrack) {
    let cardLocation = cardLocationTrack.getLocation();

    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      setInstruction(
        `Sleigh: Put ${card.name} into your hand; or onto your deck.`
      );

      getButtonPanel().add_button("Put into hand", async function () {
        clearFunc();
        if (cardLocation.id !== getHand().id) {
          cardLocationTrack.setLocation();
        }
        await getHand().addCard(card);
        resolve("Sleigh activate step 1 finish");
      });
      getButtonPanel().add_button("Onto deck", async function () {
        clearFunc();
        if (cardLocation.id !== getDeck().id) {
          cardLocationTrack.setLocation();
        }
        await getDeck().addCard(card);
        resolve("Sleigh activate step 1 finish");
      });
    });
  }
}
class Scrap extends Card {
  constructor(player) {
    super("Scrap", new Cost(3), Card.Type.ACTION, "Menagerie/", player);
  }
  play() {
    if (getHand().length() <= 0) return;

    return new Promise((resolve) => {
      this.chosen = 0;
      this.trash_card = undefined;
      this.activity_count = 0;
      getButtonPanel().clear_buttons();

      getHand().mark_cards(
        function (card) {
          return this.chosen === 0;
        }.bind(this),
        async function (card) {
          if (this.chosen === 0) {
            this.chosen += 1;
            this.trash_card = card;
            getHand().remove_mark();
            this.activity_count = Math.min(card.cost.coin, 6);
            await trash_card(card);

            if (this.activity_count <= 0) resolve("Scrap finish");
            await this.play_step2();
            resolve("Scrap finish");
          }
        }.bind(this),
        "trash"
      );
    });
  }
  play_step2() {
    this.activities = [];
    return new Promise((resolve) => {
      if (this.chosen <= 0 || !this.trash_card || this.activity_count <= 0)
        return;
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "+1 Card",
        async function () {
          if (this.activity_count > 0 && !this.activities.includes(0)) {
            this.activities.push(0);
            this.activity_count -= 1;
          }
          if (this.activity_count <= 0) {
            getButtonPanel().clear_buttons();
            await this.play_step3();
            resolve("Scrap finish");
          }
        }.bind(this)
      );
      getButtonPanel().add_button(
        "+1 Action",
        async function () {
          if (this.activity_count > 0 && !this.activities.includes(1)) {
            this.activities.push(1);
            this.activity_count -= 1;
          }
          if (this.activity_count <= 0) {
            getButtonPanel().clear_buttons();
            await this.play_step3();
            resolve("Scrap finish");
          }
        }.bind(this)
      );
      getButtonPanel().add_button(
        "+1 Buy",
        async function () {
          if (this.activity_count > 0 && !this.activities.includes(2)) {
            this.activities.push(2);
            this.activity_count -= 1;
          }
          if (this.activity_count <= 0) {
            getButtonPanel().clear_buttons();
            await this.play_step3();
            resolve("Scrap finish");
          }
        }.bind(this)
      );
      getButtonPanel().add_button(
        "+1$",
        async function () {
          if (this.activity_count > 0 && !this.activities.includes(3)) {
            this.activities.push(3);
            this.activity_count -= 1;
          }
          if (this.activity_count <= 0) {
            getButtonPanel().clear_buttons();
            await this.play_step3();
            resolve("Scrap finish");
          }
        }.bind(this)
      );
      getButtonPanel().add_button(
        "+Gain Silver",
        async function () {
          if (this.activity_count > 0 && !this.activities.includes(4)) {
            this.activities.push(4);
            this.activity_count -= 1;
          }
          if (this.activity_count <= 0) {
            getButtonPanel().clear_buttons();
            await this.play_step3();
            resolve("Scrap finish");
          }
        }.bind(this)
      );
      getButtonPanel().add_button(
        "+Gain Horse",
        async function () {
          if (this.activity_count > 0 && !this.activities.includes(5)) {
            this.activities.push(5);
            this.activity_count -= 1;
          }
          if (this.activity_count <= 0) {
            getButtonPanel().clear_buttons();
            await this.play_step3();
            resolve("Scrap finish");
          }
        }.bind(this)
      );
    });
  }
  async play_step3() {
    if (this.activities.includes(0)) {
      await draw1();
    }
    if (this.activities.includes(1)) {
      await getBasicStats().addAction(1);
    }
    if (this.activities.includes(2)) {
      await getBasicStats().addBuy(1);
    }
    if (this.activities.includes(3)) {
      await getBasicStats().addCoin(1);
    }
    if (this.activities.includes(4)) {
      await gain_card_name("Silver");
    }
    if (this.activities.includes(5)) {
      await gain_card_name("Horse");
    }
  }
}
class Cavalry extends Card {
  constructor(player) {
    super("Cavalry", new Cost(4), Card.Type.ACTION, "Menagerie/", player);
  }
  async play() {
    await gain_card_name("Horse");
    await gain_card_name("Horse");
  }
  async is_gained() {
    await drawNCards(2);
    await getBasicStats().addBuy(1);
    if (getPlayer().phase === PHASE_BUY) getPlayer().setPhase(PHASE_ACTION);
  }
}
class Groom extends Card {
  constructor(player) {
    super("Groom", new Cost(4), Card.Type.ACTION, "Menagerie/", player);
  }
  play() {
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
          let new_card = await gain_card(pile);
          if (new_card.type.includes(Card.Type.ACTION)) {
            gain_card_name("Horse");
          }
          if (new_card.type.includes(Card.Type.TREASURE)) {
            gain_card_name("Silver");
          }
          if (new_card.type.includes(Card.Type.VICTORY)) {
            await draw1();
            await getBasicStats().addAction(1);
          }
          resolve("Groom finish");
        }
      );
    });
  }
}
class Hostelry extends Card {
  constructor(player) {
    super("Hostelry", new Cost(4), Card.Type.ACTION, "Menagerie/", player);
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(2);
  }
  is_gained() {
    return new Promise((resolve) => {
      if (getHand().length() > 0) {
        this.chosen = 0;
        this.card_list = [];
        getHand()
          .getCardAll()
          .forEach((c) => (c.hostelry = undefined));
        getButtonPanel().clear_buttons();
        getButtonPanel().add_button(
          "Confirm Discard",
          async function () {
            if (this.chosen > 0) {
              for (let i = 0; i < this.card_list.length; i++) {
                let card = this.card_list[i];
                await discard_card(card);
                await reveal_card(card);
              }
              for (let i = 0; i < this.chosen; i++) {
                await gain_card_name("Horse");
              }
            }
            getButtonPanel().clear_buttons();
            resolve("Hostelry finish");
          }.bind(this)
        );

        let is_marked = getHand().mark_cards(
          function (card) {
            return card.type.includes(Card.Type.TREASURE);
          },
          function (card) {
            this.chosen += 1;
            this.card_list.push(card);
            card.hostelry = true;
          }.bind(this),
          "discard"
        );
        if (!is_marked) {
          resolve("Hostelry finish");
        }
      }
    });
  }
}
class Livery extends Card {
  constructor(player) {
    super("Livery", new Cost(5), Card.Type.ACTION, "Menagerie/", player);
    this.activate_when_gain = true;
    this.activate_when_in_play = true;
    this.description =
      "This turn, when you gain a card costing $4 or more, gain a Horse.";
  }
  async play() {
    await getBasicStats().addCoin(3);
  }
  should_activate(reason, card) {
    let cost = new Cost(4);
    return (
      reason === REASON_WHEN_GAIN && card && card.cost.isGreaterOrEqual(cost)
    );
  }
  async activate(reason, card) {
    if (card) {
      await gain_card_name("Horse");
    }
  }
}
class Paddock extends Card {
  constructor(player) {
    super("Paddock", new Cost(5), Card.Type.ACTION, "Menagerie/", player);
  }
  async play() {
    await getBasicStats().addCoin(2);
    await gain_card_name("Horse");
    await gain_card_name("Horse");
    let n = findSupplyPileAll((pile) => pile.getQuantity() === 0).length;
    if (n <= 0) return;
    await getBasicStats().addAction(n);
  }
}

class CamelTrain extends Card {
  constructor(player) {
    super("CamelTrain", new Cost(3), Card.Type.ACTION, "Menagerie/", player);
  }
  play() {
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          return !pile.getType().includes("Victory") && pile.getQuantity() > 0;
        },
        async function (pile) {
          removeMarkSupplyPile();
          let new_card = await pile.popNextCard();
          new_card.setPlayer(getPlayer());
          if (!new_card) throw new Error("");
          await exile_card(new_card);
          resolve("CamelTrain finish");
        }
      );
    });
  }
  async is_gained() {
    let gold_pile = findSupplyPile(function (pile) {
      return pile.getName() === "Gold" && pile.getQuantity() > 0;
    });
    if (!gold_pile) return;

    let new_gold = await gold_pile.popNextCard();
    new_gold.setPlayer(getPlayer());
    if (!new_gold) {
      return;
    }
    await exile_card(new_gold);
  }
}
class StockPile extends Card {
  constructor(player) {
    super("StockPile", new Cost(3), Card.Type.TREASURE, "Menagerie/", player);
  }
  async play() {
    await getBasicStats().addCoin(3);
    await getBasicStats().addBuy(1);
    await getPlayField().remove(this);
    await exile_card(this);
  }
}
class BountyHunter extends Card {
  constructor(player) {
    super("BountyHunter", new Cost(4), Card.Type.ACTION, "Menagerie/", player);
  }
  async play() {
    await getBasicStats().addAction(1);
    if (getHand().length() <= 0) return;

    return new Promise((resolve) => {
      let chosen = 0;
      getButtonPanel().clear_buttons();
      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          if (chosen === 0) {
            chosen += 1;
            await getHand().remove(card);
            if (!getExile().has_card((c) => c.name === card.name)) {
              await getBasicStats().addCoin(3);
            }
            await exile_card(card);
            resolve("BountyHunter finish");
          }
        },
        "discard"
      );
    });
  }
}
class Cardinal extends Card {
  constructor(player) {
    super(
      "Cardinal",
      new Cost(4),
      Card.Type.ACTION + " " + Card.Type.ATTACK,
      "Menagerie/",
      player
    );
  }
  async play() {
    await getBasicStats().addCoin(2);
    await attack_other(this);
  }
  attack() {}
  async is_attacked() {
    if (getDeck().length() < 2) await mix_discard_to_deck();
    let n = Math.min(2, getDeck().length());
    if (n <= 0) return;
    getButtonPanel().clear_buttons();
    let to_exile_card_list = [];
    for (let i = 0; i < n; i++) {
      let card = await getDeck().pop();
      await reveal_card(card);
      let minCost = new Cost(3),
        maxCost = new Cost(6);
      if (
        card.cost.isGreaterOrEqual(minCost) &&
        maxCost.isGreaterOrEqual(card.cost)
      ) {
        to_exile_card_list.push(card);
      } else {
        await discard_card(card, false);
      }
    }
    if (to_exile_card_list.length === 2) {
      await this.is_attacked_step1(to_exile_card_list);
    } else if (to_exile_card_list.length === 1) {
      let card = to_exile_card_list.pop();
      await exile_card(card);
    }
  }
  is_attacked_step1(card_list) {
    return new Promise(async (resolve) => {
      let supportHand = getSupportHand();
      supportHand.clear();
      await supportHand.addCardList(card_list);
      supportHand.getCardAll().forEach((card) => (card.cardinal = undefined));

      let chosen = 0;
      supportHand.mark_cards(
        function () {
          return chosen === 0;
        },
        async function (card) {
          supportHand.remove_mark();
          card.cardinal = true;
          chosen = 1;
          await exile_card(card);
          await supportHand.setCardAll(
            supportHand.getCardAll().filter((card) => !card.cardinal)
          );
          await getDiscard().addCardList(supportHand.getCardAll());
          supportHand.clear();
          resolve("Cardinal is_attacked finish");
        },
        "discard"
      );
    });
  }
}
class Coven extends Card {
  constructor(player) {
    super(
      "Coven",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.ATTACK,
      "Menagerie/",
      player
    );
    this.description =
      "Each other player Exiles a Curse from the Supply. If they can't, they discard their Exiled Curses.";
  }
  async play() {
    await getBasicStats().addAction(1);
    await getBasicStats().addCoin(2);
    await attack_other(this);
  }
  attack() {}
  async is_attacked() {
    let curse_pile = findSupplyPile((pile) => pile.getName() === "Curse");
    if (!curse_pile) return;
    if (curse_pile.getQuantity() > 0) {
      let new_curse = await curse_pile.popNextCard();
      if (!new_curse) throw new Error("");
      new_curse.setPlayer(getPlayer());
      await exile_card(new_curse);
      await getPlayer().update_score();
    } else {
      let i = 0;
      while (i < getExile().length()) {
        let card = getExile().getCardAll()[i];
        if (card.name === "Curse") {
          await getExile().remove(card);
          await getDiscard().addCard(card);
          continue;
        }
        i += 1;
      }
    }
  }
}
class Displace extends Card {
  constructor(player) {
    super("Displace", new Cost(5), Card.Type.ACTION, "Menagerie/", player);
  }
  play() {
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      this.card = undefined;
      getHand().mark_cards(
        function (card) {
          return this.chosen === 0;
        }.bind(this),
        async function (card) {
          if (this.chosen === 0) {
            getHand().remove_mark();
            this.chosen += 1;
            this.card = card;
            const card_name = card.name;
            await getHand().remove(card);
            await exile_card(card);
            await this.play_step2(card_name);
            resolve("Displace finish");
          }
        }.bind(this),
        "discard"
      );
    });
  }
  play_step2(card_name) {
    let cost = new Cost(2);
    cost.addCost(this.card.cost);
    if (!this.card || !cost) return;
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 &&
            cost.isGreaterOrEqual(pile.getCost()) &&
            pile.getName() !== card_name
          );
        },
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve("Displace finish");
        }
      );
    });
  }
}
class Gatekeeper extends Card {
  constructor(player) {
    super(
      "Gatekeeper",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION + " " + Card.Type.ATTACK,
      "Menagerie/",
      player
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = false;

    this.activate_when_gain = false;
    this.turn = -1;

    this.description =
      "At the start of your next turn, +$3. Until then, when another player gains an Action or Treasure card they don't have an Exiled copy of, they Exile it.";
  }
  async play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
    this.activate_when_in_play = true;

    await this.attack();
  }
  async attack() {
    await attack_other(this);
  }
  async is_attacked() {
    effectBuffer.addCard(this);
    this.activate_when_gain = true;

    this.turn = getPlayer().turn;

    //getPlayer().is_attacked_by_gatekeeper = true;
    /*
        //Only attack if they dont have an Exiled copy of
        if(!(getPlayer().phase === PHASE_REACTION || getPlayer().phase === PHASE_WAITING)){
            let cards_gained = getPlayer().gameState.cards_gained_this_turn;
            if(cards_gained.length < 0) return;
            let card = cards_gained[cards_gained.length - 1];
            if(!getExile().has_card(c => c.name === card.name) && getDiscard().has_card(c => c.id === card.id)){
                const removed = await getDiscard().remove(card);
                if(removed){
                    await exile_card(card);
                }                
            }
        }
            */
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    if (reason === REASON_START_TURN) return true;
    if (reason !== REASON_WHEN_GAIN) return false;

    if (this.turn + 1 !== getPlayer().turn) {
      effectBuffer.removeCardById(this.id);
      this.activate_when_gain = false;
      return false;
    }

    return (
      card &&
      (card.type.includes(Card.Type.TREASURE) ||
        card.type.includes(Card.Type.ACTION)) &&
      !getExile().has_card((c) => c.name === card.name)
    );
  }
  async activate(reason, card, activity, cardLocationTrack) {
    if (reason === REASON_START_TURN) {
      this.not_discard_in_cleanup = false;
      this.activate_when_start_turn = false;
      await getBasicStats().addCoin(3);
    } else if (reason === REASON_WHEN_GAIN) {
      if (!card || !cardLocationTrack) return;
      let cardLocation = cardLocationTrack.getLocation();

      if (cardLocation && cardLocation.getCardById(card.id)) {
        let removed = cardLocation.removeCardById(card.id);
        if (removed) {
          await exile_card(card);
          cardLocationTrack.setLocation();
        }
      }
    }
  }
}

class Sanctuary extends Card {
  constructor(player) {
    super("Sanctuary", new Cost(5), Card.Type.ACTION, "Menagerie/", player);
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);
    await getBasicStats().addBuy(1);
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      let chosen = 0;
      this.card = undefined;
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("Confirm Exile", function () {
        if (chosen > 1) alert("ERROR");
        resolve("Sanctuary finish");
      });
      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          if (chosen === 0) {
            chosen += 1;
            this.card = card;
            await getHand().remove(card);
            await exile_card(card);
            resolve("Sanctuary finish");
          }
        }.bind(this),
        "discard"
      );
    });
  }
}

class BlackCat extends Card {
  constructor(player) {
    super(
      "BlackCat",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.ATTACK + " " + Card.Type.REACTION,
      "Menagerie/",
      player
    );
    this.activate_when_another_gains = true;
    this.activate_when_in_hand = true;
    this.description =
      "+2 Cards If it isn't your turn, each other player gains a Curse. When another player gains a Victory card, you may play this from your hand.";
    //TODO: Test
  }
  async play() {
    await drawNCards(2);

    if (
      getPlayer().phase === PHASE_REACTION ||
      getPlayer().phase === PHASE_WAITING
    ) {
      await attack_other(this);
    }
  }
  async is_attacked() {
    await gain_card_name("Curse");
  }
  attack() {}
  should_activate(reason, card) {
    return (
      reason === REASON_WHEN_ANOTHER_GAIN &&
      card &&
      card.type.includes(Card.Type.VICTORY)
    );
  }
  activate(reason, card) {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Play BlackCat",
        async function () {
          getButtonPanel().clear_buttons();
          let removed = await getHand().remove(this);
          if (removed) await play_card(this);
          resolve();
        }.bind(this)
      );
      getButtonPanel().add_button("Cancel", function () {
        getButtonPanel().clear_buttons();
        resolve();
      });
    });
  }
}
class Goatherd extends Card {
  constructor(player) {
    super("Goatherd", new Cost(3), Card.Type.ACTION, "Menagerie/", player);
    this.description =
      "You may trash a card from your hand.+1 Card per card the player to your right trashed on their last turn.";
  }
  async play() {
    await getBasicStats().addAction(1);
    await this.play_step1();
    await this.play_step2();
  }
  play_step1() {
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      let chosen = 0;
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction("You may trash a card from your hand.");

      getButtonPanel().add_button("Cancel", async function () {
        clearFunc();
        resolve("Goatherd finish");
      });

      getHand().mark_cards(
        function () {
          return chosen < 1;
        },
        async function (card) {
          if (chosen < 1) {
            clearFunc();
            chosen += 1;
            await trash_card(card);
            resolve("Goatherd finish");
          }
        },
        "trash"
      );
    });
  }
  async play_step2() {
    if (opponentManager.getOpponentList().length <= 0) return;
    let rightPlayer = opponentManager.getRightPlayer();
    let trashedCount = rightPlayer.cards_trashed_this_turn.length;
    await drawNCards(trashedCount);
  }
}
class Sheepdog extends Card {
  constructor(player) {
    super(
      "Sheepdog",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.REACTION,
      "Menagerie/",
      player
    );
    this.activate_when_gain = true;
    this.activate_when_in_hand = true;
    this.description =
      "When you gain a card, you may play this from your hand.";
  }
  async play() {
    await drawNCards(2);
  }
  should_activate(reason, card) {
    return REASON_WHEN_GAIN && card;
  }
  activate(reason, card) {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Play Sheepdog",
        async function () {
          getButtonPanel().clear_buttons();
          let removed = await getHand().remove(this);
          if (removed) await play_card(this);
          resolve("Sheepdog activate finish");
        }.bind(this)
      );
      getButtonPanel().add_button("Cancel", function () {
        getButtonPanel().clear_buttons();
        resolve("Sheepdog activate finish");
      });
    });
  }
}
class SnowyVillage extends Card {
  constructor(player) {
    super("SnowyVillage", new Cost(3), Card.Type.ACTION, "Menagerie/", player);
    this.description = "Ignore any further +Actions you get this turn.";
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(4);
    await getBasicStats().addBuy(1);
    getBasicStats().ignoreAddActionsThisTurn = true;
  }
}
class VillageGreen extends Card {
  constructor(player) {
    super(
      "VillageGreen",
      new Cost(4),
      `${Card.Type.ACTION} ${Card.Type.DURATION} ${Card.Type.REACTION}`,
      "Menagerie/",
      player
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = true;
    this.activate_when_in_play = true;
    this.description =
      "When you discard this other than during Clean-up, you may play it.";
  }
  play() {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "NOW",
        async function () {
          await this.play_step1();
          this.not_discard_in_cleanup = false;
          resolve();
        }.bind(this)
      );
      getButtonPanel().add_button(
        "NEXT TURN",
        function () {
          this.not_discard_in_cleanup = true;
          resolve();
        }.bind(this)
      );
    });
  }
  async play_step1() {
    await draw1();
    await getBasicStats().addAction(2);
  }
  is_discarded() {
    if (getPlayer().phase !== PHASE_CLEAN_UP) {
      if (!getDiscard().hasCardId(this.id)) return;
      return new Promise((resolve) => {
        getButtonPanel().clear_buttons();
        getButtonPanel().add_button(
          "Play VillageGreen",
          async function () {
            getButtonPanel().clear_buttons();
            await getHand().remove(this);
            await play_card(this);
            resolve("Pirate activate step 1 finish");
          }.bind(this)
        );
        getButtonPanel().add_button("Cancel", function () {
          getButtonPanel().clear_buttons();
          resolve("Pirate activate step 1 finish");
        });
      });
    }
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reaason, card) {
    await this.play_step1();
    this.not_discard_in_cleanup = false;
  }
}
class Barge extends Card {
  constructor(player) {
    super(
      "Barge",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Menagerie/",
      player
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = true;
    this.activate_when_in_play = true;
  }
  play() {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "NOW",
        async function () {
          await this.play_step1();
          this.not_discard_in_cleanup = false;
          resolve();
        }.bind(this)
      );
      getButtonPanel().add_button(
        "NEXT TURN",
        function () {
          this.not_discard_in_cleanup = true;
          resolve();
        }.bind(this)
      );
    });
  }
  async play_step1() {
    await drawNCards(3);
    await getBasicStats().addBuy(1);
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = false;
    await this.play_step1();
  }
}
class Falconer extends Card {
  constructor(player) {
    super(
      "Falconer",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.REACTION,
      "Menagerie/",
      player
    );
    this.activate_when_another_gains = true;
    this.activate_when_gain = true;
    this.activate_when_in_hand = true;
    this.description =
      "Gain a card to your hand costing less than this. When any player gains a card with 2 or more types (Action, Attack, etc.), you may play this from your hand.";
  }
  play() {
    return new Promise((resolve) => {
      this.chosen = 0;
      this.chose_card = undefined;

      markSupplyPile(
        function (pile) {
          return (
            this.cost.isGreaterThan(pile.getCost()) && pile.getQuantity() > 0
          );
        }.bind(this),
        async function (pile) {
          removeMarkSupplyPile();
          let new_card = await gain_card(pile, getHand());
          resolve();
        }
      );
    });
  }
  should_activate(reason, card) {
    return (
      (reason === REASON_WHEN_ANOTHER_GAIN || reason === REASON_WHEN_GAIN) &&
      card &&
      card.type.length &&
      card.type.length >= 2
    );
  }
  activate(reason, card) {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Play Falconer",
        async function () {
          getButtonPanel().clear_buttons();
          await getHand().remove(this);
          await play_card(this);
          resolve("Falconer activate finish");
        }.bind(this)
      );
      getButtonPanel().add_button("Cancel", function () {
        getButtonPanel().clear_buttons();
        resolve("Falconer activate finish");
      });
    });
  }
}
class HuntingLodge extends Card {
  constructor(player) {
    super("HuntingLodge", new Cost(5), Card.Type.ACTION, "Menagerie/", player);
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(2);
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("Discard Hand", async function () {
        while (getHand().length() > 0) {
          let card = await getHand().pop();
          await discard_card(card, false);
        }
        await drawNCards(5);
        resolve("HuntingLodge finish");
      });
      getButtonPanel().add_button("Cancel", function () {
        resolve("HuntingLodge finish");
      });
    });
  }
}
class Kiln extends Card {
  constructor(player) {
    super("Kiln", new Cost(5), Card.Type.ACTION, "Menagerie/", player);
    this.turn = -1;
    this.activate_when_play = true;
    this.activate_when_in_play = false;
    this.chosen_id = -1;
    this.description =
      "The next time you play a card this turn, you may first gain a copy of it.";
    // TODO: Kiln when play with ThroneRoom
  }
  async play() {
    await getBasicStats().addCoin(2);
    this.turn = getPlayer().turn;
    this.chosen_id = -1;
    this.activate_when_in_play = true;
  }
  should_activate(reason, card) {
    //Phuc tap qua, lam giong Charm cho de
    if (!(reason === REASON_WHEN_PLAY && card && card.id !== this.id))
      return false;
    if (this.chosen_id === -1) {
      this.chosen_id = card.id;
    } else if (this.chosen_id === card.id) {
    } else {
      this.chosen_id = -1;
      this.activate_when_in_play = false;
      return false;
    }
    return findSupplyPile(
      (pile) => pile.getQuantity() > 0 && pile.getNextCard().name === card.name
    );
  }
  activate(reason, card) {
    this.activate_when_in_play = false;
    this.chosen_id = -1;
    let pile = findSupplyPile(
      (pile) => pile.getQuantity() > 0 && pile.getNextCard().name === card.name
    );
    if (!pile) return;
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        `Gain ${card.name}`,
        async function () {
          getButtonPanel().clear_buttons();
          await gain_card(pile);
          resolve("Kiln activate finish");
        }.bind(this)
      );
      getButtonPanel().add_button("Cancel", function () {
        getButtonPanel().clear_buttons();
        resolve("Kiln activate finish");
      });
    });
  }
}
class Mastermind extends Card {
  constructor(player) {
    super(
      "Mastermind",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Menagerie/",
      player
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = true;
    this.description =
      "At the start of your next turn, you may play an Action card from your hand three times.";
  }
  play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  activate(reason, card) {
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    if (getHand().length() <= 0) return;
    let chosen = 0;
    return new Promise(async (resolve) => {
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
        "Mastermind: You may play an Action card from your hand three times."
      );

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve("Mastermind finish");
      });

      let mayPlayAction = mayPlayCardFromHand(
        function (card) {
          return chosen === 0 && card.type.includes(Card.Type.ACTION);
        },
        async function (card) {
          if (this.chosen === 0) {
            this.chosen += 1;
            this.chosen_id = card.id;
          }
          clearFunc();
          await play_card(card);
          await play_card(card, false);
          await play_card(card, false);
          /*
                    removed = await getPlayField().remove(card);
                    if(removed){
                        await play_card(card);  
                        removed = await getPlayField().remove(card);
                        if(removed) await play_card(card); 
                        
                    } 
                    */
          resolve("Mastermind finish");
        }.bind(this)
      );
      if (!mayPlayAction) {
        clearFunc();
        resolve();
      }

      /*
            let contain_action = getHand().mark_cards(
                function(card){return chosen===0 && card.type.includes(Card.Type.ACTION);},
                async function(card){
                    if(this.chosen === 0){
                        this.chosen += 1;
                        this.chosen_id = card.id;
                    }
                    clearFunc();
                    let removed = await getHand().remove(card);
                    if(removed){
                        await play_card(card);
                        removed = await getPlayField().remove(card);
                        if(removed){
                            await play_card(card);  
                            removed = await getPlayField().remove(card);
                            if(removed) await play_card(card); 
                        } 
                    } 
                    resolve('Mastermind finish');                       
                }.bind(this),
            'choose');
            if(!contain_action) resolve('no action');
            */
    });
  }
}
class Fisherman extends Card {
  constructor(player) {
    super("Fisherman", new Cost(5), Card.Type.ACTION, "Menagerie/", player);
    this.description =
      "During your turns, if your discard pile is empty, this card cost $3 less.";
  }
  async play() {
    //TODO
    await draw1();
    await getBasicStats().addAction(1);
    await getBasicStats().addCoin(1);
  }
}
class Destrier extends Card {
  constructor(player) {
    super("Destrier", new Cost(6), Card.Type.ACTION, "Menagerie/", player);
    this.description =
      "During your turn, this costs $1 less    per card you've gained this turn.";
  }
  async play() {
    //TODO
    await drawNCards(2);
    await getBasicStats().addAction(1);
  }
}
class Wayfarer extends Card {
  constructor(player) {
    super("Wayfarer", new Cost(6), Card.Type.ACTION, "Menagerie/", player);
    this.description =
      "+3 Cards You may gain a Silver. This has the same cost as the last other card gained this turn, if any.";
    //TODO
  }
  async play() {
    await drawNCards(3);
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("Gain Silver", async function () {
        getButtonPanel().clear_buttons();
        await gain_card_name("Silver");
        resolve("Wayfarer finish");
      });
      getButtonPanel().add_button("Cancel", async function () {
        getButtonPanel().clear_buttons();
        resolve("Wayfarer finish");
      });
    });
  }
}
class AnimalFair extends Card {
  constructor(player) {
    super("AnimalFair", new Cost(7), Card.Type.ACTION, "Menagerie/", player);
    this.description =
      "+$4 +1 Buy per empty supply pile. Instead of paying this card's cost, you may trash an Action card from your hand.";
  }
  async play() {
    await getBasicStats().addCoin(4);
    let n = findSupplyPileAll((pile) => pile.getQuantity() <= 0).length;
    await getBasicStats().addBuy(n);
  }
}

export {
  Horse,
  Supplies,
  Sleigh,
  Scrap,
  Cavalry,
  Groom,
  Hostelry,
  Livery,
  Paddock, // gain Horse
  CamelTrain,
  StockPile,
  BountyHunter,
  Cardinal,
  Coven,
  Displace,
  Gatekeeper,
  Sanctuary, // exile
  BlackCat,
  Goatherd,
  Sheepdog,
  SnowyVillage,
  VillageGreen,
  Barge,
  Falconer,
  HuntingLodge,
  Kiln,
  Mastermind,
  Fisherman,
  Destrier,
  Wayfarer,
  AnimalFair,
};
