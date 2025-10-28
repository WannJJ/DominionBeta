import { Card, Cost } from "../cards.js";
import {
  REASON_START_TURN,
  REASON_END_TURN,
  REASON_AFTER_PLAY,
  REASON_WHEN_GAIN,
  REASON_WHEN_ANOTHER_GAIN,
  effectBuffer,
  REASON_WHEN_DISCARD_FROM_PLAY,
  REASON_WHEN_TRASH,
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
  getSetAside,
} from "../../features/PlayerSide/BottomLeftCorner/SideArea.jsx";

import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";
import { getSupportHand } from "../../features/SupportHand.jsx";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import {
  draw1,
  drawNCards,
  mix_discard_to_deck,
  play_card,
  gain_card,
  gain_card_name,
  discard_card,
  trash_card,
  set_aside_card,
  attack_other,
  gainCardByType,
  gain_card_from_trash,
  mayPlayCardFromHand,
  Activity,
  trashCardList,
  discardCardList,
} from "../../game_logic/Activity.js";
import { getGameState } from "../../game_logic/GameState.js";
import { findSupplyPile } from "../../features/TableSide/SupplyPile.jsx";
import { opponentManager } from "../../features/OpponentSide/Opponent.js";
import { getLogger } from "../../Components/Logger.jsx";
import { getCost, getType } from "../../game_logic/basicCardFunctions.js";
/*
class  extends Card{
    constructor(){
        super("", , Card.Type.TREASURE, "Plunder/");
    }
    play(){
        
    } 
}
*/

//NORMAL SUPPLY CARDS
// Cards can gain LOOT
class JewelledEgg extends Card {
  constructor() {
    super("JewelledEgg", new Cost(2), Card.Type.TREASURE, "Plunder/");
    this.activate_when_trash = true;
  }
  async play() {
    await getBasicStats().addCoin(1);
    await getBasicStats().addBuy(1);
  }
  should_activate(reason, card) {
    return reason === REASON_WHEN_TRASH && card && card.id === this.id;
  }
  async activate(reason, card) {
    await gainCardByType(Card.Type.LOOT);
  }
}
class Search extends Card {
  constructor() {
    super(
      "Search",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_in_play = true;
    this.activate_when_gain = false;
    this.activate_when_another_gains = false;
    //TODO: Chua dung lam. Truong hop trash khien supply pile empty, hoac truong hop gain from trash, hoac truong hop exchange.
  }
  async play() {
    await getBasicStats().addCoin(2);
    this.not_discard_in_cleanup = true;
    this.activate_when_gain = true;
    this.activate_when_another_gains = true;
  }
  should_activate(reason, card) {
    return (
      (reason === REASON_WHEN_GAIN || reason === REASON_WHEN_ANOTHER_GAIN) &&
      card &&
      findSupplyPile(
        (pile) => pile.getQuantity() === 0 && pile.isOriginOf(card)
      )
    );
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = false;
    this.activate_when_gain = false;
    this.activate_when_another_gains = false;
    let removed = await getPlayField().removeCardById(this.id);
    if (removed) {
      await trash_card(this, false);
      await gainCardByType(Card.Type.LOOT);
    }
  }
}
class Pickaxe extends Card {
  constructor() {
    super("Pickaxe", new Cost(5), Card.Type.TREASURE, "Plunder/");
  }
  async play() {
    await getBasicStats().addCoin(1);
    if (getHand().length() > 0) {
      return new Promise((resolve) => {
        let chosen = 0;

        getHand().mark_cards(
          function (card) {
            return chosen === 0;
          },
          async function (card) {
            if (chosen === 0) {
              getHand().remove_mark();
              chosen = 1;
              let cost = getCost(card);
              await trash_card(card);
              if (cost && cost.coin >= 3) {
                let new_loot = await gainCardByType(Card.Type.LOOT, getHand());
              }
              resolve("Pickaxe finish");
            }
          },
          "trash"
        );
      });
    }
  }
}
class WealthyVillage extends Card {
  constructor() {
    super("WealthyVillage", new Cost(5), Card.Type.ACTION, "Plunder/");
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(2);
  }
  async is_gained() {
    if (getPlayField().length <= 0) return;
    let diff_named_treasure = [];
    for (let card of getPlayField().getCardAll()) {
      if (!diff_named_treasure.includes(card.name)) {
        diff_named_treasure.push(card.name);
        if (diff_named_treasure.length >= 3) {
          await gainCardByType(Card.Type.LOOT);
          return;
        }
      }
    }
  }
}
class Cutthroat extends Card {
  constructor() {
    super(
      "Cutthroat",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION + " " + Card.Type.ATTACK,
      "Plunder/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_gain = false;
    this.activate_when_another_gains = false;
    this.activate_when_in_play = true;
  }
  async play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_gain = true;
    this.activate_when_another_gains = true;
    await attack_other(this);
  }
  attack() {}
  is_attacked() {
    if (getHand().length() <= 3) {
      return;
    }
    return new Promise((resolve) => {
      let chosen = 0;
      let cardList = [];
      let n = Math.max(getHand().length() - 3, 0);
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Discard down to 3 cards in hand.");

      getButtonPanel().add_button("OK", async function () {
        if (chosen < n) return;
        clearFunc();
        if (cardList.length > 0) {
          await discardCardList(cardList);
        }
        resolve("Cutthroat finish");
      });

      getHand().mark_cards(
        function (card) {
          return chosen < n;
        },
        function (card) {
          if (chosen < n) {
            chosen += 1;
            cardList.push(card);
          }
        },
        "discard"
      );
    });
  }
  should_activate(reason, card) {
    const cost = new Cost(5);
    return (
      (reason === REASON_WHEN_GAIN || reason === REASON_WHEN_ANOTHER_GAIN) &&
      card &&
      getType(card).includes(Card.Type.TREASURE) &&
      getCost(card).isGreaterOrEqual(cost)
    );
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = false;
    this.activate_when_gain = false;
    this.activate_when_another_gains = false;

    await gainCardByType(Card.Type.LOOT);
  }
}
class SackofLoot extends Card {
  constructor() {
    super("SackofLoot", new Cost(6), Card.Type.TREASURE, "Plunder/");
  }
  async play() {
    await getBasicStats().addBuy(1);
    await getBasicStats().addCoin(1);
    await gainCardByType(Card.Type.LOOT);
  }
}

class Cage extends Card {
  constructor() {
    super(
      "Cage",
      new Cost(2),
      Card.Type.TREASURE + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.chosen_id_list = [];
    this.activate_when_in_play = false;
    this.activate_when_end_turn = false;
    this.activate_when_end_your_turn = false;
    this.activate_when_gain = true;
    this.not_discard_in_cleanup = false;
  }
  async play() {
    if (getHand().getLength() <= 0) return;
    await new Promise((resolve) => {
      let chosen = 0;
      let cardList = [];
      this.chosen_id_list = [];
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      setInstruction("Set aside up to 4 cards from your hand");
      getButtonPanel().clear_buttons();

      getHand().mark_cards(
        function (card) {
          return chosen < 4;
        },
        function (card) {
          chosen += 1;
          cardList.push(card);
        },
        "choose"
      );
      getButtonPanel().add_button(
        "OK",
        async function () {
          clearFunc();
          if (cardList.length > 0) {
            this.activate_when_gain = true;
            this.activate_when_in_play = true;
            this.not_discard_in_cleanup = true;
            for (let card of cardList) {
              let removed = await getHand().removeCardById(card.id);
              if (removed) {
                await set_aside_card(card);
                this.chosen_id_list.push(card.id);
              }
            }
          }
          resolve();
        }.bind(this)
      );
    });
  }
  should_activate(reason, card) {
    return (
      (reason === REASON_WHEN_GAIN &&
        card &&
        getType(card).includes(Card.Type.VICTORY)) ||
      reason === REASON_END_TURN ||
      reason === REASON_END_YOUR_TURN
    );
  }
  async activate(reason, card) {
    if (
      reason === REASON_WHEN_GAIN &&
      card &&
      getType(card).includes(Card.Type.VICTORY)
    ) {
      this.activate_when_gain = false;
      this.activate_when_end_turn = true;
    } else if (reason === REASON_END_TURN || reason === REASON_END_YOUR_TURN) {
      for (let id of this.chosen_id_list) {
        let removed = await getSetAside().removeCardById(id);
        if (removed) {
          await getHand().addCard(removed);
        }
      }

      let removed = await getPlayField().removeCardById(this.id);
      if (removed) await trash_card(this, false);

      this.chosen_id_list = [];
      this.activate_when_in_play = false;
      this.activate_when_end_turn = false;
      this.activate_when_gain = true;
      this.not_discard_in_cleanup = false;
    }
  }
}

class Grotto extends Card {
  constructor() {
    super(
      "Grotto",
      new Cost(2),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.chosen_id_list = [];
  }
  async play() {
    await getBasicStats().addAction(1);

    if (getHand().getLength() <= 0) return;
    await new Promise((resolve) => {
      let chosen = 0;
      let cardList = [];
      this.chosen_id_list = [];
      let clearFunc = function () {
        getHand().remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      setInstruction("Set aside up to 4 cards from your hand");
      getButtonPanel().clear_buttons();

      getHand().mark_cards(
        function (card) {
          return chosen < 4;
        },
        function (card) {
          chosen += 1;
          cardList.push(card);
        },
        "choose"
      );
      getButtonPanel().add_button(
        "OK",
        async function () {
          clearFunc();
          if (cardList.length > 0) {
            this.activate_when_start_turn = true;
            this.activate_when_in_play = true;
            this.not_discard_in_cleanup = true;
            for (let card of cardList) {
              let removed = await getHand().removeCardById(card.id);
              if (removed) {
                await set_aside_card(card);
                this.chosen_id_list.push(card.id);
              }
            }
          }
          resolve();
        }.bind(this)
      );
    });
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate() {
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;

    let count = 0;
    let discardList = [];
    for (let id of this.chosen_id_list) {
      let removed = await getSetAside().removeCardById(id);
      if (removed) {
        discardList.push(removed);
        count += 1;
      }
    }
    if (discardList.length > 0) {
      await discardCardList(discardList, false);
    }
    await drawNCards(count);
  }
}
class Shaman extends Card {
  constructor() {
    super("Shaman", new Cost(2), Card.Type.ACTION, "Plunder/");
    this.activate_when_start_turn = true;
    this.description =
      "In games using this, at the start of your turn, gain a card from the trash costing up to $6.";
  }
  setup() {
    effectBuffer.addCard(this);
  }
  async play() {
    await getBasicStats().addAction(1);
    await getBasicStats().addCoin(1);
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      let chosen = 0;

      getButtonPanel().clear_buttons();
      setInstruction("You may trash a card from your hand");
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        getHand().remove_mark();
        setInstruction("");
      };

      getButtonPanel().add_button("Confirm Trashing", async function () {
        clearFunc();
        resolve("Shaman finish");
      });

      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          clearFunc();
          chosen += 1;
          await trash_card(card);
          resolve("Shaman finish");
        },
        "trash"
      );
    });
  }
  should_activate(reason, card) {
    let cost = new Cost(6);
    return (
      reason === REASON_START_TURN &&
      getTrash().length() > 0 &&
      getTrash().has_card((card) => cost.isGreaterOrEqual(getCost(card)))
    );
  }
  activate(reason, card) {
    if (getTrash().length() <= 0) return;
    let cost = new Cost(6);
    if (!getTrash().has_card((card) => cost.isGreaterOrEqual(getCost(card))))
      return;

    return new Promise(async (resolve) => {
      let chosen = 0;
      let supportHand = getSupportHand();
      supportHand.clear();
      let clearFunc = function () {
        setInstruction("");
        supportHand.clear();
      };
      setInstruction("Shaman: Gain a card from the trash costing up to 6");

      while (getTrash().length() > 0) {
        await supportHand.addCard(await getTrash().pop());
      }

      supportHand.mark_cards(
        function (card) {
          return chosen === 0 && cost.isGreaterOrEqual(getCost(card));
        },
        async function (card) {
          chosen += 1;
          await getTrash().addCardList(supportHand.getCardAll());
          clearFunc();
          await gain_card_from_trash(card);
          resolve("Shaman finish");
        },
        "choose"
      );
    });
  }
}
class SecludedShrine extends Card {
  constructor() {
    super(
      "SecludedShrine",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_gain = false;
    this.activate_when_in_play = true;
  }
  async play() {
    await getBasicStats().addCoin(1);
    this.not_discard_in_cleanup = true;
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
    if (getHand().length() <= 0 || !card) return;
    this.not_discard_in_cleanup = false;
    this.activate_when_gain = false;

    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      setInstruction("Trash up to 2 cards from your hand");
      let card_list = [];
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        getHand().remove_mark();
        setInstruction("");
      };

      getButtonPanel().add_button("Confirm Trashing", async function () {
        clearFunc();
        if (card_list.length > 0) {
          await trashCardList(card_list);
        }
        resolve("SecludedShrine activate finish");
      });
      getHand().mark_cards(
        function (card) {
          return card_list.length < 2;
        },
        function (card) {
          card_list.push(card);
        },
        "trash"
      );
    });
  }
}
class Siren extends Card {
  constructor() {
    super(
      "Siren",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.DURATION + " " + Card.Type.ATTACK,
      "Plunder/"
    );
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.activate_when_gain = false;
    this.activate_when_in_play = false;
  }
  async play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
    this.activate_when_in_play = true;
    await this.attack();
  }
  is_gained() {
    this.activate_when_gain = true;
    effectBuffer.addCard(this);
  }
  async attack() {
    await attack_other(this);
  }
  async is_attacked() {
    await gain_card_name("Curse");
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    return (
      reason === REASON_START_TURN ||
      (reason === REASON_WHEN_GAIN && card && card.id === this.id)
    );
  }
  async activate(reason, card, activity, cardLocationTrack) {
    if (reason === REASON_START_TURN) {
      this.not_discard_in_cleanup = false;
      this.activate_when_start_turn = false;
      while (
        getHand().length() < 8 &&
        (getDeck().length() > 0 || getDiscard().length() > 0)
      ) {
        await draw1();
      }
    } else if (reason === REASON_WHEN_GAIN) {
      this.activate_when_gain = false;
      await effectBuffer.removeCardById(this.id);
      if (!card || !cardLocationTrack) return;
      let cardLocation = cardLocationTrack.getLocation();

      if (cardLocation && cardLocation.getCardById(card.id)) {
        await this.activate_step1(cardLocationTrack);
      }
    }
  }
  async activate_step1(cardLocationTrack) {
    let cardLocation = cardLocationTrack.getLocation();
    if (
      getHand().getLength() <= 0 ||
      !getHand().has_card((card) => getType(card).includes(Card.Type.ACTION))
    ) {
      await this.activate_step2(cardLocationTrack);
      return;
    }

    await new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction("Siren: Trash Siren unless you trash an Action.");

      getButtonPanel().add_button(
        "Trash Siren",
        async function () {
          clearFunc();
          await this.activate_step2(cardLocationTrack);
          resolve();
        }.bind(this)
      );

      getHand().mark_cards(
        function (card) {
          return getType(card).includes(Card.Type.ACTION);
        },
        async function (card) {
          clearFunc();
          await trash_card(card);
          resolve();
        },
        "trash"
      );
    });
  }

  async activate_step2(cardLocationTrack) {
    let cardLocation = cardLocationTrack.getLocation();
    let removed = cardLocation.removeCardById(this.id);
    if (removed) {
      await trash_card(this, false);
      cardLocationTrack.setLocation();
    }
  }
}
class Stowaway extends Card {
  constructor() {
    super(
      "Stowaway",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.DURATION + " " + Card.Type.REACTION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.activate_when_in_hand = true;
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;
    this.activate_when_another_gains = true;
    this.activate_when_gain = true;
  }
  play() {
    this.activate_when_in_play = true;
    this.activate_when_start_turn = true;
    this.not_discard_in_cleanup = true;
    this.activate_when_another_gains = false;
    this.activate_when_gain = false;
  }
  should_activate(reason, card) {
    return (
      reason === REASON_START_TURN ||
      ((reason === REASON_WHEN_ANOTHER_GAIN || reason === REASON_WHEN_GAIN) &&
        card &&
        getType(card).includes(Card.Type.DURATION))
    );
  }
  async activate(reason, card) {
    if (reason === REASON_START_TURN) {
      await drawNCards(2);
      this.activate_when_in_play = false;
      this.activate_when_start_turn = false;
      this.not_discard_in_cleanup = false;
      this.activate_when_another_gains = true;
      this.activate_when_gain = true;
    } else if (
      (reason === REASON_WHEN_ANOTHER_GAIN || reason === REASON_WHEN_GAIN) &&
      card &&
      getType(card).includes(Card.Type.DURATION)
    ) {
      await this.activate_step1();
    }
  }
  activate_step1() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction("You may play Stowaway from your hand");

      getButtonPanel().add_button(
        "Play Stowaway",
        async function () {
          let removed = await getHand().removeCardById(this.id);
          if (removed) await play_card(this);

          clearFunc();
          resolve();
        }.bind(this)
      );
      getButtonPanel().add_button("Dont play", function () {
        clearFunc();
        resolve();
      });

      let contain_this = getHand().mark_cards(
        function (card) {
          return card.id === this.id;
        }.bind(this),
        async function (card) {
          clearFunc();
          let removed = await getHand().removeCardById(this.id);
          if (removed) await play_card(this);

          resolve();
        }.bind(this),
        "choose"
      );

      if (!contain_this) {
        clearFunc();
        resolve();
      }
    });
  }
}
class Taskmaster extends Card {
  constructor() {
    super(
      "Taskmaster",
      new Cost(3),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.activate_when_gain = false;
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;
  }
  async play() {
    await getBasicStats().addAction(1);
    await getBasicStats().addCoin(1);
    this.activate_when_gain = true;
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;
  }

  should_activate(reason, card) {
    let cost = new Cost(5);
    return (
      (reason === REASON_WHEN_GAIN && card && cost.isEqual(getCost(card))) ||
      reason === REASON_START_TURN
    );
  }
  async activate(reason, card) {
    if (reason === REASON_WHEN_GAIN) {
      this.activate_when_start_turn = true;
      this.not_discard_in_cleanup = true;
      this.activate_when_gain = false;
    } else if (reason === REASON_START_TURN) {
      await getBasicStats().addAction(1);
      await getBasicStats().addCoin(1);
      this.activate_when_gain = true;
      this.activate_when_start_turn = false;
      this.not_discard_in_cleanup = false;
    }
  }
}
class Abundance extends Card {
  constructor() {
    super(
      "Abundance",
      new Cost(4),
      Card.Type.TREASURE + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.activate_when_gain = false;
    this.not_discard_in_cleanup = false;
  }
  async play() {
    this.activate_when_gain = true;
    this.not_discard_in_cleanup = true;
  }
  should_activate(reason, card) {
    return (
      reason === REASON_WHEN_GAIN &&
      card &&
      getType(card).includes(Card.Type.ACTION)
    );
  }
  async activate() {
    await getBasicStats().addBuy(1);
    await getBasicStats().addCoin(3);
    this.activate_when_gain = false;
    this.not_discard_in_cleanup = false;
  }
}
class CabinBoy extends Card {
  constructor() {
    super(
      "CabinBoy",
      new Cost(4),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(1);
    this.activate_when_start_turn = true;
    this.not_discard_in_cleanup = true;
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate() {
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;

    await this.activate_step1();
  }
  activate_step1() {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      setInstruction("Choose one: +$2 or trash CabinBoy");
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };

      getButtonPanel().add_button("+$2", async function () {
        await getBasicStats().addCoin(2);

        clearFunc();
        resolve();
      });

      getButtonPanel().add_button(
        "Trash CabinBoy",
        async function () {
          clearFunc();
          let removed = await getPlayField().removeCardById(this.id);
          if (removed) {
            await trash_card(this, false);
            await this.activate_step2();
          }

          resolve();
        }.bind(this)
      );
    });
  }
  activate_step2() {
    return new Promise((resolve) => {
      setInstruction("Gain a Duration card");
      let clearFunc = function () {
        setInstruction("");
        removeMarkSupplyPile();
      };

      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 &&
            pile.getType().includes(Card.Type.DURATION)
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
class Crucible extends Card {
  constructor() {
    super("Crucible", new Cost(4), Card.Type.TREASURE, "Plunder/");
  }
  play() {
    if (getHand().getLength() <= 0) return;

    return new Promise((resolve) => {
      let clearFunc = function () {
        setInstruction("");
        getHand().remove_mark();
      };
      let chosen = 0;
      setInstruction("Trash a card from your hand");

      getHand().mark_cards(
        (card) => chosen === 0,
        async function (card) {
          chosen += 1;
          clearFunc();

          await trash_card(card);
          await getBasicStats().addCoin(getCost(card).getCoin());

          resolve();
        },

        "trash"
      );
    });
  }
}
class Flagship extends Card {
  constructor() {
    super(
      "Flagship",
      new Cost(4),
      Card.Type.ACTION + " " + Card.Type.DURATION + " " + Card.Type.COMMAND,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.activate_after_play = false;
    this.not_discard_in_cleanup = false;
  }
  async play() {
    await getBasicStats().addCoin(2);
    this.activate_after_play = true;
    this.not_discard_in_cleanup = true;
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
    this.not_discard_in_cleanup = false;
    if (!card) return;

    await play_card(card, false);
  }
}
class FortuneHunter extends Card {
  constructor() {
    super("FortuneHunter", new Cost(4), Card.Type.ACTION, "Plunder/");
  }
  async play() {
    await getBasicStats().addCoin(2);

    let supportHand = getSupportHand();
    supportHand.clear();

    if (getDeck().getLength() < 3) {
      await mix_discard_to_deck();
    }
    const n = Math.min(getDeck().getLength(), 3);
    if (n <= 0) return;
    for (let i = 0; i < n; i++) {
      await supportHand.addCard(await getDeck().pop());
    }
    supportHand.getCardAll().forEach((card) => (card.ff = undefined));
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
      getButtonPanel().clear_buttons();
      setInstruction("You may play a Treasure");
      let clearFunc = async function () {
        await supportHand.remove_mark();
        getButtonPanel().clear_buttons();
        setInstruction("");
      };

      let contain_treasure = supportHand.mark_cards(
        function (card) {
          return getType(card).includes(Card.Type.TREASURE);
        },
        async function (card) {
          card.ff = true;
          let removed = await supportHand.removeCardById(card.id);
          if (removed) await play_card(card, true);

          await clearFunc();
          resolve();
        },
        "choose"
      );
      if (!contain_treasure) {
        await clearFunc();
        resolve();
      }

      getButtonPanel().add_button("Cancel", async function () {
        await clearFunc();
        resolve("Fortune Hunter finish");
      });
    });
  }
  async play_step2() {
    let supportHand = getSupportHand();

    if (supportHand.getLength() === 1) {
      let card = await supportHand.pop();
      if (card) await getDeck().addCard(card);
      return;
    }
    if (supportHand.getLength() <= 0) return;

    await new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Put the rest back in any order");

      getButtonPanel().add_button("OK", async function () {
        await getDeck().addCardList(supportHand.getCardAll().reverse());

        supportHand.clear();
        clearFunc();
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
}
class Gondola extends Card {
  constructor() {
    super(
      "Gondola",
      new Cost(4),
      Card.Type.TREASURE + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;
  }
  play() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        setInstruction("");
        getButtonPanel().clear_buttons();
      };
      setInstruction("Choose now or a the start of your next turn");
      getButtonPanel().clear_buttons();

      getButtonPanel().add_button(
        "Now",
        async function () {
          clearFunc();
          await getBasicStats().addCoin(2);
          this.activate_when_start_turn = false;
          this.not_discard_in_cleanup = false;
          resolve();
        }.bind(this)
      );
      getButtonPanel().add_button(
        "Next turn",
        async function () {
          clearFunc();
          this.activate_when_start_turn = true;
          this.not_discard_in_cleanup = true;
          resolve();
        }.bind(this)
      );
    });
  }
  is_gained() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        setInstruction("");
        getButtonPanel().clear_buttons();
        getHand().remove_mark();

        getSupportHand().clear();
        getSupportHand().hide();
        getDeck().removeCanSelect();
      };
      setInstruction("You may play an Action card from your hand");
      getButtonPanel().clear_buttons();

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve();
      });

      let mayPlayAction = mayPlayCardFromHand(
        function (card) {
          return getType(card).includes(Card.Type.ACTION);
        },
        async function (card) {
          clearFunc();
          await play_card(card);

          resolve();
        }
      );
      if (!mayPlayAction) {
        clearFunc();
        resolve();
      }
    });
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate() {
    await getBasicStats().addCoin(2);
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;
  }
}
class HarborVillage extends Card {
  constructor() {
    super("HarborVillage", new Cost(4), Card.Type.ACTION, "Plunder/");
    this.description =
      "After the next Action you play this turn, if it gave you +$, +$1.";
    this.activate_after_play = false;
    this.activate_when_in_play = false;
    this.chosen_id = -1; // Save Activity id
  }
  async play() {
    await draw1();
    await getBasicStats().addAction(2);
    this.activate_after_play = true;
    this.activate_when_in_play = true;

    this.chosen_id = Activity.current.id;
    //TODO: Khong dung lam, khi ket hop ThroneRoom
  }
  should_activate(reason, card) {
    return (
      reason === REASON_AFTER_PLAY &&
      card &&
      Activity.current &&
      Activity.current.id > this.chosen_id &&
      getType(card).includes(Card.Type.ACTION)
    );
  }
  async activate(reason, card) {
    this.activate_after_play = false;
    this.chosen_id = -1;
    let id = card.id;
    if (getBasicStats().addCoinThisTurnIdList.find((x) => x === id)) {
      getBasicStats().addCoin(1);
    }
  }
}
class LandingParty extends Card {
  constructor() {
    super(
      "LandingParty",
      new Cost(4),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.not_discard_in_cleanup = false;
    this.activate_after_play = false;
  }
  async play() {
    await drawNCards(2);
    await getBasicStats().addAction(2);

    this.not_discard_in_cleanup = true;
    this.activate_after_play = true;
  }
  should_activate(reason, card) {
    return (
      reason === REASON_AFTER_PLAY &&
      getGameState().cards_played_this_turn.length === 1 &&
      card &&
      getType(card).includes(Card.Type.TREASURE)
    );
  }
  async activate(reason, card) {
    this.not_discard_in_cleanup = false;
    this.activate_after_play = false;
    let removed = await getPlayField().removeCardById(this.id);
    if (removed) {
      await getDeck().topDeck(this);
    }
  }
}
class Mapmaker extends Card {
  constructor() {
    super(
      "Mapmaker",
      new Cost(4),
      Card.Type.ACTION + " " + Card.Type.REACTION,
      "Plunder/"
    );
    this.activate_when_in_hand = true;
    this.activate_when_another_gains = true;
    this.activate_when_gain = true;
  }
  async play() {
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
    supportHand.getCardAll().forEach((card) => (card.mapmaker = undefined));
    await this.play_step1();

    // put the rest back in any order
    while (supportHand.length() >= 1) {
      let card = await supportHand.pop();
      if (card) {
        await discard_card(card, false);
      }
    }
    supportHand.clear();
  }
  play_step1() {
    if (getSupportHand().getLength() <= 0) return;
    return new Promise(async (resolve) => {
      let supportHand = getSupportHand();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        supportHand.remove_mark();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction("Put 2 cards into your hand");
      let chosen = 0;
      let n = Math.min(2, supportHand.length());

      supportHand.mark_cards(
        function () {
          return chosen < n;
        },
        async function (card) {
          card.mapmaker = true;
          chosen += 1;

          if (chosen === n) {
            clearFunc();

            let i = 0;
            while (i < supportHand.length()) {
              let card = supportHand.getCardAll()[i];
              if (card.mapmaker) {
                await supportHand.remove(card);
                await getHand().addCard(card);
                continue;
              }
              i++;
            }

            resolve();
          }
        },
        "choose"
      );
    });
  }
  should_activate(reason, card) {
    return (
      (reason === REASON_WHEN_ANOTHER_GAIN || reason === REASON_WHEN_GAIN) &&
      card &&
      getType(card).includes(Card.Type.VICTORY)
    );
  }
  activate(reason, card) {
    return new Promise((resolve) => {
      setInstruction("You may play Mapmaker from your hand");
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        setInstruction("");
        getButtonPanel().clear_buttons();
      };

      getButtonPanel().add_button(
        "Play Mapmaker",
        async function () {
          let removed = await getHand().removeCardById(this.id);
          clearFunc();

          if (removed) {
            await play_card(this);
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
class Maroon extends Card {
  constructor() {
    super("Maroon", new Cost(4), Card.Type.ACTION, "Plunder/");
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
          getHand().remove_mark();
          chosen += 1;
          await trash_card(card);

          let typeCount = getType(card).length;
          await drawNCards(typeCount * 2);

          resolve();
        },
        "trash"
      );
    });
  }
}
class Rope extends Card {
  constructor() {
    super(
      "Rope",
      new Cost(4),
      Card.Type.TREASURE + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
  }
  async play() {
    await getBasicStats().addCoin(1);
    await getBasicStats().addBuy(1);

    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate() {
    await draw1();
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;

    if (getHand().getLength() <= 0) return;
    await new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        getHand().remove_mark();
        setInstruction("");
      };
      let chosen = 0;
      getButtonPanel().clear_buttons();
      setInstruction("You may trash a card from your hand");

      getButtonPanel().add_button("Cancel", async function () {
        clearFunc();
        resolve("Rope finish");
      });

      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          clearFunc();
          chosen += 1;

          await trash_card(card);

          resolve("Rope finish");
        },
        "trash"
      );
    });
  }
}
class SwampShacks extends Card {
  constructor() {
    super("SwampShacks", new Cost(4), Card.Type.ACTION, "Plunder/");
  }
  async play() {
    await getBasicStats().addAction(2);

    let cardCount = getPlayField().getLength();
    await drawNCards(Math.floor(cardCount / 3));
  }
}
class Tools extends Card {
  constructor() {
    super("Tools", new Cost(4), Card.Type.TREASURE, "Plunder/");
    this.description = "Gain a copy of a card anyone has in play.";
  }
  play() {
    if (getPlayField().getLength() <= 0) return;

    let inPlayCardList = [
      ...getPlayField().getCardAll(),
      ...getPlayArea().getCardAll(),
    ];
    for (let opponent of opponentManager.getOpponentList()) {
      let opponentInPlayCardList = [
        ...opponent.playField,
        ...opponent.playArea,
      ];
      inPlayCardList.push(...opponentInPlayCardList);
    }
    let nameList = inPlayCardList.map((card) => card.name);
    if (nameList.length === 0) return;

    return new Promise((resolve) => {
      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 && nameList.includes(pile.getNextCard().name)
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
class BuriedTreasure extends Card {
  constructor() {
    super(
      "BuriedTreasure",
      new Cost(5),
      Card.Type.TREASURE + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = false;
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;
    this.activate_when_gain = false;
  }
  play() {
    this.activate_when_in_play = true;
    this.activate_when_start_turn = true;
    this.not_discard_in_cleanup = true;
  }
  async is_gained() {
    effectBuffer.addCard(this);
    this.activate_when_gain = true;
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    return (
      reason === REASON_START_TURN ||
      (reason === REASON_WHEN_GAIN && card && card.id === this.id)
    );
  }
  async activate(reason, card, activity, cardLocationTrack) {
    if (reason === REASON_START_TURN) {
      await getBasicStats().addBuy(1);
      await getBasicStats().addCoin(3);

      this.activate_when_start_turn = false;
      this.not_discard_in_cleanup = false;
    } else if (reason === REASON_WHEN_GAIN) {
      this.activate_when_gain = false;
      await effectBuffer.removeCardById(this.id);
      if (!card || !cardLocationTrack) return;
      let cardLocation = cardLocationTrack.getLocation();

      if (cardLocation && cardLocation.getCardById(card.id)) {
        let removed = await cardLocation.removeCardById(card.id);
        if (removed) {
          await play_card(this);
          cardLocationTrack.setLocation();
        }
      }
    }
  }
}
class Crew extends Card {
  constructor() {
    super(
      "Crew",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;
  }
  async play() {
    await drawNCards(3);

    this.activate_when_start_turn = true;
    this.not_discard_in_cleanup = true;
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate() {
    this.activate_when_start_turn = false;
    this.not_discard_in_cleanup = false;

    let removed = await getPlayField().removeCardById(this.id);
    if (removed) {
      await getDeck().topDeck(this);
    }
  }
}
class Enlarge extends Card {
  constructor() {
    super(
      "Enlarge",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
  }
  async play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;

    await this.play_step1();
  }
  play_step1() {
    if (getHand().getLength() <= 0) return;
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
          await this.play_step2(card);

          resolve();
        }.bind(this),
        "trash"
      );
    });
  }
  play_step2(card) {
    if (!card) return;
    return new Promise((resolve) => {
      let cost = new Cost(2);
      cost.addCost(getCost(card));

      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost())
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
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate() {
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;

    await this.play_step1();
  }
}
class Figurine extends Card {
  constructor() {
    super("Figurine", new Cost(5), Card.Type.TREASURE, "Plunder/");
  }
  async play() {
    await drawNCards(2);

    await new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      let chosen = 0;
      getButtonPanel().clear_buttons();
      setInstruction("You may discard an Action card for +1 Buy and +$1");

      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve();
      });

      let contain_action = getHand().mark_cards(
        function (card) {
          return chosen === 0 && getType(card).includes(Card.Type.ACTION);
        },
        async function (card) {
          clearFunc();

          await discard_card(card);
          await getBasicStats().addBuy(1);
          await getBasicStats().addCoin(1);

          resolve();
        },
        "discard"
      );

      if (!contain_action) {
        clearFunc();
        resolve();
      }
    });
  }
}
class FirstMate extends Card {
  constructor() {
    super("FirstMate", new Cost(5), Card.Type.ACTION, "Plunder/");
  }
  async play() {
    if (getHand().getLength() <= 0) return;
    let mayPlayAction = true;
    let cardName = null;
    let cardList = [];
    let userCancel = false;
    while (mayPlayAction && !userCancel) {
      await new Promise(async (resolve) => {
        getButtonPanel().clear_buttons();
        setInstruction(
          "FirstMate: Play any number of Action cards with same name from your hand."
        );
        let clearFunc = async function () {
          getButtonPanel().clear_buttons();
          setInstruction("");
          await getHand().remove_mark();

          getSupportHand().clear();
          getSupportHand().hide();
          getDeck().removeCanSelect();
        };

        getButtonPanel().add_button(
          "OK",
          async function () {
            userCancel = true;
            await clearFunc();
            resolve();
          }.bind(this)
        );

        mayPlayAction = mayPlayCardFromHand(
          function (card) {
            return (
              getType(card).includes(Card.Type.ACTION) &&
              (cardName == null || cardName === card.name)
            );
          },
          async function (card) {
            if (!cardName) cardName = card.name;
            cardList.push(card);
            await clearFunc();

            await play_card(card);

            resolve();
          }.bind(this)
        );
        if (!mayPlayAction) {
          await clearFunc();
          resolve();
        }
      });
    }

    await this.play_step2();
  }
  async play_step2() {
    while (
      getHand().getLength() < 6 &&
      (getDeck().length() > 0 || getDiscard().length() > 0)
    ) {
      await draw1();
    }
  }
}
class Frigate extends Card {
  constructor() {
    super(
      "Frigate",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION + " " + Card.Type.ATTACK,
      "Plunder/"
    );
    this.activate_when_in_play = false;
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;

    this.activate_after_play = false;
    this.turn = -1;
  }
  async play() {
    await getBasicStats().addCoin(3);
    await this.attack();

    this.activate_when_in_play = true;
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
  }
  async attack() {
    await attack_other(this);
  }
  is_attacked() {
    effectBuffer.addCard(this);
    this.activate_after_play = true;
    this.turn = getPlayer().turn;
  }
  should_activate(reason, card, activity) {
    if (reason === REASON_START_TURN) return true;
    if (reason !== REASON_AFTER_PLAY) return false;

    if (this.turn + 1 < getPlayer().turn) {
      this.activate_after_play = false;
      effectBuffer.removeCardById(this.id);
      this.turn = -1;
      return false;
    }
    return card && getType(card).includes(Card.Type.ACTION);
  }
  async activate(reason, card, activity) {
    if (reason === REASON_START_TURN) {
      this.not_discard_in_cleanup = false;
      this.activate_when_start_turn = false;
    } else if (reason === REASON_AFTER_PLAY) {
      if (getHand().getLength() <= 4) return;
      getLogger().writeMessage("Player is attacked by Frigate");
      await new Promise((resolve) => {
        let chosen = 0;
        let discardList = [];
        let n = Math.max(getHand().length() - 4, 0);

        let clearFunc = function () {
          getButtonPanel().clear_buttons();
          setInstruction("");
          getHand().remove_mark();
        };
        getButtonPanel().clear_buttons();
        setInstruction("Frigate: Discard down to 4 cards in hand.");

        getButtonPanel().add_button("OK", async function () {
          if (chosen < n) return;
          if (discardList.length > 0) {
            await discardCardList(discardList);
          }
          clearFunc();
          resolve();
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
  }
}
class Longship extends Card {
  constructor() {
    super(
      "Longship",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
  }
  async play() {
    await getBasicStats().addAction(2);

    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
  }
  should_activate(reason) {
    return reason === REASON_START_TURN;
  }
  async activate(reason) {
    await drawNCards(2);

    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
  }
}
class MiningRoad extends Card {
  constructor() {
    super("MiningRoad", new Cost(5), Card.Type.ACTION, "Plunder/");
    this.activate_when_in_play = true;
    this.activate_when_gain = true;
    this.turn = -1;
  }
  async play() {
    await getBasicStats().addAction(1);
    await getBasicStats().addBuy(1);
    await getBasicStats().addCoin(2);

    this.activate_when_gain = true;
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    return (
      reason === REASON_WHEN_GAIN &&
      card &&
      getType(card).includes(Card.Type.TREASURE) &&
      this.turn !== getPlayer().turn
    );
  }
  activate(reason, card, activity, cardLocationTrack) {
    if (!card || !cardLocationTrack) return;
    let cardLocation = cardLocationTrack.getLocation();

    if (!cardLocation || !cardLocation.getCardById(card.id)) return;
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };
      getButtonPanel().clear_buttons();
      setInstruction(`You may play ${card.name}`);

      getButtonPanel().add_button(
        `Play ${card.name}`,
        async function () {
          clearFunc();
          this.turn = getPlayer().turn;
          this.activate_when_gain = false;

          let removed = await cardLocation.removeCardById(card.id);
          if (removed) {
            await play_card(card);
            cardLocationTrack.setLocation();
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
class Pendant extends Card {
  constructor() {
    super("Pendant", new Cost(5), Card.Type.TREASURE, "Plunder/");
  }
  async play() {
    let cardNameList = [];
    for (let card of getPlayField().getCardAll()) {
      if (
        getType(card).includes(Card.Type.TREASURE) &&
        !cardNameList.includes(card.name)
      ) {
        cardNameList.push(card.name);
      }
    }
    await getBasicStats().addCoin(cardNameList.length);
  }
}
class Pilgrim extends Card {
  constructor() {
    super("Pilgrim", new Cost(5), Card.Type.ACTION, "Plunder/");
  }
  async play() {
    await drawNCards(4);
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
          chosen += 1;
          getHand().remove_mark();
          let removed = await getHand().removeCardById(card.id);
          if (removed) {
            await getDeck().topDeck(card);
          }
          resolve();
        },
        "choose"
      );
    });
  }
}
class Quartermaster extends Card {
  constructor() {
    super(
      "Quartermaster",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.DURATION,
      "Plunder/"
    );
    this.activate_when_in_play = true;
    this.not_discard_in_cleanup = false;
    this.activate_when_start_turn = false;
    this.chosen_id_list = [];
  }
  play() {
    this.not_discard_in_cleanup = true;
    this.activate_when_start_turn = true;
    this.chosen_id_list = [];
  }
  should_activate(reason, card, activity, cardLocationTrack) {
    return reason === REASON_START_TURN;
  }
  activate(reason, card, activity, cardLocationTrack) {
    return new Promise((resolve) => {
      getButtonPanel().clear_buttons();
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        removeMarkSupplyPile();
      };
      let cost = new Cost(4);

      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 && cost.isGreaterOrEqual(pile.getCost())
          );
        },
        async function (pile) {
          clearFunc();
          let card = await gain_card(pile, getSetAside());
          if (card && getSetAside().getCardById(card.id)) {
            this.chosen_id_list.push(card.id);
          }
          resolve();
        }.bind(this)
      );

      if (this.chosen_id_list.length > 0) {
        setInstruction(
          "Gain a card costing up to $4; or put a card into your hand."
        );
        getButtonPanel().add_button(
          "Put into hand",
          async function () {
            clearFunc();
            await this.activate_step1();
            resolve();
          }.bind(this)
        );
      } else {
        setInstruction("Gain a card costing up to $4");
      }
    });
  }
  async activate_step1() {
    if (this.chosen_id_list.length <= 0) return;

    if (this.chosen_id_list.length === 1) {
      let id = this.chosen_id_list.pop();
      let c = await getSetAside().removeCardById(id);
      if (c) {
        await getHand().addCard(c);
      }
      return;
    }

    await new Promise(async (resolve) => {
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
          supportHand.clear();
          supportHand.hide();
          resolve("Quartermaster activate step 1 finish");
        }.bind(this),
        "choose"
      );
    });
  }
}
class SilverMine extends Card {
  constructor() {
    super("SilverMine", new Cost(5), Card.Type.TREASURE, "Plunder/");
  }
  play() {
    return new Promise((resolve) => {
      let clearFunc = function () {
        setInstruction("");
        removeMarkSupplyPile();
      };
      setInstruction(
        "Gain a Treasure costing less than Silver Mine to your hand"
      );

      markSupplyPile(
        function (pile) {
          return (
            pile.getQuantity() > 0 &&
            pile.getType().includes(Card.Type.TREASURE) &&
            getCost(this).isGreaterThan(pile.getCost())
          );
        }.bind(this),
        async function (pile) {
          clearFunc();
          let card = await gain_card(pile, getHand());

          resolve();
        }
      );
    });
  }
}
class Trickster extends Card {
  constructor() {
    super(
      "Trickster",
      new Cost(5),
      Card.Type.ACTION + " " + Card.Type.ATTACK,
      "Plunder/"
    );
    this.activate_when_discard_from_play = false;
    this.activate_when_end_turn = false;
    this.activate_when_end_your_turn = false;
    this.chosen_id = null;
    this.turn = -1;
  }
  async play() {
    this.activate_when_discard_from_play = true;
    this.activate_when_end_turn = false;
    this.activate_when_end_your_turn = false;
    this.turn = getPlayer().turn;
    effectBuffer.addCard(this);
    await this.attack();
  }
  async attack() {
    await attack_other(this);
  }
  async is_attacked() {
    await gain_card_name("Curse");
  }
  should_activate(reason, card) {
    if (this.turn !== getPlayer().turn) {
      effectBuffer.removeCardById(this.id);
      this.activate_when_discard_from_play = false;
      this.activate_when_end_turn = false;
      this.activate_when_end_your_turn = false;
      this.chosen_id = null;
      this.turn = -1;
      return false;
    }
    return (
      (reason === REASON_WHEN_DISCARD_FROM_PLAY &&
        this.chosen_id == null &&
        card &&
        getType(card).includes(Card.Type.TREASURE)) ||
      ((reason === REASON_END_TURN || reason === REASON_END_YOUR_TURN) &&
        this.chosen_id)
    );
  }
  async activate(reason, card) {
    if (reason === REASON_WHEN_DISCARD_FROM_PLAY) {
      if (!card || !getPlayField().getCardById(card.id)) return;
      await new Promise((resolve) => {
        getButtonPanel().clear_buttons();
        setInstruction(`Trickster: You may set aside ${card.name}`);
        let clearFunc = function () {
          getButtonPanel().clear_buttons();
          setInstruction("");
        };

        getButtonPanel().add_button(
          "Set aside",
          async function () {
            clearFunc();
            let removed = await getPlayField().removeCardById(card.id);
            if (removed) {
              await set_aside_card(card);
              this.activate_when_discard_from_play = false;
              this.activate_when_end_turn = true;
              this.activate_when_end_your_turn = true;
              this.chosen_id = card.id;
            }
            resolve();
          }.bind(this)
        );
        getButtonPanel().add_button("Decline", function () {
          clearFunc();
          resolve();
        });
      });
    } else if (reason === REASON_END_TURN || reason === REASON_END_YOUR_TURN) {
      this.activate_when_end_turn = false;
      this.activate_when_end_your_turn = false;
      effectBuffer.removeCardById(this.id);
      let chosenCard = await getSetAside().removeCardById(this.chosen_id);
      if (!chosenCard) return;
      await getHand().addCard(chosenCard);
      this.chosen_id = null;
      this.turn = -1;
    }
  }
}
class KingsCache extends Card {
  constructor() {
    super("KingsCache", new Cost(7), Card.Type.TREASURE, "Plunder/");
  }
  play() {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      let chosen = 0;
      getButtonPanel().clear_buttons();
      setInstruction("You may play a Treasure from your hand 3 times");

      getButtonPanel().add_button("Cancel", function () {
        clearFunc();
        resolve();
      });

      let contain_treasure = getHand().mark_cards(
        function (card) {
          return getType(card).includes(Card.Type.TREASURE) && chosen < 1;
        },
        async function (card) {
          chosen += 1;
          clearFunc();

          let removed = await getHand().removeCardById(card.id);
          if (removed) {
            await play_card(card);

            removed = await getPlayField().removeCardById(card.id);
            if (removed) {
              await play_card(card);

              removed = await getPlayField().removeCardById(card.id);
              if (removed) {
                await play_card(card);
              }
            }
          }

          resolve();
        }
      );

      if (!contain_treasure) {
        clearFunc();
        resolve();
      }
    });
  }
}

export {
  JewelledEgg,
  Search,
  Pickaxe,
  WealthyVillage,
  Cutthroat,
  SackofLoot,
  Cage,
  Grotto,
  Shaman,
  SecludedShrine,
  Siren,
  Stowaway,
  Taskmaster,
  Abundance,
  CabinBoy,
  Crucible,
  Flagship,
  FortuneHunter,
  Gondola,
  HarborVillage,
  LandingParty,
  Mapmaker,
  Maroon,
  Rope,
  SwampShacks,
  Tools,
  BuriedTreasure,
  Crew,
  Enlarge,
  Figurine,
  FirstMate,
  Frigate,
  Longship,
  MiningRoad,
  Pendant,
  Pilgrim,
  Quartermaster,
  SilverMine,
  Trickster,
  KingsCache,
};
