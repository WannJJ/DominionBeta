import { Trait } from "../landscape_effect.js";
import {
  REASON_START_BUY,
  REASON_END_TURN,
  REASON_WHEN_GAIN,
  REASON_START_CLEANUP,
  REASON_START_TURN,
  REASON_AFTER_PLAY,
  REASON_WHEN_DISCARD_FROM_PLAY,
  REASON_ON_PLAY,
  REASON_SHUFFLE,
  shufflingEffectManager,
  REASON_END_YOUR_TURN,
} from "../../game_logic/ReactionEffectManager.js";
import { findSupplyPile } from "../../features/TableSide/SupplyPile.jsx";
import { getBasicStats } from "../../features/PlayerSide/PlayerSide.jsx";
import {
  discard_card,
  drawNCards,
  gain_card,
  gain_card_name,
  gainCardByType,
  play_card,
  reveal_card,
  set_aside_card,
  trash_card,
} from "../../game_logic/Activity.js";
import { Card, Cost } from "../cards.js";
import {
  getHand,
  getPlayField,
} from "../../features/PlayerSide/CardHolder/CardHolder.jsx";
import { getButtonPanel } from "../../features/PlayerSide/ButtonPanel.jsx";
import { setInstruction } from "../../features/PlayerSide/Instruction.jsx";
import { getSetAside } from "../../features/PlayerSide/BottomLeftCorner/SideArea.jsx";
import {
  getDeck,
  getDiscard,
} from "../../features/PlayerSide/CardPile/CardPile.jsx";
import { getSupportHand } from "../../features/SupportHand.jsx";
import { shuffleArray } from "../../utils/helpers.js";
import { PlayerProfile } from "../../game_logic/PlayerProfile.js";
import { getType } from "../../game_logic/basicCardFunctions.js";
/*
class  extends Trait{
    constructor(){
        super('', "Plunder/Trait/");
    }
}
*/
class Cheap extends Trait {
  constructor() {
    super("Cheap", "Plunder/Trait/");
  }
  analyseCardCost(card, tempCost) {
    if (!this.chosen_pile_name) return tempCost;
    let chosenPile = this.getChosenPile();
    if (chosenPile.isOriginOf(card)) {
      let cost = new Cost(0, 0);
      cost.addCost(tempCost);
      cost.subtractCost(new Cost(1));

      return cost;
    }
    return tempCost;
  }
  should_activate(reason, card) {}
  async activate(reason, card) {}
}
class Cursed extends Trait {
  constructor() {
    super("Cursed", "Plunder/Trait/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card) {
    let chosenPile = this.getChosenPile();
    return reason === REASON_WHEN_GAIN && card && chosenPile.isOriginOf(card);
  }
  async activate(reason, card) {
    await gainCardByType(Card.Type.LOOT);
    await gain_card_name("Curse");
  }
}
class Fated extends Trait {
  constructor() {
    super("Fated", "Plunder/Trait/");
    this.activate_when_shuffle = true;
  }
  should_activate(reason) {
    let chosenPile = this.getChosenPile();
    return (
      reason === REASON_SHUFFLE &&
      shufflingEffectManager
        .getToShuffleList()
        .find((card) => chosenPile.isOriginOf(card))
    );
  }
  async activate(reason) {
    let toShuffleList = shufflingEffectManager.getToShuffleList();
    let chosenPile = this.getChosenPile();
    let fatedList = toShuffleList.filter((card) => chosenPile.isOriginOf(card));
    if (fatedList.length === 0) return;

    let supportHand = getSupportHand();
    supportHand.clear();
    await supportHand.setCardAll(toShuffleList);

    while (supportHand.has_card((card) => chosenPile.isOriginOf(card))) {
      let endWhile = await new Promise((resolve) => {
        let clearFunc = function () {
          getButtonPanel().clear_buttons();
          setInstruction("");
          supportHand.remove_mark();
        };
        getButtonPanel().clear_buttons();
        setInstruction("Fated: You may put Fated card on the top or bottom");

        getButtonPanel().add_button("Decline", function () {
          clearFunc();
          resolve(true);
        });
        supportHand.mark_cards(
          (card) => chosenPile.isOriginOf(card),
          async function (card) {
            clearFunc();
            await supportHand.removeCardById(card.id);
            shufflingEffectManager.removeCard(card);
            await reveal_card(card);

            await new Promise((resolve0) => {
              getButtonPanel().add_button("Top", function () {
                getButtonPanel().clear_buttons();
                shufflingEffectManager.putTop(card);
                resolve0();
              });

              getButtonPanel().add_button("Bottom", function () {
                getButtonPanel().clear_buttons();
                shufflingEffectManager.putBottom(card);
                resolve0();
              });
            });

            resolve(false);
          }.bind(this),
          "choose"
        );
      });

      if (endWhile) {
        break;
      }
    }
    supportHand.clear();
    supportHand.hide();
  }
}
class Fawning extends Trait {
  constructor() {
    super("Fawning", "Plunder/Trait/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card) {
    let chosenPile = this.getChosenPile();
    return (
      reason === REASON_WHEN_GAIN &&
      card &&
      card.name === "Province" &&
      chosenPile.getQuantity() > 0
    );
  }
  async activate(reason, card) {
    let chosenPile = this.getChosenPile();
    await gain_card(chosenPile);
  }
}
class Friendly extends Trait {
  constructor() {
    super("Friendly", "Plunder/Trait/");
    this.activate_when_start_cleanup = true;
    this.turn = -1;
  }
  should_activate(reason) {
    let chosenPile = this.getChosenPile();
    return (
      reason === REASON_START_CLEANUP &&
      getHand().has_card((card) => chosenPile.isOriginOf(card))
    );
  }
  activate(reason) {
    let chosenPile = this.getChosenPile();
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "Friendly: You may discard Friendly card to gain another Friendly card."
      );

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve();
      });

      let contain_card = getHand().mark_cards(
        function (card) {
          return chosenPile.isOriginOf(card);
        },
        async function (card) {
          clearFunc();
          await discard_card(card, true);
          await gain_card(chosenPile);
          resolve();
        }.bind(this),
        "discard"
      );

      if (!contain_card) {
        clearFunc();
        resolve();
      }
    });
  }
}
class Hasty extends Trait {
  constructor() {
    super("Hasty", "Plunder/Trait/");
    this.activate_when_gain = true;
    this.activate_when_start_turn = false;
    this.chosen_id_list = [];
  }
  should_activate(reason, card) {
    this.chosenPile = this.getChosenPile();
    return (
      (reason === REASON_WHEN_GAIN &&
        card &&
        this.chosenPile.isOriginOf(card)) ||
      (reason === REASON_START_TURN && this.chosen_id_list.length > 0)
    );
  }
  async activate(reason, card, activity, cardLocationTrack) {
    if (reason === REASON_WHEN_GAIN) {
      if (!card || !cardLocationTrack) return;
      let cardLocation = cardLocationTrack.getLocation();
      if (cardLocation && cardLocation.getCardById(card.id)) {
        if (cardLocation.id === getSetAside().id) return;
        let removed = await cardLocation.removeCardById(card.id);
        if (removed) {
          await set_aside_card(card);
          this.chosen_id_list.push(card.id);
          this.activate_when_start_turn = true;
          cardLocationTrack.setLocation();
        }
      }
    } else if (reason === REASON_START_TURN) {
      if (this.chosen_id_list.length === 0) return;

      let idList = this.chosen_id_list;
      this.chosen_id_list = [];
      this.activate_when_start_turn = false;
      while (idList.length > 0) {
        if (idList === 1) {
          await this.activate_step1(idList);
          return;
        } else {
          let id = idList.pop();
          let chosenCard = await getSetAside().removeCardById(id);
          if (chosenCard) {
            await play_card(chosenCard);
          }
        }
      }
    }
  }
  async activate_step1(idList) {
    let chosenCard = await getSetAside().remove(idList[0]);
    if (chosenCard) await play_card(chosenCard);
  }
}
class Inherited extends Trait {
  constructor() {
    super("Inherited", "Plunder/Trait/");
    //TODO: Multiplayer mode
  }
  async setup() {
    await super.setup();
    let chosenPile = this.getChosenPile();

    await new Promise(async (resolve) => {
      let chosen = 0;
      let supportHand = getSupportHand();
      supportHand.clear();
      let clearFunc = function () {
        supportHand.clear();
        setInstruction("");
      };
      setInstruction(
        `Inherited: Replace a card from starting deck with ${this.chosen_pile_name}.`
      );

      await supportHand.setCardAll(getDeck().getCardAll());
      supportHand.mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          chosen += 1;
          await supportHand.removeCardById(card.id);
          let cardList = supportHand.getCardAll();
          let ordinal_number = PlayerProfile.getOrdinalNumber();
          let inheritedCard = null;
          while (ordinal_number >= 0 && chosenPile.getQuantity() > 0) {
            inheritedCard = await chosenPile.popNextCard();
            ordinal_number -= 1;
          }

          if (inheritedCard) {
            cardList.push(inheritedCard);
          }
          shuffleArray(cardList);

          await getDeck().setCardAll(cardList);
          clearFunc();
          resolve();
        },
        "discard"
      );
    });
  }
  should_activate(reason, card) {}
  async activate(reason, card) {}
}
class Inspiring extends Trait {
  constructor() {
    super("Inspiring", "Plunder/Trait/");
    this.activate_after_play = true;
  }
  should_activate(reason, card) {
    let chosenPile = this.getChosenPile();
    return reason === REASON_AFTER_PLAY && card && chosenPile.isOriginOf(card);
  }
  activate(reason) {
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction(
        "Inspiring: You may play an Action that you dont have a copy in play."
      );

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve();
      });

      let contain_action = getHand().mark_cards(
        function (card) {
          return (
            getType(card).includes(Card.Type.ACTION) &&
            !getPlayField().has_card((c) => c.name === card.name)
          );
        },
        async function (card) {
          clearFunc();
          let removed = await getHand().removeCardById(card.id);
          if (removed) await play_card(card);
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
class Nearby extends Trait {
  constructor() {
    super("Nearby", "Plunder/Trait/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card) {
    let chosenPile = this.getChosenPile();
    return reason === REASON_WHEN_GAIN && card && chosenPile.isOriginOf(card);
  }
  async activate(reason, card) {
    await getBasicStats().addBuy(1);
  }
}
class Patient extends Trait {
  constructor() {
    super("Patient", "Plunder/Trait/");
    this.activate_when_start_cleanup = true;
    this.activate_when_start_turn = false;
    this.chosen_id_list = [];
  }
  should_activate(reason) {
    let chosenPile = this.getChosenPile();
    return (
      (reason === REASON_START_CLEANUP &&
        getHand().has_card((card) => chosenPile.isOriginOf(card))) ||
      (reason === REASON_START_TURN && this.chosen_id_list.length > 0)
    );
  }
  async activate(reason) {
    if (reason === REASON_START_CLEANUP) {
      await this.activate_step1();
    } else if (reason === REASON_START_TURN) {
      if (this.chosen_id_list.length === 0) return;
      while (this.chosen_id_list.length > 0) {
        let id = this.chosen_id_list.pop();
        let removed = await getSetAside().removeCardById(id);
        if (!removed) continue;
        await play_card(removed);
      }
      this.chosen_id_list = [];
      this.activate_when_start_turn = false;
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
      setInstruction(
        "Patient: You may set aside Patient cards from your hand."
      );
      let cardList = [];
      let chosenPile = this.getChosenPile();

      getButtonPanel().add_button(
        "OK",
        async function () {
          clearFunc();
          for (let card of cardList) {
            let removed = await getHand().removeCardById(card.id);
            if (!removed) continue;
            await set_aside_card(card);
            this.chosen_id_list.push(card.id);
            this.activate_when_start_turn = true;
          }
          resolve();
        }.bind(this)
      );

      let contain_patient = getHand().mark_cards(
        function (card) {
          return chosenPile.isOriginOf(card);
        },
        function (card) {
          cardList.push(card);
        },
        "choose"
      );

      if (!contain_patient) {
        clearFunc();
        resolve();
      }
    });
  }
}
class Pious extends Trait {
  constructor() {
    super("Pious", "Plunder/Trait/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card) {
    let chosenPile = this.getChosenPile();
    return reason === REASON_WHEN_GAIN && card && chosenPile.isOriginOf(card);
  }
  activate(reason) {
    if (getHand().getLength() <= 0) return;
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction("Pious: You may trash a card from your hand.");
      let chosen = 0;

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve();
      });

      getHand().mark_cards(
        function (card) {
          return chosen === 0;
        },
        async function (card) {
          chosen += 1;
          clearFunc();
          await trash_card(card);
          resolve();
        },
        "trash"
      );
    });
  }
}
class Reckless extends Trait {
  constructor() {
    super("Reckless", "Plunder/Trait/");
    this.activate_on_play = true;
    this.activate_when_discard_from_play = true;
  }
  should_activate(reason, card) {
    let chosenPile = this.getChosenPile();
    return (
      card &&
      chosenPile.isOriginOf(card) &&
      (reason === REASON_ON_PLAY || reason === REASON_WHEN_DISCARD_FROM_PLAY)
    );
  }
  async activate(reason, card) {
    if (reason === REASON_ON_PLAY) {
      await card.play();
      await card.play();
    } else if (reason === REASON_WHEN_DISCARD_FROM_PLAY) {
      if (!card || !getPlayField().getCardById(card.id)) return;
      let chosenPile = this.getChosenPile();

      let removed = await getPlayField().removeCardById(card.id);
      if (removed) await chosenPile.return_card(card);
    }
  }
}
class Rich extends Trait {
  constructor() {
    super("Rich", "Plunder/Trait/");
    this.activate_when_gain = true;
  }
  should_activate(reason, card) {
    let chosenPile = this.getChosenPile();
    return reason === REASON_WHEN_GAIN && card && chosenPile.isOriginOf(card);
  }
  async activate(reason, card) {
    await gain_card_name("Silver");
  }
}
class Shy extends Trait {
  constructor() {
    super("Shy", "Plunder/Trait/");
    this.activate_when_start_turn = true;
  }
  should_activate(reason) {
    let chosenPile = this.getChosenPile();
    return (
      reason === REASON_START_TURN &&
      getHand().has_card((card) => chosenPile.isOriginOf(card))
    );
  }
  activate(reason) {
    let chosenPile = this.getChosenPile();
    return new Promise((resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
        getHand().remove_mark();
      };
      getButtonPanel().clear_buttons();
      setInstruction("Shy: You may discard one Shy card for +2 Cards");
      let chosen = 0;

      getButtonPanel().add_button("Decline", function () {
        clearFunc();
        resolve();
      });

      getHand().mark_cards(
        function (card) {
          return chosen === 0 && chosenPile.isOriginOf(card);
        },
        async function (card) {
          chosen += 1;
          clearFunc();
          await discard_card(card);
          await drawNCards(2);
          resolve();
        },
        "discard"
      );
    });
  }
}
class Tireless extends Trait {
  constructor() {
    super("Tireless", "Plunder/Trait/");
    this.activate_when_discard_from_play = true;
    this.activate_when_end_turn = false;
    this.activate_when_end_your_turn = false;
    this.chosen_id_list = [];
  }
  should_activate(reason, card) {
    let chosenPile = this.getChosenPile();
    return (
      (reason === REASON_WHEN_DISCARD_FROM_PLAY &&
        card &&
        chosenPile.isOriginOf(card) &&
        getPlayField().getCardById(card.id)) ||
      ((reason === REASON_END_TURN || reason === REASON_END_YOUR_TURN) &&
        this.chosen_id_list.length > 0)
    );
  }
  async activate(reason, card) {
    if (reason === REASON_WHEN_DISCARD_FROM_PLAY) {
      let removed = await getPlayField().removeCardById(card.id);
      if (removed) {
        await set_aside_card(card);
        this.chosen_id_list.push(card.id);
        this.activate_when_end_turn = true;
        this.activate_when_end_your_turn = true;
      }
    } else if (reason === REASON_END_TURN || reason === REASON_END_YOUR_TURN) {
      if (this.chosen_id_list.length === 0) return;
      while (this.chosen_id_list.length > 0) {
        let id = this.chosen_id_list.pop();
        let removed = await getSetAside().removeCardById(id);
        if (!removed) continue;
        await getDeck().topDeck(removed);
      }
      this.chosen_id_list = [];
      this.activate_when_end_turn = false;
      this.activate_when_end_your_turn = false;
    }
  }
}

export {
  Cheap,
  Cursed,
  Fated,
  Fawning,
  Friendly,
  Hasty,
  Inherited,
  Inspiring,
  Nearby,
  Patient,
  Pious,
  Reckless,
  Rich,
  Shy,
  Tireless,
};
