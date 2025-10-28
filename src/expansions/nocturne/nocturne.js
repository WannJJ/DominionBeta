import { Card, Cost } from "../cards.js";

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
  receive_state,
  receive_boon,
  receive_hex,
  mayPlayCardFromHand,
  message_other,
  discardTopBoon,
  receive_boon_twice,
  takeABoonAsBlessedVillage,
  receiveBoonAsBlessedVillage,
  setAsideTop3Boons,
  receiveBoonAsDruid,
  receiveBoonAsSacredGroveOther,
  trashCardList,
  discardCardList,
} from "../../game_logic/Activity.js";
import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";

import {
  REASON_START_TURN,
  REASON_END_TURN,
  REASON_WHEN_GAIN,
  effectBuffer,
  REASON_FIRST_WHEN_ANOTHER_PLAYS,
  REASON_START_CLEANUP,
  REASON_WHEN_DISCARD,
  REASON_END_YOUR_TURN,
} from "../../game_logic/ReactionEffectManager.js";
import {
  Lost_in_the_Woods,
  //Deluded, Envious, Miserable, TwiceMiserable
} from "./nocturne_state.js";
import { findSupplyPile } from "../../features/TableSide/SupplyPile.jsx";
import {
  markSupplyPile,
  removeMarkSupplyPile,
} from "../../features/TableSide/Supply.jsx";
import { getSetAside } from "../../features/PlayerSide/BottomLeftCorner/SideArea.jsx";
import { getGameState } from "../../game_logic/GameState.js";
import { getPlayer } from "../../player.js";
import { getSupportHand } from "../../features/SupportHand.jsx";
import { findNonSupplyPile } from "../../features/TableSide/NonSupplyPile.jsx";
import { stateHolder } from "./HexBoonManager.js";
import { PHASE_CLEAN_UP, PHASE_NIGHT } from "../../utils/constants.js";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import { opponentManager } from "../../features/OpponentSide/Opponent.js";
import { getCost, getType } from "../../game_logic/basicCardFunctions.js";
/*
Mẫu
class  extends Card{
    constructor(){
        super("", , Card.Type.NIGHT, "Nocturne/");
    }
    play(){} 
}
*/

class Bat extends Card {
  constructor() {
    super("Bat", new Cost(2), Card.Type.NIGHT, "Nocturne/");
  }
  getInitAmount() {
    return 10;
  }
  play() {
    if (getHand().getLength() > 0) {
      return new Promise((resolve) => {
        this.chosen = 0;
        this.card_list = [];
        let clearFunc = async function () {
          getButtonPanel().clear_buttons();
          await getHand().remove_mark();
        };

        getButtonPanel().clear_buttons();
        getButtonPanel().add_button(
          "Confirm Trashing",
          async function () {
            if (this.card_list.length > 0) {
              await trashCardList(this.card_list);
            }
            if (this.chosen > 0) {
              //Exchange
              let vampire_pile = findSupplyPile(
                (pile) => pile.getName() === "Vampire" && pile.getQuantity() > 0
              );
              let bat_pile = findNonSupplyPile(
                (pile) => pile.getName() === "Bat"
              );
              if (vampire_pile && bat_pile) {
                let removed = await getPlayField().remove(this);
                if (removed) {
                  await bat_pile.return_card(this);
                  let vampireCard = await vampire_pile.popNextCard();
                  await getDiscard().addCard(vampireCard);
                }
              }
            }
            await clearFunc();
            resolve("Bat finish");
          }.bind(this)
        );

        getHand().mark_cards(
          function () {
            if (this.chosen < 2) {
              return true;
            }
            return false;
          }.bind(this),
          function (card) {
            if (this.chosen < 2) {
              this.chosen += 1;
              this.card_list.push(card);
            }
          }.bind(this),
          "trash"
        );
      });
    }
  }
}
class Changeling extends Card {
  constructor() {
    super("Changeling", new Cost(3), Card.Type.NIGHT, "Nocturne/");
    this.activate_when_gain = true;
    this.description =
      "In games using this, when you gain a card costing $3 or more, you may exchange it for a Changeling";
  }
  setup() {
    effectBuffer.addCard(this);
  }
  async play() {
    if (getPlayField().getCardById(this.id)) {
      await getPlayField().removeCardById(this.id);
    }
    await trash_card(this, false);

    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          return getPlayField().has_card(
            (c) => pile.getQuantity() > 0 && c.name === pile.getNextCard().name
          );
        },
        async function (pile) {
          removeMarkSupplyPile();
          await gain_card(pile);
          resolve("Challenging finish");
        }
      );
    });
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    let cost = new Cost(3);
    let changelingPile = findSupplyPile(
      (pile) => pile.getName() === this.name && pile.getQuantity() > 0
    );
    let cardPile = findSupplyPile((pile) => pile.isOriginOf(card));
    if (!cardPile)
      cardPile = findNonSupplyPile((pile) => pile.isOriginOf(card));

    return (
      reason === REASON_WHEN_GAIN &&
      card &&
      getCost(card).isGreaterOrEqual(cost) &&
      changelingPile &&
      cardPile
    );
  }
  activate(reason, card, activity, cardLocationTrack) {
    if (!card || !cardLocationTrack) return;
    let cardLocation = cardLocationTrack.getLocation();
    let changelingPile = findSupplyPile(
      (pile) => pile.getName() === this.name && pile.getQuantity() > 0
    );
    let cardPile = findSupplyPile((pile) => pile.isOriginOf(card));
    if (!cardPile)
      cardPile = findNonSupplyPile((pile) => pile.isOriginOf(card));

    if (
      !cardLocation ||
      !cardLocation.getCardById(card.id) ||
      !changelingPile ||
      !cardPile
    )
      return;

    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        `Changeling: You may exchange ${card.name} for a Changeling.`
      );

      getButtonPanel().add_button(`Exchange ${card.name}`, async function () {
        clearFunc();
        //Exchange
        let removed = await cardLocation.removeCardById(card.id);
        if (removed) {
          await cardPile.return_card(card);
          let changelingCard = await changelingPile.popNextCard();
          await getDiscard().addCard(changelingCard);

          cardLocationTrack.setLocation();
        }

        resolve();
      });

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve();
      });
    });
  }
}
class Cobbler extends Card {
  constructor() {
    super(
      "Cobbler",
      new Cost(5),
      Card.Type.NIGHT + " " + Card.Type.DURATION,
      "Nocturne/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = true;
    this.description =
      "At the start of your next turn, gain a card to your hand costing up to $4.";
  }
  play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    await this.activate_step1();
  }
  activate_step1() {
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
          await gain_card(pile, getHand());
          resolve("Cobbler finish");
        }
      );
    });
  }
}
class Crypt extends Card {
  constructor() {
    super(
      "Crypt",
      new Cost(5),
      Card.Type.NIGHT + " " + Card.Type.DURATION,
      "Nocturne/"
    );
    this.chosen_id_list = [];
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = true;
    this.description =
      "Set aside any number of non-Duration Treasures you have in play, face down (under this). While any remain, at the start of each of your turns, put one of them into your hand.";
  }
  play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
    return new Promise(async (resolve) => {
      this.chosen_id_list = [];
      let chosen_list = [];

      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        await getPlayField().remove_mark();
      };

      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Confirm",
        async function () {
          if (chosen_list.length > 0) {
            while (chosen_list.length > 0) {
              let card = chosen_list.pop();
              this.chosen_id_list.push(card.id);
              await getPlayField().removeCardById(card.id);
              await set_aside_card(card);
            }
            this.not_discard_in_cleanup = true;
          }
          await clearFunc();
          resolve("Crypt finish");
        }.bind(this)
      );

      let is_marked = getPlayField().mark_cards(
        function (card) {
          return (
            getType(card).includes(Card.Type.TREASURE) &&
            !getType(card).includes(Card.Type.DURATION)
          );
        },
        function (card) {
          chosen_list.push(card);
        },
        "discard"
      );
      if (!is_marked) {
        await clearFunc();
        resolve("Crypt finish");
      }
    });
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = true;
    if (this.chosen_id_list.length === 1) {
      let id = this.chosen_id_list.pop();
      let c = await getSetAside().removeCardById(id);
      if (c) {
        await getHand().addCard(c);
      }
      this.not_discard_in_cleanup = false;
      this.activate_when_start_turn = false;
    } else if (this.chosen_id_list.length > 1) {
      return new Promise(async (resolve) => {
        let supportHand = getSupportHand();
        supportHand.clear();
        for (let id of this.chosen_id_list) {
          let card = getSetAside().getCardById(id);
          if (card) {
            await supportHand.addCard(card);
          }
        }
        supportHand.mark_cards(
          (c) => true,
          async function (card) {
            await getSetAside().removeCardById(card.id);
            await getHand().addCard(card);

            this.chosen_id_list = this.chosen_id_list.filter(
              (id) => id !== card.id
            );
            if (this.chosen_id_list.length > 0) {
              this.not_discard_in_cleanup = true;
              this.activate_when_start_turn = true;
            } else {
              this.not_discard_in_cleanup = false;
              this.activate_when_start_turn = false;
            }
            supportHand.clear();
            supportHand.hide();
            resolve("Crypt activate finish");
          }.bind(this),
          "choose"
        );
      });
    }
  }
}
class Den_of_Sin extends Card {
  constructor() {
    super(
      "Den_of_Sin",
      new Cost(5),
      Card.Type.NIGHT + " " + Card.Type.DURATION,
      "Nocturne/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = true;
    this.description =
      "At the start of your next turn, +2 Cards. This is gained to your hand (instead of your discard pile).";
  }
  play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
  }
  is_gained() {}
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    await drawNCards(2);
  }
}
class DevilsWorkshop extends Card {
  constructor() {
    super("DevilsWorkshop", new Cost(4), Card.Type.NIGHT, "Nocturne/");
  }
  async play() {
    switch (getGameState().cards_gained_this_turn.length) {
      case 0:
        await gain_card_name("Gold");
        break;
      case 1:
        return new Promise((resolve) => {
          markSupplyPile(
            function (pile) {
              let cost = new Cost(4);
              return (
                pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost())
              );
            },
            async function (pile) {
              await gain_card(pile);
              removeMarkSupplyPile();
              resolve("DeveilsWorkshop finish");
            }
          );
        });
      default:
        await gain_card_name("Imp");
    }
  }
}
class Exorcist extends Card {
  constructor() {
    super("Exorcist", new Cost(4), Card.Type.NIGHT, "Nocturne/");
    this.description =
      "Trash a card from your hand. Gain a cheaper Spirit from one of the Spirit piles.";
  }
  play() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      getHand().mark_cards(
        (c) => true,
        async function (card) {
          await trash_card(card);
          await getHand().remove_mark();

          await this.play_step1(getCost(card));
          resolve("Exorcist finish");
        }.bind(this),
        "trash"
      );
    });
  }
  play_step1(cost) {
    return new Promise((resolve) => {
      let spirit_found = false;
      getButtonPanel().clear_buttons();
      for (let name of ["Will_o_Wisp", "Imp", "Ghost"]) {
        let pile = findNonSupplyPile(
          (pile) => pile.getQuantity() > 0 && pile.getName() === name
        );
        if (pile && cost.isGreaterThan(pile.getCost())) {
          getButtonPanel().add_button(`Gain ${name}`, async function () {
            getButtonPanel().clear_buttons();
            await gain_card_name(name);
            resolve();
          });
          spirit_found = true;
        }
      }
      if (!spirit_found) {
        getButtonPanel().clear_buttons();
        resolve("");
      }
    });
  }
}
class GhostTown extends Card {
  constructor() {
    super(
      "GhostTown",
      new Cost(3),
      Card.Type.NIGHT + " " + Card.Type.DURATION,
      "Nocturne/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = true;
    this.description =
      "At the start of your next turn, +1 Card and +1 Action. This is gained to your hand (instead of your discard pile).";
  }
  play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
  }
  is_gained() {}
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    await draw1();
    await getBasicStats().addAction(1);
  }
}
class Ghost extends Card {
  constructor() {
    super(
      "Ghost",
      new Cost(4),
      Card.Type.NIGHT + " " + Card.Type.DURATION + " " + Card.Type.SPIRIT,
      "Nocturne/"
    );
    this.chosen_id = null;
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = true;
    this.description = "";
  }
  getInitAmount() {
    return 6;
  }
  async play() {
    if (getDeck().getLength() <= 0) await mix_discard_to_deck();
    if (getDeck().getLength() <= 0) return;
    this.chosen_id = null;
    let card_list = [];
    while (getDeck().length() > 0) {
      let card = await getDeck().pop();
      if (getType(card).includes(Card.Type.ACTION)) {
        this.chosen_id = card.id;
        await set_aside_card(card);
        this.not_discard_in_cleanup = true;
        this.activate_when_start_turn = true;
        break;
      } else {
        await reveal_card(card);
        card_list.push(card);
      }
      if (getDeck().getLength() === 0 && getDiscard().getLength() > 0)
        await mix_discard_to_deck();
    }

    if (card_list.length > 0) {
      await discardCardList(card_list, false);
    }
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason) {
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    let card = await getSetAside().removeCardById(this.chosen_id);
    if (card) {
      await play_card(card);
      await play_card(card, false);
    }
  }
}
class Guardian extends Card {
  constructor() {
    super(
      "Guardian",
      new Cost(2),
      Card.Type.DURATION + " " + Card.Type.NIGHT,
      "Nocturne/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_first_when_another_plays = false;
    this.activate_when_in_play = true;
    this.description =
      "At the start of your next turn, +$1. Until then, when another player plays an Attack card, it doesn't affect you. This is gained to your hand (instead of your discard pile).";
  }
  play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
    this.activate_first_when_another_plays = true;
  }
  should_activate(reason, card) {
    return (
      reason === REASON_START_TURN ||
      (reason === REASON_FIRST_WHEN_ANOTHER_PLAYS &&
        card &&
        getType(card).includes(Card.Type.ATTACK))
    );
  }
  async activate(reason, card) {
    if (reason === REASON_FIRST_WHEN_ANOTHER_PLAYS) {
      getPlayer().unaffected_id_list.push(card.id);
    } else if (reason === REASON_START_TURN) {
      this.not_discard_in_cleanup = false;
      this.activate_when_start_turn = false;
      this.activate_first_when_another_plays = false;
      await getBasicStats().addCoin(1);
    }
  }
}
class Monastery extends Card {
  constructor() {
    super("Monastery", new Cost(2), Card.Type.NIGHT, "Nocturne/");
  }
  async play() {
    this.n = getGameState().cards_gained_this_turn.length;
    if (this.n <= 0) return;

    return new Promise(async (resolve) => {
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("OK", function () {
        resolve("Monastery finish");
      });

      while (this.n > 0) {
        await this.play_step1();
        if (this.n <= 0) {
          getButtonPanel().clear_buttons();
          resolve();
          return;
        }
      }
      if (this.n <= 0) {
        getButtonPanel().clear_buttons();
        resolve();
        return;
      }
    });
  }
  play_step1() {
    return new Promise((resolve) => {
      let clearFunc = async function () {
        await getHand().remove_mark();
        await getPlayField().remove_mark();
        getButtonPanel().clear_buttons();
      };
      getHand().mark_cards(
        (c) => this.n > 0,
        async function (card) {
          if (this.n > 0) {
            await getHand().remove(card);
            await trash_card(card, false);
            this.n -= 1;
          }
          await clearFunc();
          resolve();
        }.bind(this),
        "trash"
      );
      getPlayField().mark_cards(
        (c) => c.name === "Copper" && this.n > 0,
        async function (card) {
          if (this.n > 0) {
            await getPlayField().remove(card);
            await trash_card(card, false);
            this.n -= 1;
          }
          await clearFunc();
          resolve();
        }.bind(this),
        "trash"
      );
    });
  }
}
class NightWatchman extends Card {
  constructor() {
    super("NightWatchman", new Cost(3), Card.Type.NIGHT, "Nocturne/");
    this.description =
      "Look at the top 5 cards of your deck, discard any number, and put the rest back in any order.This is gained to your hand (instead of your discard pile).";
  }
  async play() {
    let supportHand = getSupportHand();
    supportHand.clear();

    if (getDeck().getLength() < 5) {
      await mix_discard_to_deck();
    }
    const n = Math.min(getDeck().getLength(), 5);
    if (n <= 0) return;
    for (let i = 0; i < n; i++) {
      await supportHand.addCard(await getDeck().pop());
    }
    supportHand
      .getCardAll()
      .forEach((card) => (card.nightWatchman = undefined));
    await this.play_step1();

    while (supportHand.getLength() >= 1) {
      await this.play_step2();
    }
    supportHand.clear();
    supportHand.hide();
  }
  play_step1() {
    return new Promise(async (resolve) => {
      let supportHand = getSupportHand();
      let clearFunc = async function () {
        await supportHand.remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("NightWatchman: Discard any number of cards.");

      supportHand.mark_cards(
        function () {
          return true;
        },
        function (card) {
          card.nightWatchman = true;
        },
        "discard"
      );

      getButtonPanel().add_button("Confirm Discarding", async function () {
        await clearFunc();
        let i = 0;
        while (i < supportHand.getLength()) {
          let card = supportHand.getCardAll()[i];
          if (card.nightWatchman) {
            await supportHand.remove(card);
            await discard_card(card, false);
            continue;
          }
          i++;
        }
        resolve("NightWatchman finish");
      });
    });
  }
  async play_step2() {
    let supportHand = getSupportHand();

    if (supportHand.getLength() === 1) {
      let card = supportHand.getCardAll()[0];
      await supportHand.remove(card);
      await getDeck().addCard(card);
      return;
    }
    if (supportHand.getLength() <= 0) return;
    await new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("NightWatchman: Put the rest back in any order.");

      getButtonPanel().add_button("OK", async function () {
        clearFunc();
        await getDeck().addCardList(supportHand.getCardAll().reverse());
        supportHand.clear();
        resolve();
      });
      supportHand.mark_cards(
        function () {
          return true;
        },
        async function (card) {
          await supportHand.remove(card);
          await getDeck().addCard(card);

          clearFunc();
          resolve();
        }
      );
    });
  }
  is_gained() {}
}
class Raider extends Card {
  constructor() {
    super(
      "Raider",
      new Cost(6),
      Card.Type.NIGHT + " " + Card.Type.DURATION + " " + Card.Type.ATTACK,
      "Nocturne/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_in_play = true;
    this.description =
      "Each other player with 5 or more cards in hand discards a copy of a card you have in play (or reveals they can't).";
  }
  async play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
    await this.attack();
  }
  async attack() {
    let card_list = [];
    for (let card of getPlayField().getCardAll()) {
      card_list.push(card.name);
    }
    let message = { card_list: card_list };
    await attack_other(this, JSON.stringify(message));
  }
  is_attacked(message) {
    if (getHand().getLength() < 5) return;
    let mess_obj = JSON.parse(message);
    let card_list = mess_obj.card_list;
    return new Promise(async (resolve) => {
      let is_marked = getHand().mark_cards(
        function (card) {
          return card_list.includes(card.name);
        },
        async function (card) {
          await discard_card(card);
          await getHand().remove_mark();
          resolve();
        },
        "discard"
      );
      if (!is_marked) {
        for (let card of getHand.getCardAll()) {
          await reveal_card(card);
        }
        await getHand().remove_mark();
        resolve();
      }
    });
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason) {
    await getBasicStats().addCoin(3);
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
  }
}
class Vampire extends Card {
  constructor() {
    super("Vampire", new Cost(5), Card.Type.NIGHT, "Nocturne/");
  }
  play() {
    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          let cost = new Cost(5);
          return (
            pile.getQuantity() > 0 &&
            cost.isGreaterOrEqual(pile.getCost()) &&
            pile.getName() !== "Vampire"
          );
        },
        async function (pile) {
          await gain_card(pile);
          removeMarkSupplyPile();

          await attack_other(this);

          let vampire_pile = findSupplyPile(
            (pile) => pile.getName() === "Vampire"
          );
          let bat_pile = findNonSupplyPile(
            (pile) => pile.getName() === "Bat" && pile.getQuantity() > 0
          );
          if (vampire_pile && bat_pile) {
            let removed = await getPlayField().remove(this);
            if (removed) {
              //Exchange
              await vampire_pile.return_card(this);
              let batCard = await bat_pile.popNextCard();
              await getDiscard().addCard(batCard);
            }
          }

          resolve("Vampire finish");
        }.bind(this)
      );
    });
  }
  attack() {}
  async is_attacked() {
    await receive_hex();
  }
}
class Werewolf extends Card {
  constructor() {
    super(
      "Werewolf",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.NIGHT} ${Card.Type.ATTACK} ${Card.Type.DOOM}`,
      "Nocturne/"
    );
  }
  async play() {
    if (getPlayer().phase === PHASE_NIGHT) {
      await this.attack();
    } else {
      await drawNCards(3);
    }
  }
  async attack() {
    await attack_other(this);
  }
  async is_attacked() {
    await receive_hex();
  }
}

class Wish extends Card {
  constructor() {
    super("Wish", new Cost(0), Card.Type.ACTION, "Nocturne/NonSupply/");
  }
  getInitAmount() {
    return 12;
  }
  async play() {
    await getBasicStats().addAction(1);

    if (getPlayField().getCardAll().includes(this)) {
      let wish_pile = findNonSupplyPile((pile) => pile.getName() === "Wish");
      if (!wish_pile) return;

      await wish_pile.return_card(this);
      await getPlayField().remove(this);

      return new Promise((resolve) => {
        markSupplyPile(
          function (pile) {
            let cost = new Cost(6);
            return (
              pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost())
            );
          },
          async function (pile) {
            await gain_card(pile, getHand());
            removeMarkSupplyPile();
            resolve("Wish finish");
          }
        );
      });
    }
  }
}
class Will_o_Wisp extends Card {
  constructor() {
    super(
      "Will_o_Wisp",
      new Cost(0),
      Card.Type.ACTION + " " + Card.Type.SPIRIT,
      "Nocturne/NonSupply/"
    );
  }
  getInitAmount() {
    return 12;
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);

    if (getDeck().getLength() <= 0) {
      await mix_discard_to_deck();
    }
    if (getDeck().getLength() <= 0) return;
    let card = getDeck().getCardAll()[getDeck().getLength() - 1];
    await reveal_card(card);
    if (getCost(card).getCoin() <= 2) {
      card = await getDeck().getCardAll().pop();
      await getHand().addCard(card);
    }
  }
}
class Imp extends Card {
  constructor() {
    super(
      "Imp",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.SPIRIT,
      "Nocturne/NonSupply/"
    );
  }
  getInitAmount() {
    return 13;
  }
  async play() {
    await drawNCards(2);
    return new Promise(async (resolve) => {
      let clearFunc = async function () {
        await getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");

        getSupportHand().clear();
        getSupportHand().hide();
        getDeck().removeCanSelect();
      };
      setInstruction("Imp: You may play an Action card from your hand.");

      let mayPlayAction = mayPlayCardFromHand(
        function (card) {
          return (
            getType(card).includes(Card.Type.ACTION) &&
            !getPlayField().has_card((c) => c.name === card.name)
          );
        },
        async function (card) {
          await clearFunc();
          await getHand().remove(card);
          await play_card(card);
          resolve("Imp finish");
        }
      );
      if (!mayPlayAction) {
        await clearFunc();
        resolve();
      }

      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("Don't play", async function () {
        await clearFunc();
        resolve("Imp finish");
      });
    });
  }
}
class ZombieApprentice extends Card {
  constructor() {
    super(
      "ZombieApprentice",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.ZOMBIE,
      "Nocturne/NonSupply/"
    );
  }
  play() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        getHand().remove_mark();
        resolve("ZombieApprentice finish");
      };
      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
      });
      let is_marked = getHand().mark_cards(
        (c) => getType(c).includes(Card.Type.ACTION),
        async function (card) {
          await trash_card(card);
          await drawNCards(3);
          await getBasicStats().addAction(1);

          await clearFunc();
        },
        "trash"
      );
      if (!is_marked) {
        clearFunc();
      }
    });
  }
}
class ZombieMason extends Card {
  constructor() {
    super(
      "ZombieMason",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.ZOMBIE,
      "Nocturne/NonSupply/"
    );
  }
  async play() {
    if (getDeck().getLength() <= 0) await mix_discard_to_deck();
    if (getDeck().getLength() <= 0) return;

    let topCard = await getDeck().pop();
    if (topCard) {
      await trash_card(topCard, false);
      await this.play_step1(getCost(topCard));
    }
  }
  play_step1(card_cost) {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        removeMarkSupplyPile();
      };

      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve();
      });
      let pile_found = markSupplyPile(
        function (pile) {
          let cost = new Cost(1);
          cost.addCost(card_cost);
          return (
            pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          clearFunc();
          await gain_card(pile);
          resolve();
        }
      );
      if (!pile_found) {
        clearFunc();
        resolve();
      }
    });
  }
}
class ZombieSpy extends Card {
  constructor() {
    super(
      "ZombieSpy",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.ZOMBIE,
      "Nocturne/NonSupply/"
    );
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);
    if (getDeck().getLength() <= 0) await mix_discard_to_deck();
    if (getDeck().getLength() <= 0) return;
    await this.play_step1();
  }
  async play_step1() {
    let supportHand = getSupportHand();

    supportHand.clear();
    let card = await getDeck().pop();
    if (!card) return;
    await supportHand.addCard(card);
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        supportHand.clear();
        supportHand.hide();
        resolve();
      };
      getButtonPanel().add_button("Discard", async function () {
        await discard_card(card, false);
        clearFunc();
      });
      getButtonPanel().add_button("Put back", async function () {
        await getDeck().addCard(card);
        clearFunc();
      });
    });
  }
}

//DOOM Cards
class Leprechaun extends Card {
  constructor() {
    super(
      "Leprechaun",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.DOOM,
      "Nocturne/"
    );
  }
  async play() {
    await gain_card_name("Gold");
    if (getPlayField().getLength() === 7) {
      await gain_card_name("Wish");
    } else {
      await receive_hex();
    }
  }
}

class Skulk extends Card {
  constructor() {
    super(
      "Skulk",
      new Cost(4),
      `${Card.Type.ACTION} ${Card.Type.ATTACK} ${Card.Type.DOOM}`,
      "Nocturne/"
    );
  }
  async play() {
    await getBasicStats().addBuy(1);
    await attack_other(this);
  }
  attack() {}
  async is_attacked() {
    await receive_hex();
  }
  async is_gained() {
    await gain_card_name("Gold");
  }
}
class CursedVillage extends Card {
  constructor() {
    super(
      "CursedVillage",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DOOM,
      "Nocturne/"
    );
  }
  async play() {
    await getBasicStats().addAction(2);
    if (getDeck().getLength() < 6 - getHand().getLength()) {
      await mix_discard_to_deck();
    }
    while (
      getHand().getLength() < 6 &&
      (getDeck().getLength() > 0 || getDiscard().length() > 0)
    ) {
      await draw1();
    }
  }
  async is_gained() {
    await receive_hex();
  }
}
class Tormentor extends Card {
  constructor() {
    super(
      "Tormentor",
      new Cost(5),
      `${Card.Type.ACTION} ${Card.Type.ATTACK} ${Card.Type.DOOM}`,
      "Nocturne/"
    );
  }
  async play() {
    await getBasicStats().addCoin(2);
    if (
      getPlayField().getCardAll().includes(this) &&
      getPlayField().getLength() === 1
    ) {
      await gain_card_name("Imp");
    } else {
      await this.attack();
    }
  }
  async attack() {
    await attack_other(this);
  }
  async is_attacked() {
    await receive_hex();
  }
}

//FATE Cards
class Druid extends Card {
  constructor() {
    super(
      "Druid",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.FATE,
      "Nocturne/"
    );
    this.description =
      "Receive one of the set-aside Boons (leaving it there).Setup: Set aside the top 3 Boons face up.";
  }
  async setup() {
    await setAsideTop3Boons();
  }
  async play() {
    //TODO: Druid when play Rivers Gift
    await getBasicStats().addCoin(2);

    let druidBoonPile = findNonSupplyPile(
      (pile) => pile.getQuantity() > 0 && pile.getName() === "Druid Boons"
    );
    if (!druidBoonPile) return;
    await this.play_step1(druidBoonPile);
  }
  play_step1(druidBoonPile) {
    return new Promise(async (resolve) => {
      let supportHand = getSupportHand();
      supportHand.clear();
      await supportHand.setCardAll(druidBoonPile.getCardAll());
      supportHand.mark_cards(
        (card) => true,
        async function (card) {
          supportHand.clear();
          await receiveBoonAsDruid(card);
          resolve();
        },
        "choose"
      );
    });
  }
}
class Pixie extends Card {
  constructor() {
    super(
      "Pixie",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.FATE,
      "Nocturne/"
    );
    this.description =
      "Discard the top Boon. You may trash this to receive that Boon twice.Heirloom: Goat";
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);

    let topBoon = await discardTopBoon();
    if (!topBoon) return;
    await this.play_step1(topBoon);
  }
  play_step1(boonCard) {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      setInstruction(
        `Pixie: You may trash this to receive ${boonCard.name} twice.`
      );
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };

      getButtonPanel().add_button(
        "Trash Pixie",
        async function () {
          clearFunc();
          let removed = await getPlayField().removeCardById(this.id);
          if (removed) {
            await receive_boon_twice(boonCard);
          }
          resolve();
        }.bind(this)
      );

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve();
      });
    });
  }
}

class Tracker extends Card {
  constructor() {
    super(
      "Tracker",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.FATE,
      "Nocturne/"
    );
    this.activate_when_gain = false;
    this.activate_when_in_play = false;
    this.description =
      "This turn, when you gain a card, you may put it onto your deck.Receive a Boon.Heirloom: Pouch";
  }
  async play() {
    await getBasicStats().addCoin(1);
    this.activate_when_gain = true;
    this.activate_when_in_play = true;
    await receive_boon();
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    return reason === REASON_WHEN_GAIN && card && card.id;
  }
  activate(reason, card, activity, cardLocationTrack) {
    if (!card || !cardLocationTrack) return;
    let cardLocation = cardLocationTrack.getLocation();

    if (cardLocation && cardLocation.getCardById(card.id)) {
      return new Promise((resolve) => {
        getButtonPanel().clear_buttons();
        getButtonPanel().add_button(`Top deck ${card.name}`, async function () {
          let removed = await cardLocation.removeCardById(card.id);
          if (removed) {
            await getDeck().addCard(card);
            if (cardLocation.id !== getDeck().id)
              cardLocationTrack.setLocation();
          }
          getButtonPanel().clear_buttons();
          resolve("Tracker activate finish");
        });
        getButtonPanel().add_button("Decline", function () {
          getButtonPanel().clear_buttons();
          resolve("Tracker activate finish");
        });
      });
    }
  }
}
class Fool extends Card {
  constructor() {
    super(
      "Fool",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.FATE,
      "Nocturne/"
    );
    this.description =
      "If you aren't the player with Lost in the Woods: take it, take 3 Boons, and receive the Boons in any order. Heirloom: Lucky Coin";
  }
  async play() {
    if (!stateHolder.has_card((c) => c.name === "Lost_in_the_Woods")) {
      await receive_state(new Lost_in_the_Woods());
      await receive_boon();
      await receive_boon();
      await receive_boon();
    }
  }
  do_passive() {
    if (stateHolder.has_card((c) => c.name === "Lost_in_the_Woods")) {
      const lostInTheWood = stateHolder.getStateByName("Lost_in_the_Woods");
      stateHolder.removeState(lostInTheWood);
    }
  }
}
class Bard extends Card {
  constructor() {
    super(
      "Bard",
      new Cost(4),
      Card.Type.ACTION + " " + Card.Type.FATE,
      "Nocturne/"
    );
  }
  async play() {
    await getBasicStats().addCoin(2);
    await receive_boon();
  }
}
class BlessedVillage extends Card {
  constructor() {
    super(
      "BlessedVillage",
      new Cost(4),
      Card.Type.ACTION + " " + Card.Type.FATE,
      "Nocturne/"
    );
    this.description =
      "When you gain this, take a Boon. Receive it now or at the start of your next turn.";
    this.activate_when_start_turn = false;
    this.chosen_id = null;
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(2);
  }
  async is_gained() {
    let boonCard = takeABoonAsBlessedVillage();
    if (!boonCard) return;
    await new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction(`BlessedVillage: Receive Boon now or next turn.`);

      getButtonPanel().add_button("Now", async function () {
        clearFunc();
        await receiveBoonAsBlessedVillage(boonCard.id);
        resolve();
      });
      getButtonPanel().add_button(
        "Net turn",
        function () {
          clearFunc();
          this.chosen_id = boonCard.id;
          effectBuffer.addCard(this);
          this.activate_when_start_turn = true;
          resolve();
        }.bind(this)
      );
    });
  }
  should_activate(reason) {
    return reason === REASON_START_TURN && this.chosen_id;
  }
  async activate(reason) {
    this.activate_when_start_turn = false;
    effectBuffer.removeCardById(this.id);
    await receiveBoonAsBlessedVillage(this.chosen_id);
  }
}
class Idol extends Card {
  constructor() {
    super(
      "Idol",
      new Cost(5),
      Card.Type.TREASURE + " " + Card.Type.ATTACK + " " + Card.Type.FATE,
      "Nocturne/"
    );
    this.description =
      "If you have an odd number of Idols in play (counting this), receive a Boon; otherwise, each other player gains a Curse.";
  }
  async play() {
    await getBasicStats().addCoin(2);
    let idol_count = getPlayField()
      .getCardAll()
      .filter((c) => c.name === "Idol").length;
    if (idol_count % 2 !== 0) {
      await receive_boon();
    } else {
      await this.attack();
    }
  }
  async attack() {
    await attack_other(this);
  }
  async is_attacked() {
    await gain_card_name("Curse");
  }
}
class SacredGrove extends Card {
  static MESSAGE = "+1Coin";
  static RESPONSE = "Response";
  constructor() {
    super(
      "SacredGrove",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.FATE,
      "Nocturne/"
    );
    this.description =
      "Receive a Boon. If it doesn't give +$1, each other player may receive it.";
  }
  async play() {
    await getBasicStats().addBuy(1);
    await getBasicStats().addCoin(3);
    let new_boon = await receive_boon();
    if (!new_boon) return;
    let boonName = new_boon.name;
    if (!["TheFieldsGift", "TheForestsGift"].includes(boonName)) {
      for (let opponent of opponentManager.getOpponentList()) {
        await message_other(this, boonName, opponent.username);
      }
    }
  }
  receive_message(boonName) {
    //TODO: ket hop voi river gift bi sai.
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction(`SacredGrove: You may receive ${boonName}.`);

      getButtonPanel().add_button("Receive", async function () {
        clearFunc();
        await receiveBoonAsSacredGroveOther(boonName);
        resolve(SacredGrove.RESPONSE);
      });
      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve(SacredGrove.RESPONSE);
      });
    });
  }
}

//Normal cards
class FaithfulHound extends Card {
  constructor() {
    super(
      "FaithfulHound",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.REACTION,
      "Nocturne/"
    );
    this.activate_when_end_turn = false;
    this.activate_when_end_your_turn = false;

    this.activate_when_discard = true;
    this.description =
      "When you discard this other than during Clean-up, you may set it aside, and put it into your hand at end of turn.";
  }
  async play() {
    //TODO: At the end of turn (not only your turn)
    await drawNCards(2);
  }

  should_activate(reason, card) {
    return (
      reason === REASON_END_TURN ||
      reason === REASON_END_YOUR_TURN ||
      (reason === REASON_WHEN_DISCARD &&
        card &&
        card.id === this.id &&
        getPlayer().phase !== PHASE_CLEAN_UP)
    );
  }
  async activate(reason, card) {
    if (reason === REASON_END_TURN || reason === REASON_END_YOUR_TURN) {
      this.activate_when_end_turn = false;
      this.activate_when_end_your_turn = false;
      let removed = await getSetAside().removeCardById(this.id);
      if (removed) {
        await getHand().addCard(this);
      }
      effectBuffer.removeCardById(this.id);
    } else if (reason === REASON_WHEN_DISCARD) {
      await this.activate_step1();
    }
  }
  activate_step1() {
    if (getPlayer().phase === PHASE_CLEAN_UP) return;
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        `${this.name}: You may set this aside, and put into hand at the end of turn.`
      );

      getButtonPanel().add_button(
        "Set aside",
        async function () {
          clearFunc();
          let removed = await getDiscard().removeCardById(this.id);
          if (removed) {
            await set_aside_card(this);
            effectBuffer.addCard(this);
            this.activate_when_end_turn = true;
            this.activate_when_end_your_turn = true;
          }
          resolve();
        }.bind(this)
      );
      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve();
      });
    });
  }
}
class SecretCave extends Card {
  constructor() {
    super(
      "SecretCave",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Nocturne/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = true;
    this.activate_when_in_play = true;
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);
    if (getHand().getLength() < 3) return;
    return new Promise((resolve) => {
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        await getHand().remove_mark();
      };

      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("Cancel", async function () {
        await clearFunc();
        resolve();
      });
      let chosen = 0;
      let card_list = [];
      getHand().mark_cards(
        (c) => chosen < 3,
        async function (card) {
          chosen += 1;
          card_list.push(card);
          if (chosen === 3 && card_list.length === 3) {
            if (card_list.length > 0) {
              await discardCardList(card_list);
            }
            this.not_discard_in_cleanup = true;
            await clearFunc();
            resolve();
          }
        }.bind(this),
        "discard"
      );
    });
  }
  should_activate(reason, card) {
    return reason === REASON_START_TURN;
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = false;
    await getBasicStats().addCoin(3);
  }
}
class Cemetery extends Card {
  constructor() {
    super("Cemetery", new Cost(4), Card.Type.VICTORY, "Nocturne/");
  }
  play() {}
  async add_score() {
    await getBasicStats().addScore(2);
  }
  is_gained() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      this.chosen = 0;
      this.card_list = [];
      let clearFunc = async function () {
        await getHand().remove_mark();
        getButtonPanel().clear_buttons();
      };
      getButtonPanel().clear_buttons();
      getButtonPanel().add_button(
        "Confirm Trashing",
        async function () {
          if (this.card_list.length > 0) {
            await trashCardList(this.card_list);
          }
          await clearFunc();
          resolve("Cemetery finish");
        }.bind(this)
      );

      getHand().mark_cards(
        function () {
          if (this.chosen < 4) {
            return true;
          }
          return false;
        }.bind(this),
        function (card) {
          if (this.chosen < 4) {
            this.chosen += 1;
            this.card_list.push(card);
          }
        }.bind(this),
        "trash"
      );
    });
  }
}
class Conclave extends Card {
  constructor() {
    super("Conclave", new Cost(4), Card.Type.ACTION, "Nocturne/");
  }
  async play() {
    await getBasicStats().addCoin(2);
    if (!getHand().has_card((c) => getType(c).includes(Card.Type.ACTION)))
      return;
    return new Promise(async (resolve) => {
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        await getHand().remove_mark();

        getSupportHand().clear();
        getSupportHand().hide();
        getDeck().removeCanSelect();
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "You may play an Action card from your hand that you dont have a copy of in play."
      );

      getButtonPanel().add_button("Cancel", async function () {
        await clearFunc();
        resolve("Conclave finish");
      });

      let mayPlayAction = mayPlayCardFromHand(
        function (card) {
          return (
            getType(card).includes(Card.Type.ACTION) &&
            !getPlayField().has_card((c) => c.name === card.name)
          );
        },
        async function (card) {
          await clearFunc();

          await play_card(card);
          await getBasicStats().addAction(1);

          resolve("Conclave finish");
        }
      );
      if (!mayPlayAction) {
        await clearFunc();
        resolve();
      }
    });
  }
}
class Necromancer extends Card {
  constructor() {
    super("Necromancer", new Cost(4), Card.Type.ACTION, "Nocturne/");
    this.chosen_id_list = [];
    this.activate_when_in_play = false;
    this.activate_when_start_cleanup = false;
    this.description =
      "Choose a face up, non-Duration Action card in the trash. Turn it face down for the turn, and play it, leaving it there. Setup: Put the 3 Zombies into the trash";
  }
  async setup() {
    await getTrash().addCardList([
      new ZombieApprentice(),
      new ZombieMason(),
      new ZombieSpy(),
    ]);
  }
  play() {
    if (getTrash().getLength() <= 0) return;
    this.chosen_id_list = [];
    return new Promise(async (resolve) => {
      let supportHand = getSupportHand();
      supportHand.clear();
      let clearFunc = function () {
        supportHand.clear();
      };

      await supportHand.setCardAll(getTrash().getCardAll());
      let is_marked = supportHand.mark_cards(
        function (card) {
          return (
            getType(card).includes(Card.Type.ACTION) &&
            !getType(card).includes(Card.Type.DURATION) &&
            !card.is_face_down
          );
        },
        async function (card) {
          clearFunc();

          card.is_face_down = true;
          this.activate_when_in_play = true;
          this.activate_when_start_cleanup = true;
          this.chosen_id_list.push(card.id);
          await play_card(card, false);

          resolve();
        }.bind(this),
        "choose"
      );

      if (!is_marked) {
        clearFunc();
        resolve();
      }
    });
  }
  should_activate(reason, card) {
    //TODO: Dung ra phai la activate when end turn
    if (reason === REASON_START_CLEANUP && this.chosen_id_list.length > 0) {
      for (let id of this.chosen_id_list) {
        let card = getTrash().getCardById(id);
        if (card) {
          card.is_face_down = false;
        }
      }
      this.chosen_id_list = [];
      this.activate_when_start_cleanup = false;
    }

    return false;
  }
  activate(reason) {
    for (let id of this.chosen_id_list) {
      let card = getTrash().getCardById(id);
      if (card) {
        card.is_face_down = false;
      }
    }
  }
}
class Shepherd extends Card {
  constructor() {
    super("Shepherd", new Cost(4), Card.Type.ACTION, "Nocturne/");
  }
  async play() {
    await getBasicStats().addAction(1);
    if (getHand().getLength() <= 0) return;
    return new Promise(async (resolve) => {
      let card_list = [];

      let clearFunc = async function () {
        getButtonPanel();
        await getHand().remove_mark();
      };

      getButtonPanel().clear_buttons();
      getButtonPanel().add_button("OK", async function () {
        await clearFunc();
        if (card_list.length > 0) {
          await discardCardList(card_list);
          await drawNCards(2 * card_list.length);
        }
        resolve();
      });

      let is_marked = getHand().mark_cards(
        (c) => getType(c).includes(Card.Type.VICTORY),
        function (card) {
          card_list.push(card);
        },
        "discard"
      );
      if (!is_marked) {
        await clearFunc();
        resolve();
      }
    });
  }
}
class Pooka extends Card {
  constructor() {
    super("Pooka", new Cost(5), Card.Type.ACTION, "Nocturne/");
  }
  async play() {
    return new Promise(async (resolve) => {
      let chosen = 0;
      let clearFunc = async function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        await getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "You may trash a Treasure other than Cursed Gold from your hand"
      );

      getButtonPanel().add_button("Cancel", async function () {
        await clearFunc();
        resolve();
      });
      let is_marked = getHand().mark_cards(
        (c) =>
          getType(c).includes(Card.Type.TREASURE) &&
          c.name !== "CursedGold" &&
          chosen === 0,
        async function (card) {
          chosen += 1;
          await clearFunc();

          await trash_card(card);
          await drawNCards(4);

          resolve();
        },
        "trash"
      );

      if (!is_marked) {
        await clearFunc();
        resolve();
      }
    });
  }
}
class TragicHero extends Card {
  constructor() {
    super("TragicHero", new Cost(5), Card.Type.ACTION, "Nocturne/");
  }
  async play() {
    await drawNCards(3);
    await getBasicStats().addBuy(1);
    if (getHand().getLength() >= 8) {
      let removed = await getPlayField().removeCardById(this.id);
      if (removed) {
        await trash_card(this, false);
      } else return;
      await this.play_step1();
    }
  }
  play_step1() {
    return new Promise((resolve) => {
      markSupplyPile(
        (pile) =>
          pile.getQuantity() > 0 && pile.getType().includes(Card.Type.TREASURE),
        async function (pile) {
          await gain_card(pile);
          removeMarkSupplyPile();
          resolve();
        }
      );
    });
  }
}

export {
  Bat,
  Changeling,
  Cobbler,
  Crypt,
  Den_of_Sin,
  DevilsWorkshop,
  Exorcist,
  GhostTown,
  Guardian,
  Monastery,
  NightWatchman,
  Raider,
  Vampire,
  Werewolf, //Night
  Wish,
  Will_o_Wisp,
  Imp,
  Ghost,
  ZombieApprentice,
  ZombieMason,
  ZombieSpy, //Non supply
  Leprechaun,
  Skulk,
  CursedVillage,
  Tormentor, //DOOM
  Druid,
  Pixie,
  Tracker,
  Fool,
  Bard,
  BlessedVillage,
  Idol,
  SacredGrove, //FATE
  FaithfulHound,
  SecretCave,
  Cemetery,
  Conclave,
  Necromancer,
  Shepherd,
  Pooka,
  TragicHero,
};
