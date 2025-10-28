import { Card, Cost, RootCard } from "../expansions/cards";
import { getLogger } from "../Components/Logger";
import { getGameState } from "./GameState";

import {
  getPlayField,
  getHand,
} from "../features/PlayerSide/CardHolder/CardHolder";
import { getButtonPanel } from "../features/PlayerSide/ButtonPanel";
import {
  getDiscard,
  getDeck,
  getTrash,
} from "../features/PlayerSide/CardPile/CardPile";
import { getBasicStats } from "../features/PlayerSide/PlayerSide";
import {
  getExile,
  getSetAside,
} from "../features/PlayerSide/BottomLeftCorner/SideArea";
import { getPlayer } from "../player";
import { findSupplyPile } from "../features/TableSide/SupplyPile";
import { findNonSupplyPile } from "../features/TableSide/NonSupplyPile";

import {
  Activity,
  report_save_activity,
  report_save_activity2,
  report_save_activity3,
} from "./report_save_activity";
import {
  ACTIVITY_OTHER_REACT_END_TURN,
  ACTIVITY_OTHER_REACT_GAIN,
  PHASE_ACTION,
  PHASE_BUY,
  PHASE_REACTION,
  PHASE_WAITING,
} from "../utils/constants";
import audioManager from "../Audio/audioManager";
import { opponentManager } from "../features/OpponentSide/Opponent";
import {
  reactionEffectManager,
  REASON_WHEN_DISCARD,
  REASON_WHEN_PLAY,
  REASON_WHEN_TRASH,
} from "./ReactionEffectManager";
import {
  HexBoonManager,
  stateHolder,
} from "../expansions/nocturne/HexBoonManager";
import { getClassFromName } from "../setup";
import { getSupportHand } from "../features/SupportHand";
import { setInstruction } from "../features/PlayerSide/Instruction";

import {
  ACTIVITY_PLAY,
  ACTIVITY_BUY,
  ACTIVITY_GAIN,
  ACTIVITY_BUY_GAIN,
  ACTIVITY_EXILE,
  ACTIVITY_RECEIVE,
  ACTIVITY_DISCARD,
  ACTIVITY_TRASH,
  ACTIVITY_REVEAL,
  ACTIVITY_DRAW,
  ACTIVITY_SHUFFLE,
  ACTIVITY_AUTOPLAY_TREASURES,
  ACTIVITY_ATTACK,
  ACTIVITY_END_REACT,
  //ACTIVITY_ACTIVATE = 'Activate',
  ACTIVITY_SET_ASIDE,
  ACTIVITY_PLAY_AS_WAY,
  ACTIVITY_MESSAGE_OTHER,
} from "../utils/constants";
import { getTableSide } from "../features/TableSide/TableSide";
import { create_number_picker } from "../Components/user_input/NumberPicker";
import { findLandscapeEffect } from "../features/TableSide/LandscapeEffect/LandscapeEffect";
import { getType } from "./basicCardFunctions";

/*
class Activity{
    current = null;
    constructor(username, name, card=null, cardList=[]){
        this.username = username;
        this.name = name;
        this.card = card;
        this.cardList = cardList;
        this.child_activity_list = [];
        this.origin = Activity.current; // 'Play in action phase, Play in buy phase, Buy in buy phase, Gain in buy phase, Play in night phase, other Activity, ...'
        Activity.current = this;
    }
    getCard(){
        return this.card;
    }
    getCardList(){
        return this.cardList;
    }
    createMockObject(){
        return {
            username: this.username,
            name: this.name,
            card: this.card.createMockObject(),
            cardList: this.cardList.map(card => card.createMockObject()),
        }
    }
}
*/

async function draw1() {
  //draw 1 card from deck
  let new_card = undefined;
  if (getDeck().length() <= 0) {
    await mix_discard_to_deck();
  }
  if (getDeck().length() > 0) {
    new_card = await getDeck().pop();
    await getHand().addCard(new_card);
    let activity = report_save_activity(ACTIVITY_DRAW, new_card);
    report_save_activity2(ACTIVITY_DRAW);
    activity.setFinish();
  }
  return new_card;
}
async function drawNCards(N) {
  let cardList = [],
    newCard = null;
  let deck = getDeck(),
    discard = getDiscard(),
    hand = getHand();
  let n = N;
  if (n <= 0) return cardList;

  if (n > getDeck().getLength()) {
    await mix_discard_to_deck();
  }

  while (n > 0 && deck.length() > 0) {
    newCard = await deck.pop();
    await hand.addCard(newCard);
    cardList.push(newCard);
    n -= 1;
  }

  if (cardList.length > 0) {
    let activity = report_save_activity(ACTIVITY_DRAW, null, cardList);
    report_save_activity2(`${ACTIVITY_DRAW} ${N} cards`);
    activity.setFinish();
  }
  return cardList;
}
async function mix_discard_to_deck() {
  if (getDiscard().length() > 0) {
    let cardList = getDiscard().getCardAll();
    await getDiscard().setCardAll([]);
    await shuffleCardsIntoDeck(cardList);
  }
}
async function shuffleCardsIntoDeck(cards) {
  if (!Array.isArray(cards)) throw new Error("");

  let shuffledCards = await reactionEffectManager.solve_cards_when_shuffle(
    cards
  );
  //shuffleArray(cards);
  await getDeck().setCardAll([...shuffledCards, ...getDeck().getCardAll()]);

  audioManager.playSound("shuffle");
  let activity = report_save_activity(ACTIVITY_SHUFFLE, undefined);
  report_save_activity2(ACTIVITY_SHUFFLE);
  activity.setFinish();
}
async function shuffleDeck() {
  // Use for Famine, Annex, Donate.
  let deckCards = getDeck().getCardAll();
  await getDeck().setCardAll([]);

  let shuffledCards = await reactionEffectManager.solve_cards_when_shuffle(
    deckCards
  );
  //shuffleArray(deckCards);
  await getDeck().setCardAll(shuffledCards);

  audioManager.playSound("shuffle");
  let activity = report_save_activity(ACTIVITY_SHUFFLE, undefined);
  report_save_activity2(ACTIVITY_SHUFFLE);
  activity.setFinish();
}

function mayPlayCardFromHand(conditionCallback, callback) {
  // Read Throne Room variant
  if (
    !getHand().has_card(
      (card) => !conditionCallback || conditionCallback(card)
    ) &&
    !getDeck().has_card(
      (card) =>
        getType(card).includes(Card.Type.SHADOW) &&
        (!conditionCallback || conditionCallback(card))
    )
  ) {
    return false;
  }

  let clearFunc = function () {
    getHand().remove_mark();
    getSupportHand().clear();
    getSupportHand().hide();
    getDeck().removeCanSelect();
  };

  let contain_action = getHand().mark_cards(
    function (card) {
      return !conditionCallback || conditionCallback(card);
    },
    async function (card) {
      clearFunc();
      let removed = await getHand().removeCardById(card.id);
      if (removed) {
        if (callback) {
          await callback(card);
        }
      }
    },
    "choose"
  );

  if (
    getDeck().has_card(
      (card) =>
        getType(card).includes(Card.Type.SHADOW) &&
        (!conditionCallback || conditionCallback(card))
    )
  ) {
    getDeck().setCanSelect(async function () {
      let supportHand = getSupportHand();
      supportHand.clear();

      await supportHand.setCardAll(
        getDeck()
          .getCardAll()
          .filter(
            (card) =>
              getType(card).includes(Card.Type.SHADOW) &&
              (!conditionCallback || conditionCallback(card))
          )
      );

      supportHand.mark_cards(
        (card) => true,
        async function (card) {
          clearFunc();
          supportHand.clear();
          supportHand.hide();

          let removed = await getDeck().removeCardById(card.id);
          if (removed) {
            if (callback) {
              callback(card);
            }
          }
        },
        "choose"
      );
    });
  }
  return true;
}

async function play_card(card, play_in_playField = true) {
  if (play_in_playField) {
    await getPlayField().addCard(card);
  }

  let activity = report_save_activity(ACTIVITY_PLAY, card);
  getLogger().indent_();

  await reactionEffectManager.solve_cards_first_when_play(card);
  if (getType(card).includes(Card.Type.ATTACK)) {
    await report_save_activity2(ACTIVITY_PLAY, card);
  } else {
    report_save_activity2(ACTIVITY_PLAY, card);
  }

  let playCardNormally = await reactionEffectManager.solve_cards_when_play(
    card,
    activity.origin ? true : false // || getPlayer().phase !== PHASE_ACTION
  );
  if (playCardNormally) {
    playCardNormally = await reactionEffectManager.solve_cards_on_play(card);
    if (playCardNormally) await card.play();
  }

  report_save_activity3(ACTIVITY_PLAY, card);
  await reactionEffectManager.solve_cards_after_playing(card);
  activity.setFinish();
  getLogger().deindent();
}

async function autoplay_treasures() {
  let treasure_list = [];
  let totalValue = 0;

  for (let i = 0; i < getHand().length(); i++) {
    let card = getHand().getCardAll()[i];
    if (
      getType(card).includes(Card.Type.TREASURE) &&
      ["Copper", "Silver", "Gold", "Platinum"].includes(card.name)
    ) {
      treasure_list.push(card);
      totalValue += card.value;
    }
  }
  if (treasure_list.length > 0) {
    let activity = report_save_activity(
      ACTIVITY_AUTOPLAY_TREASURES,
      null,
      treasure_list,
      `(+$${totalValue})`
    );
    getLogger().indent_();
    report_save_activity2(ACTIVITY_AUTOPLAY_TREASURES, null, treasure_list);

    for (let i = 0; i < treasure_list.length; i++) {
      let card = treasure_list[i];
      await getHand().remove(card);
      await getPlayField().addCard(card);

      await reactionEffectManager.solve_cards_first_when_play(card);

      let playCardNormally = await reactionEffectManager.solve_cards_when_play(
        card
      );
      if (playCardNormally) {
        await card.play();
      }

      await reactionEffectManager.solve_cards_after_playing(card);
    }

    getLogger().deindent();
    report_save_activity3(ACTIVITY_AUTOPLAY_TREASURES, null, treasure_list);
    activity.setFinish();
  }
}

function may_payoff_debt() {
  if (getBasicStats().getDebt() <= 0) return;
  return new Promise((resolve) => {
    //getButtonPanel().clear_buttons();
    setInstruction("You may pay off debt");
    let clearFunc = function () {
      setInstruction("");
    };

    let debt = getBasicStats().getDebt(),
      coin = getBasicStats().getCoin(),
      coffer = getBasicStats().getCoffer();
    create_number_picker(
      0,
      Math.min(debt, coin + coffer),
      async function (value) {
        clearFunc();
        getPlayer().can_play_treasure_buy_phase = false;
        if (coin >= value) {
          await getBasicStats().addCoin(-1 * value);
        } else {
          await getBasicStats().addCoffer(coin - value);
          await getBasicStats().setCoin(0);
        }
        if (debt >= value) {
          await getBasicStats().setDebt(debt - value);
        } else {
          await getBasicStats().setDebt(0);
        }

        resolve(value);
      }
    );
  });
}

async function pay_cost_when_buy(cost) {
  let property = new Cost(
    getBasicStats().getCoin() + getBasicStats().getCoffer(),
    0
  );
  if (getBasicStats().getDebt() > 0 || !property.sufficientToBuy(cost)) {
    throw new Error("ERROR BUYING");
  }
  await getBasicStats().addBuy(-1);
  if (getBasicStats().getCoin() >= cost.getCoin()) {
    await getBasicStats().setCoin(getBasicStats().getCoin() - cost.getCoin());
  } else {
    await getBasicStats().setCoffer(
      getBasicStats().getCoffer() - cost.getCoin() + getBasicStats().getCoin()
    );
    await getBasicStats().setCoin(0);
  }

  await getBasicStats().addDebt(cost.getDebt());
}

async function buy_landscape_card(effect_card) {
  if (getPlayer().phase !== PHASE_BUY || getBasicStats().getBuy() <= 0) {
    return false;
  }
  await pay_cost_when_buy(effect_card.getCost());

  let activity = report_save_activity(ACTIVITY_BUY, effect_card);
  getLogger().indent_();
  report_save_activity2(ACTIVITY_BUY, effect_card);
  await effect_card.is_buyed();

  getLogger().deindent();
  report_save_activity3(ACTIVITY_BUY, effect_card);
  activity.setFinish();
}

async function playCardAsWay(wayCard, card) {
  if (!wayCard || !card) throw new Error();
  let activity = report_save_activity(ACTIVITY_PLAY_AS_WAY, wayCard, [card]);
  getLogger().indent_();

  if (wayCard.type.includes("Way")) {
    await wayCard.play(card);
  } else {
    await wayCard.activate(REASON_WHEN_PLAY, card);
  }

  await report_save_activity2(ACTIVITY_PLAY_AS_WAY, wayCard, [card]);
  getLogger().deindent();
  activity.setFinish();
}

// Applying Stop-Moving Rule and No Visiting Rule
async function processGainCard(
  activityName,
  new_card,
  gainLocation = getDiscard()
) {
  // There are only 4 locations: discard, hand, deck (onto deck), set aside
  if (![ACTIVITY_BUY_GAIN, ACTIVITY_GAIN].includes(activityName))
    throw new Error("Invalid activityName in gaining process");
  if (!(new_card instanceof RootCard)) throw new Error("Invalid card");
  if (
    !gainLocation ||
    !["discard", "deck", "SetAside", "hand"].includes(gainLocation.id)
  ) {
    console.error("gainLocation,", gainLocation);
    throw new Error("Invalid gain location");
  }

  let activity = report_save_activity(activityName, new_card);
  getLogger().indent_();
  report_save_activity2(activityName, new_card);

  await new_card.is_gained();
  getPlayer().all_cards.push(new_card);

  if (gainLocation.id === "discard") {
    if (
      ["Den_of_Sin", "GhostTown", "Guardian", "NightWatchman"].includes(
        new_card.name
      )
    ) {
      gainLocation = getHand();
    } else if (new_card.name === "NomadCamp") {
      gainLocation = getDeck();
    }
  }
  await gainLocation.addCard(new_card);

  await getPlayer().update_score();
  report_save_activity3(activityName, new_card);
  await reactionEffectManager.solve_cards_when_gain(
    new_card,
    activity,
    gainLocation
  );
  await report_save_activity2(ACTIVITY_OTHER_REACT_GAIN, new_card);

  if (
    getExile().length() > 0 &&
    getExile().has_card((c) => c.name === new_card.name)
  ) {
    await remove_from_exile(new_card);
  }

  activity.setFinish();
  getLogger().deindent();
  return new_card;
}
async function gain_card(pile, gainLocation = getDiscard()) {
  // There are only 4 locations: discard, hand, deck (onto deck), set aside
  if (!pile || !pile.getQuantity() || pile.getQuantity() <= 0) {
    return undefined;
  }
  let new_card = await pile.popNextCard();
  if (!new_card) throw new Error("INVALID GAIN! Card not exists");

  let card = await processGainCard(ACTIVITY_GAIN, new_card, gainLocation);
  return card;
}
async function gain_card_from_trash(card, gainLocation = getDiscard()) {
  // Scrounge, Graverobber, Lurker, Rogue, Treasurer, Shaman
  if (!card) return undefined;

  let removed = await getTrash().remove(card);
  if (!removed) throw new Error("Card not found in trash");

  let card1 = await processGainCard(ACTIVITY_GAIN, card, gainLocation);
  return card1;
}
async function buy_and_gain_card(pile, gainLocation = getDiscard()) {
  if (
    getPlayer().phase !== PHASE_BUY ||
    getBasicStats().getBuy() <= 0 ||
    !pile ||
    !pile.getQuantity() ||
    pile.getQuantity() <= 0
  ) {
    return false;
  }
  await pay_cost_when_buy(pile.getCost());

  let new_card = await pile.popNextCard();
  if (!new_card) throw new Error("INVALID GAIN");

  let card = await processGainCard(ACTIVITY_BUY_GAIN, new_card, gainLocation);
  return card;
}

async function gain_card_name(name, gainLocation = getDiscard()) {
  //TODO: Test
  let pile = findSupplyPile(function (pile) {
    return pile.getQuantity() > 0 && pile.getNextCard().name === name;
  });
  if (pile) {
    return await gain_card(pile, gainLocation);
  } else {
    pile = findNonSupplyPile(function (pile) {
      return pile.getQuantity() > 0 && pile.getNextCard().name === name;
    });
    if (pile) {
      return await gain_card(pile, gainLocation);
    }
  }
  return undefined;
}
/**
 * Use for Castle, Loot
 * @param {*} typeName
 * @param {*} gainLocation
 * @returns
 */
async function gainCardByType(typeName, gainLocation = getDiscard()) {
  let pile = findSupplyPile(function (pile) {
    return pile.getQuantity() > 0 && pile.getType().includes(typeName);
  });
  if (pile) {
    return await gain_card(pile, gainLocation);
  } else {
    pile = findNonSupplyPile(function (pile) {
      return pile.getQuantity() > 0 && pile.getType().includes(typeName);
    });
    if (pile) {
      return await gain_card(pile, gainLocation);
    }
  }
}

/**
 * Use for Boon, Hex
 * @param {String} name
 */

async function receive_boon() {
  let nextCard = HexBoonManager.popNextBoon();
  if (!nextCard) return undefined;
  let activity = report_save_activity(ACTIVITY_RECEIVE, nextCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, nextCard);

  await HexBoonManager.receiveBoon(nextCard);

  report_save_activity3(ACTIVITY_RECEIVE, nextCard);
  activity.setFinish();
  getLogger().deindent();
  return nextCard;
}
function discardTopBoon() {
  // For Pixie
  let topBoon = HexBoonManager.popNextBoon();
  if (!topBoon) return;
  let activity = report_save_activity(ACTIVITY_DISCARD, topBoon);
  activity.setFinish();
  return topBoon;
}
async function receive_boon_twice(boonCard) {
  //For Pixie
  if (!boonCard) return;
  let activity = report_save_activity(ACTIVITY_RECEIVE, boonCard);
  let activity1 = report_save_activity(ACTIVITY_RECEIVE, boonCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);
  await HexBoonManager.receiveBoonTwice(boonCard);

  report_save_activity3(ACTIVITY_RECEIVE, boonCard);
  activity.setFinish();
  activity1.setFinish();
  getLogger().deindent();
  return boonCard;
}
function takeABoonAsBlessedVillage() {
  let boonCard = HexBoonManager.takeBoonAsBlessedVillage();
  if (!boonCard) return;
  let activity = report_save_activity(ACTIVITY_DISCARD, boonCard);
  activity.setFinish();
  return boonCard;
}
async function receiveBoonAsBlessedVillage(boonId) {
  if (!boonId) return;
  let boonCard = await HexBoonManager.popBoonAsBlessedVillage(boonId);
  if (!boonCard) return;
  let activity = report_save_activity(ACTIVITY_RECEIVE, boonCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);

  await HexBoonManager.receiveBoon(boonCard);

  report_save_activity3(ACTIVITY_RECEIVE, boonCard);
  activity.setFinish();
  getLogger().deindent();
  return boonCard;
}
async function setAsideTop3Boons() {
  // For Druid
  let top3Boons = HexBoonManager.popTop3Boons();
  if (top3Boons.length <= 0) return;
  await getTableSide().addNonSupplyPile({
    cardList: top3Boons,
    name: "Druid Boons",
  });
}
async function receiveBoonAsDruid(boonCard) {
  if (!boonCard) return;
  let activity = report_save_activity(ACTIVITY_RECEIVE, boonCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);

  await HexBoonManager.receiveBoon(boonCard, true);

  report_save_activity3(ACTIVITY_RECEIVE, boonCard);
  activity.setFinish();
  getLogger().deindent();
  return boonCard;
}
async function receiveBoonAsSacredGroveOther(boonName) {
  let cardClass = getClassFromName(boonName);
  let boonCard = new cardClass();
  let activity = report_save_activity(ACTIVITY_RECEIVE, boonCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);

  await HexBoonManager.receiveBoon(boonCard, true);
  report_save_activity3(ACTIVITY_RECEIVE, boonCard);
  activity.setFinish();
  getLogger().deindent();
  return boonCard;
}
async function receive_hex() {
  let nextCard = HexBoonManager.getNextHex();
  if (!nextCard) return undefined;
  let activity = report_save_activity(ACTIVITY_RECEIVE, nextCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, nextCard);

  let newCard = await HexBoonManager.receiveHex();

  report_save_activity3(ACTIVITY_RECEIVE, newCard);
  activity.setFinish();
  getLogger().deindent();
  return newCard;
}

async function receive_state(state_card) {
  if (!state_card) return;
  let activity = report_save_activity(ACTIVITY_RECEIVE, state_card);
  getLogger().indent_();
  report_save_activity2(ACTIVITY_RECEIVE, state_card);

  await state_card.is_received();
  stateHolder.addState(state_card);
  await getPlayer().update_score();

  report_save_activity3(ACTIVITY_RECEIVE, state_card);
  activity.setFinish();
  getLogger().deindent();
}

async function discard_card(card, from_hand = true) {
  if (from_hand) {
    if (!(await getHand().remove(card))) {
      throw new Error("CANT REMOVE FROM HAND");
    }
  }
  let activity = report_save_activity(ACTIVITY_DISCARD, card);
  getLogger().indent_();
  await getDiscard().addCard(card);
  report_save_activity2(ACTIVITY_DISCARD, card);

  await card.is_discarded();

  await reactionEffectManager.solve_cards_when_discard(card);
  report_save_activity3(ACTIVITY_DISCARD, card);
  activity.setFinish();
  getLogger().deindent();
  return true;
}

async function discardCardList(cardList = [], fromHand = true) {
  cardList = cardList.map((card) => card);
  if (cardList.length === 0) return;
  if (cardList.find((card) => !(card instanceof Card)))
    throw new Error("Invalid card, Cant discard");

  let discardedList = [];

  for (let card of cardList) {
    if (fromHand) {
      if (!(await getHand().remove(card))) {
        throw new Error("CANT TRASH");
      }
    }
    await getDiscard().addCard(card);
    await getPlayer().update_score();
    //await card.is_trashed();
    discardedList.push(card);

    let whenDiscardEffectList = reactionEffectManager.get_possible_cards(
      REASON_WHEN_DISCARD,
      card
    );
    if (whenDiscardEffectList.length > 0) {
      let activity = report_save_activity(
        ACTIVITY_DISCARD,
        null,
        discardedList
      );
      report_save_activity2(ACTIVITY_DISCARD, null, discardedList);
      getLogger().indent_();

      await reactionEffectManager.solve_cards_when_discard(card);
      getLogger().deindent();
      report_save_activity3(ACTIVITY_DISCARD, null, discardedList);
      activity.setFinish();
      discardedList = [];
    }
  }
  if (discardedList.length > 0) {
    let activity = report_save_activity(ACTIVITY_DISCARD, null, discardedList);
    report_save_activity2(ACTIVITY_DISCARD, null, discardedList);

    report_save_activity3(ACTIVITY_DISCARD, null, discardedList);
    activity.setFinish();
  }
  return true;
}

async function discardCard(card) {
  let activity = report_save_activity(ACTIVITY_DISCARD, card);
  getLogger().indent_();
  await getDiscard().addCard(card);
  report_save_activity2(ACTIVITY_DISCARD, card);

  await card.is_discarded();

  await reactionEffectManager.solve_cards_when_discard(card);
  report_save_activity3(ACTIVITY_DISCARD, card);
  activity.setFinish();
  getLogger().deindent();
  return true;
}
async function discardCardFromHand(card) {
  let removed = await getHand().remove(card);
  if (!removed) throw new Error("Cant remove from hand");
  await discardCard(card);
}
async function discardCardFromPlayField(card) {
  if (!card || !getPlayField().getCardById(card.id)) return;

  await reactionEffectManager.solve_cards_when_discard_from_play(card);
  if (!getPlayField().getCardById(card.id)) return;

  let removed = await getPlayField().removeCardById(card.id);
  if (!removed) throw new Error("Cant remove from play");
  await getDiscard().addCard(card);
}
async function trash_card(card, from_hand = true) {
  if (from_hand) {
    if (!(await getHand().remove(card))) {
      throw new Error("CANT TRASH");
    }
  }
  let activity = report_save_activity(ACTIVITY_TRASH, card);
  getLogger().indent_();
  await getTrash().addCard(card);
  report_save_activity2(ACTIVITY_TRASH, card);

  await card.is_trashed();

  await getPlayer().update_score();
  report_save_activity3(ACTIVITY_TRASH, card);
  await reactionEffectManager.solve_cards_when_trash(card);
  activity.setFinish();
  getLogger().deindent();
  return true;
}

async function trashCardList(cardList = [], fromHand = true) {
  cardList = cardList.map((card) => card);
  if (cardList.length === 0) return;
  if (cardList.find((card) => !(card instanceof Card)))
    throw new Error("Invalid card, Cant trash");

  let trashedList = [];

  for (let card of cardList) {
    if (fromHand) {
      if (!(await getHand().remove(card))) {
        throw new Error("CANT TRASH");
      }
    }
    await getTrash().addCard(card);
    await getPlayer().update_score();
    //await card.is_trashed();
    trashedList.push(card);

    let whenTrashedEffectList = reactionEffectManager.get_possible_cards(
      REASON_WHEN_TRASH,
      card
    );
    if (whenTrashedEffectList.length > 0) {
      let activity = report_save_activity(ACTIVITY_TRASH, null, trashedList);
      report_save_activity2(ACTIVITY_TRASH, null, trashedList);
      getLogger().indent_();

      await reactionEffectManager.solve_cards_when_trash(card);
      getLogger().deindent();
      report_save_activity3(ACTIVITY_TRASH, null, trashedList);
      activity.setFinish();
      trashedList = [];
    }
  }
  if (trashedList.length > 0) {
    let activity = report_save_activity(ACTIVITY_TRASH, null, trashedList);
    report_save_activity2(ACTIVITY_TRASH, null, trashedList);

    report_save_activity3(ACTIVITY_TRASH, null, trashedList);
    activity.setFinish();
    trashedList = [];
  }
  return true;
}

/*
async function activate_card(duration_card, reason, card){
    let activity = report_save_activity(ACTIVITY_ACTIVATE, duration_card); 
    await duration_card.activate(reason, card);
    await report_save_activity2(ACTIVITY_ACTIVATE, duration_card);
    activity.setFinish();
}
*/
async function reveal_card(card) {
  if (!card || !card.name || !card.type) return;
  if (Array.isArray(card)) {
    console.error("Khong dc co array o day");
    throw new Error();
  }

  let activity = report_save_activity(ACTIVITY_REVEAL, card);
  getLogger().indent_();

  report_save_activity2(ACTIVITY_REVEAL, card);
  activity.setFinish();
  getLogger().deindent();

  return card;
}
async function revealCardList(cardList) {
  if (!Array.isArray(cardList)) {
    console.error("CardList must be an array", cardList);
    throw new Error();
  }

  let activity = report_save_activity(ACTIVITY_REVEAL, null, cardList);
  getLogger().indent_();

  report_save_activity2(ACTIVITY_REVEAL, null, cardList);
  activity.setFinish();
  getLogger().deindent();

  return cardList;
}
function reveal_deck(n) {
  //reveal n cards from deck
  let new_cards = [];
  if (getDeck().length() < n) {
    mix_discard_to_deck();
  }
  while (getDeck().length() > 0 && new_cards.length < n) {
    new_cards.push(getDeck().pop());
  }
  return new_cards;
}
async function exile_card(card) {
  if (!card || !card.name || !card.type) return undefined;
  let activity = report_save_activity(ACTIVITY_EXILE, card);
  getLogger().indent_();

  await getExile().addCard(card);
  report_save_activity2(ACTIVITY_EXILE, card);

  await getPlayer().update_score();
  activity.setFinish();
  getLogger().deindent();
  return true;
}
async function set_aside_card(card) {
  let activity = report_save_activity(ACTIVITY_SET_ASIDE, card);
  getLogger().indent_();

  await getSetAside().addCard(card);
  report_save_activity2(ACTIVITY_SET_ASIDE, card);

  activity.setFinish();
  getLogger().deindent();
}
function remove_from_exile(gainCard) {
  let name = gainCard.name;
  return new Promise((resolve) => {
    if (
      getExile()
        .getCardAll()
        .filter((c) => c.name === name && c.id !== gainCard.id).length <= 0
    ) {
      getButtonPanel().clear_buttons();
      setInstruction("");
      resolve();
      return;
    }
    let clearFunc = function () {
      getButtonPanel().clear_buttons();
      setInstruction("");
    };
    getButtonPanel().clear_buttons();
    setInstruction(`You may discard ${name}(s) from exile.`);

    getButtonPanel().add_button(
      `Discard ${name} from exile`,
      async function () {
        clearFunc();
        let i = 0;
        while (i < getExile().length()) {
          let card = getExile().getCardAll()[i];
          if (card.name === name) {
            await getExile().remove(card);
            await getDiscard().addCard(card);
            continue;
          }
          i += 1;
        }
        resolve();
      }
    );
    getButtonPanel().add_button("Cancel", function () {
      clearFunc();
      resolve();
    });
  });
}
async function remove_sun_token() {
  let prophecy = findLandscapeEffect((component) =>
    component.getCard().type.includes("Prophecy")
  );
  if (prophecy) await prophecy.getCard().removeSunToken();
}

async function attack_other(card, additional_info) {
  if (!card || !card.name) return;

  if (opponentManager.getOpponentList().length <= 0) {
    let cardClass = getClassFromName(card.name);
    let attackCard = new cardClass();
    await is_attacked(attackCard, additional_info);
    //await is_attacked(card, additional_info);
  } else {
    let activity = report_save_activity(ACTIVITY_ATTACK, card.name);
    getLogger().indent_();

    await report_save_activity2(ACTIVITY_ATTACK, card, [], additional_info);
    activity.setFinish();
    getLogger().deindent();
  }
}

async function announceOtherEndTurn() {
  if (opponentManager.getOpponentList().length <= 0) return;
  getLogger().indent_();
  for (let opponent of opponentManager.getOpponentList()) {
    await report_save_activity2(
      ACTIVITY_OTHER_REACT_END_TURN,
      null,
      [],
      opponent.username
    );
  }

  getLogger().deindent();
}

// Use by Advisor, HauntedCastle, ChariotRace, Gladiator
async function message_other(card, message, username) {
  if (!card || !card.name) return;
  if (opponentManager.getOpponentList().length <= 0) return;
  if (opponentManager.getOpponentList().length <= 0) return;

  if (username) {
    message = `${username};${message}`;
  }
  let responseData = await report_save_activity2(
    ACTIVITY_MESSAGE_OTHER,
    card,
    [],
    message
  );
  if (responseData) return responseData.message;
}

async function react_other(username, JSONactivity, message) {
  let currentPhase = getPlayer().phase;

  if (currentPhase === PHASE_WAITING) getPlayer().setPhase(PHASE_REACTION);

  let activity = null;
  try {
    activity = JSON.parse(JSONactivity);
  } catch (e) {
    console.log(JSONactivity);
    console.error(e);
    console.trace();
  }
  let card_class = null;
  let card = null,
    cardList = [];

  if (activity.card) {
    card_class = getClassFromName(activity.card.name);
    card = new card_class(this);
    card.parseDataFromMockObject(activity.card, true);
  }
  if (Array.isArray(activity.cardList)) {
    cardList = activity.cardList.map((c) => {
      let cardClass = getClassFromName(c.name);
      let newCard = new cardClass();
      newCard.parseDataFromMockObject(c, true);
      return newCard;
    });
  }

  let new_activity = new Activity(username, activity.name, card, cardList);

  if (
    ![
      ACTIVITY_OTHER_REACT_GAIN,
      ACTIVITY_OTHER_REACT_END_TURN,
      ACTIVITY_MESSAGE_OTHER,
    ].includes(activity.name)
  )
    getLogger().writeActivity(new_activity);

  if (
    activity.name === ACTIVITY_PLAY &&
    card &&
    card.type.includes(Card.Type.ATTACK)
  ) {
    await reactionEffectManager.solve_cards_first_when_another_plays(
      card,
      new_activity
    );
  } else if (activity.name === ACTIVITY_ATTACK) {
    if (getPlayer().unaffected_id_list.find((cardId) => cardId === card.id)) {
    } else {
      await is_attacked(card, message);
    }
  } else if (activity.name === ACTIVITY_OTHER_REACT_GAIN) {
    await reactionEffectManager.solve_cards_when_another_gains(
      card,
      new_activity
    );
  } else if (activity.name === ACTIVITY_OTHER_REACT_END_TURN) {
    if (getPlayer().username !== message) return ["", ""];
    await reactionEffectManager.solve_cards_at_end_turn();
    return ["", ""];
  } else if (activity.name === ACTIVITY_MESSAGE_OTHER) {
    let splitMess = message.split(";");
    if (splitMess.length > 1) {
      let name = splitMess[0];
      if (name !== getPlayer().username) return ["", ""];

      message = splitMess[1];
    }
    let res = await card.receive_message(message);
    return ["", res];
  } else if (
    activity.name === ACTIVITY_PLAY ||
    (activity.name === ACTIVITY_BUY && card && card.type.includes("Event"))
  ) {
    await do_passive(card);
  }

  new_activity.setFinish();

  //getPlayer().phase = PHASE_WAITING;
  getPlayer().setPhase(currentPhase);

  let report = getGameState().create_report();

  let reactReport = report,
    reactMessage = `Agreee with ${activity.name} ${
      card ? card.name : ""
    } by ${username}`;
  return [reactReport, reactMessage];
}
async function do_passive(card) {
  await card.do_passive();
}
async function is_attacked(card, additional_info) {
  let player = getPlayer();
  player.can_not_be_attacked = false;
  await reactionEffectManager.solve_cards_when_another_attacks(card);
  if (!player.can_not_be_attacked) {
    await card.is_attacked(additional_info);
  }
}

export {
  Activity,
  draw1,
  drawNCards,
  mix_discard_to_deck,
  shuffleDeck,
  shuffleCardsIntoDeck,
  mayPlayCardFromHand,
  playCardAsWay,
  play_card,
  //playCardFromHandInPlayField,
  autoplay_treasures,
  may_payoff_debt,
  buy_and_gain_card,
  buy_landscape_card,
  gain_card,
  gain_card_name,
  gainCardByType,
  gain_card_from_trash,
  receive_boon,
  receive_hex,
  receive_state,
  receiveBoonAsBlessedVillage,
  takeABoonAsBlessedVillage,
  setAsideTop3Boons,
  receiveBoonAsDruid,
  receiveBoonAsSacredGroveOther,
  discardTopBoon,
  receive_boon_twice,
  discard_card,
  discardCardList,
  discardCardFromPlayField,
  //discardCard, discardCardFromHand,
  trash_card,
  trashCardList,
  //activate_card,
  reveal_card,
  revealCardList,
  reveal_deck,
  exile_card,
  set_aside_card,
  remove_sun_token,
  attack_other,
  announceOtherEndTurn,
  message_other,
  react_other,
  do_passive,
  is_attacked,
};
