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
  ACTIVITY_OTHER_REACT_GAIN,
  PHASE_BUY,
  PHASE_REACTION,
  PHASE_WAITING,
} from "../utils/constants";
import audioManager from "../Audio/audioManager";
import { opponentManager } from "../features/OpponentSide/Opponent";
import { reactionEffectManager } from "./ReactionEffectManager";
import {
  HexBoonManager,
  stateHolder,
} from "../expansions/nocturne/HexBoonManager";
import { getClassFromName } from "../setup";
import { shuffleArray } from "../utils/helpers";
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
    report_save_activity(ACTIVITY_DRAW, new_card);

    report_save_activity2(ACTIVITY_DRAW);
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

  /*
    if(cardList.length > 0){
        report_save_activity(ACTIVITY_DRAW, null, cardList);
        cardList = [];
    } 

    if(n > 0 && deck.length() <= 0 && discard.length() > 0) {
        await mix_discard_to_deck();
    }
    while(n > 0 && deck.length() > 0){
        newCard = await deck.pop();
        await hand.addCard(newCard);
        cardList.push(newCard);
        n -= 1;
    }
    */
  if (cardList.length > 0) {
    report_save_activity(ACTIVITY_DRAW, null, cardList);

    report_save_activity2(`${ACTIVITY_DRAW} ${N} cards`);
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

  await reactionEffectManager.solve_cards_when_shuffle(cards);
  shuffleArray(cards);
  await getDeck().setCardAll([...cards, ...getDeck().getCardAll()]);

  audioManager.playSound("shuffle");
  report_save_activity(ACTIVITY_SHUFFLE, undefined);

  report_save_activity2(ACTIVITY_SHUFFLE);
}
async function shuffleDeck() {
  // Use for Famine, Annex, Donate.
  let deckCards = getDeck().getCardAll();
  await getDeck().setCardAll([]);

  await reactionEffectManager.solve_cards_when_shuffle(deckCards);
  shuffleArray(deckCards);
  await getDeck().setCardAll(deckCards);

  audioManager.playSound("shuffle");
  report_save_activity(ACTIVITY_SHUFFLE, undefined);

  report_save_activity2(ACTIVITY_SHUFFLE);
}

function mayPlayCardFromHand(conditionCallback, callback) {
  // Read Throne Room variant
  if (
    !getHand().has_card(
      (card) => !conditionCallback || conditionCallback(card)
    ) &&
    !getDeck().has_card(
      (card) =>
        card.type.includes(Card.Type.SHADOW) &&
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
          callback(card);
        }
      }
    },
    "choose"
  );

  if (
    getDeck().has_card(
      (card) =>
        card.type.includes(Card.Type.SHADOW) &&
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
              card.type.includes(Card.Type.SHADOW) &&
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
  report_save_activity(ACTIVITY_PLAY, card);
  getLogger().indent_();

  if (card.type.includes(Card.Type.ATTACK)) {
    await report_save_activity2(ACTIVITY_PLAY, card);
  } else {
    report_save_activity2(ACTIVITY_PLAY, card);
  }

  // do the card's job
  /*TODO: Solve when_you_can_play_card_from_hand, (Cho Ways, Entchantress, Highwayman, Enlightenment) (Chi 1 cai co tac dung, do player chon)
             when_you_play_card_first, 
             when_another_player_plays_card_first
    */

  if (
    card.type.includes(Card.Type.ACTION) &&
    getPlayer().is_attacked_by_enchantress
  ) {
    getLogger().writeMessage("Player is attacked by Enchantress");
    await draw1();
    await getBasicStats().addAction(1);
    getPlayer().is_attacked_by_enchantress = false;
  } else {
    await card.play();
  }

  report_save_activity3(ACTIVITY_PLAY, card);
  await reactionEffectManager.solve_cards_when_play(card);
  getLogger().deindent();
}
async function playCard(card) {
  report_save_activity(ACTIVITY_PLAY, card);
  getLogger().indent_();

  if (card.type.includes(Card.Type.ATTACK)) {
    await report_save_activity2(ACTIVITY_PLAY, card);
  } else {
    report_save_activity2(ACTIVITY_PLAY, card);
  }

  // do the card's job
  if (
    card.type.includes(Card.Type.ACTION) &&
    getPlayer().is_attacked_by_enchantress
  ) {
    getLogger().writeMessage("Player is attacked by Enchantress");
    await draw1();
    await getBasicStats().addAction(1);
    getPlayer().is_attacked_by_enchantress = false;
  } else {
    await card.play();
  }

  report_save_activity3(ACTIVITY_PLAY, card);
  await reactionEffectManager.solve_cards_when_play(card);
  getLogger().deindent();
}
async function playCardInPlayField(card) {
  await getPlayField().addCard(card);
  await playCard(card);
}
async function playCardFromHandInPlayField(card) {
  let removed = await getHand().remove(card);
  if (!removed) return;
  await playCardInPlayField(card);
}
async function autoplay_treasures() {
  let treasure_list = [];
  let totalValue = 0;

  for (let i = 0; i < getHand().length(); i++) {
    let card = getHand().getCardAll()[i];
    if (
      card.type.includes(Card.Type.TREASURE) &&
      ["Copper", "Silver", "Gold", "Platinum"].includes(card.name)
    ) {
      treasure_list.push(card);
      totalValue += card.value;
    }
  }
  if (treasure_list.length > 0) {
    report_save_activity(
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

      await card.play();

      await reactionEffectManager.solve_cards_when_play(card);
    }

    getLogger().deindent();
    report_save_activity3(ACTIVITY_AUTOPLAY_TREASURES, null, treasure_list);
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
  await pay_cost_when_buy(effect_card.cost);

  report_save_activity(ACTIVITY_BUY, effect_card);
  getLogger().indent_();
  report_save_activity2(ACTIVITY_BUY, effect_card);
  await effect_card.is_buyed();

  getLogger().deindent();
  report_save_activity3(ACTIVITY_BUY, effect_card);
}

async function playCardAsWay(wayCard, card) {
  report_save_activity(ACTIVITY_PLAY_AS_WAY, wayCard, [card]);
  getLogger().indent_();
  await wayCard.play(card);

  //await report_save_activity2(ACTIVITY_PLAY_AS_WAY, wayCard, [card]);
  getLogger().deindent();
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
  report_save_activity(ACTIVITY_RECEIVE, nextCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, nextCard);

  await HexBoonManager.receiveBoon(nextCard);

  report_save_activity3(ACTIVITY_RECEIVE, nextCard);
  getLogger().deindent();
  return nextCard;
}
function discardTopBoon() {
  // For Pixie
  let topBoon = HexBoonManager.popNextBoon();
  if (!topBoon) return;
  report_save_activity(ACTIVITY_DISCARD, topBoon);
  return topBoon;
}
async function receive_boon_twice(boonCard) {
  //For Pixie
  if (!boonCard) return;
  report_save_activity(ACTIVITY_RECEIVE, boonCard);
  report_save_activity(ACTIVITY_RECEIVE, boonCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);
  await HexBoonManager.receiveBoonTwice(boonCard);

  report_save_activity3(ACTIVITY_RECEIVE, boonCard);
  getLogger().deindent();
  return boonCard;
}
function takeABoonAsBlessedVillage() {
  let boonCard = HexBoonManager.takeBoonAsBlessedVillage();
  if (!boonCard) return;
  report_save_activity(ACTIVITY_DISCARD, boonCard);
  return boonCard;
}
async function receiveBoonAsBlessedVillage(boonId) {
  if (!boonId) return;
  let boonCard = await HexBoonManager.popBoonAsBlessedVillage(boonId);
  if (!boonCard) return;
  report_save_activity(ACTIVITY_RECEIVE, boonCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);

  await HexBoonManager.receiveBoon(boonCard);

  report_save_activity3(ACTIVITY_RECEIVE, boonCard);
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
  report_save_activity(ACTIVITY_RECEIVE, boonCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, boonCard);

  await HexBoonManager.receiveBoon(boonCard, true);

  report_save_activity3(ACTIVITY_RECEIVE, boonCard);
  getLogger().deindent();
  return boonCard;
}
async function receive_hex() {
  let nextCard = HexBoonManager.getNextHex();
  if (!nextCard) return undefined;
  report_save_activity(ACTIVITY_RECEIVE, nextCard);
  getLogger().indent_();
  await report_save_activity2(ACTIVITY_RECEIVE, nextCard);

  let newCard = await HexBoonManager.receiveHex();

  report_save_activity3(ACTIVITY_RECEIVE, newCard);
  getLogger().deindent();
  return newCard;
}

async function receive_state(state_card) {
  if (!state_card) return;
  report_save_activity(ACTIVITY_RECEIVE, state_card);
  getLogger().indent_();
  report_save_activity2(ACTIVITY_RECEIVE, state_card);

  await state_card.is_received();
  stateHolder.addState(state_card);
  await getPlayer().update_score();

  report_save_activity3(ACTIVITY_RECEIVE, state_card);
  getLogger().deindent();
}

async function discard_card(card, from_hand = true) {
  if (from_hand) {
    if (!(await getHand().remove(card))) {
      throw new Error("CANT REMOVE FROM HAND");
    }
  }
  report_save_activity(ACTIVITY_DISCARD, card);
  getLogger().indent_();
  await getDiscard().addCard(card);
  report_save_activity2(ACTIVITY_DISCARD, card);

  await card.is_discarded();

  report_save_activity3(ACTIVITY_DISCARD, card);
  await reactionEffectManager.solve_cards_when_discard(card);
  getLogger().deindent();
  return true;
}
async function discardCard(card) {
  report_save_activity(ACTIVITY_DISCARD, card);
  getLogger().indent_();
  await getDiscard().addCard(card);
  report_save_activity2(ACTIVITY_DISCARD, card);

  await card.is_discarded();

  report_save_activity3(ACTIVITY_DISCARD, card);
  await reactionEffectManager.solve_cards_when_discard(card);
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
  report_save_activity(ACTIVITY_TRASH, card);
  getLogger().indent_();
  await getTrash().addCard(card);
  report_save_activity2(ACTIVITY_TRASH, card);

  await card.is_trashed();

  await getPlayer().update_score();
  report_save_activity3(ACTIVITY_TRASH, card);
  await reactionEffectManager.solve_cards_when_trash(card);
  getLogger().deindent();
  return true;
}
async function trashCard(card) {
  report_save_activity(ACTIVITY_TRASH, card);
  getLogger().indent_();
  await getTrash().addCard(card);
  report_save_activity2(ACTIVITY_TRASH, card);

  await card.is_trashed();

  await getPlayer().update_score();
  report_save_activity3(ACTIVITY_TRASH, card);
  await reactionEffectManager.solve_cards_when_trash(card);
  getLogger().deindent();
  return card;
}
async function trashCardFromHand(card) {
  let removed = await getHand().remove(card);
  if (!removed) throw new Error("Cant remove from hand");
  await trashCard(card);
}
async function trashCardFromPlayField(card) {
  let removed = await getPlayField().remove(card);
  if (!removed) throw new Error("Cant remove from play");
  await trashCard(card);
}

/*
async function activate_card(duration_card, reason, card){
    report_save_activity(ACTIVITY_ACTIVATE, duration_card); 
    await duration_card.activate(reason, card);
    await report_save_activity2(ACTIVITY_ACTIVATE, duration_card);
}
*/
async function reveal_card(card) {
  if (!card || !card.name || !card.type) return;
  if (Array.isArray(card)) {
    console.error("Khong dc co array o day");
    throw new Error();
  }

  report_save_activity(ACTIVITY_REVEAL, card);
  getLogger().indent_();

  report_save_activity2(ACTIVITY_REVEAL, card);
  getLogger().deindent();

  return card;
}
async function revealCardList(cardList) {
  if (!Array.isArray(cardList)) {
    console.error("CardList must be an array", cardList);
    throw new Error();
  }

  report_save_activity(ACTIVITY_REVEAL, null, cardList);
  getLogger().indent_();

  report_save_activity2(ACTIVITY_REVEAL, null, cardList);
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
  report_save_activity(ACTIVITY_EXILE, card);
  getLogger().indent_();

  await getExile().addCard(card);
  report_save_activity2(ACTIVITY_EXILE, card);

  await getPlayer().update_score();
  getLogger().deindent();
  return true;
}
async function set_aside_card(card) {
  report_save_activity(ACTIVITY_SET_ASIDE, card);
  getLogger().indent_();

  await getSetAside().addCard(card);
  report_save_activity2(ACTIVITY_SET_ASIDE, card);

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
async function attack_other(card, additional_info) {
  if (!card || !card.name) return;

  if (opponentManager.getOpponentList().length <= 0) {
    let cardClass = getClassFromName(card.name);
    let attackCard = new cardClass();
    await is_attacked(attackCard, additional_info);
    //await is_attacked(card, additional_info);
  } else {
    report_save_activity(ACTIVITY_ATTACK, card.name);
    getLogger().indent_();

    await report_save_activity2(ACTIVITY_ATTACK, card, [], additional_info);
    getLogger().deindent();
  }
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
    //card_class = getClassFromName(activity.card);
    card = new card_class(this);
    card.parseDataFromMockObject(activity.card, true);
  } else if (Array.isArray(activity.cardList)) {
    cardList = activity.cardList.map((c) => {
      let cardClass = getClassFromName(c.name);
      let newCard = new cardClass();
      newCard.parseDataFromMockObject(c, true);
      return newCard;
    });
    //card_class = activity.cardList.map(c => getClassFromName(c));
  }

  let new_activity = new Activity(username, activity.name, card, cardList);

  if (
    ![ACTIVITY_OTHER_REACT_GAIN, ACTIVITY_MESSAGE_OTHER].includes(activity.name)
  )
    getLogger().writeActivity(new_activity);

  if (activity.name === ACTIVITY_PLAY && card && card.type.includes("Attack")) {
    await reactionEffectManager.solve_cards_first_when_another_plays(
      card,
      new_activity
    );
  } else if (activity.name === ACTIVITY_ATTACK) {
    if (getPlayer().unaffected_id_list.find((cardId) => cardId === card.id)) {
    } else {
      await is_attacked(card, message);
    }
    /*} else if(activity.name === ACTIVITY_GAIN || activity.name === ACTIVITY_BUY_GAIN){
        await reactionEffectManager.solve_cards_when_another_gains(card, new_activity);
        */
  } else if (activity.name === ACTIVITY_OTHER_REACT_GAIN) {
    await reactionEffectManager.solve_cards_when_another_gains(
      card,
      new_activity
    );
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

  //getPlayer().phase = PHASE_WAITING;
  getPlayer().setPhase(currentPhase);

  let report = getGameState().create_report();

  //report_ingame(activity, report, message = "", category = "", async = true)
  let reactReport = report,
    reactMessage = `Agreee with ${activity.name} ${
      card ? card.name : ""
    } by ${username}`;
  return [reactReport, reactMessage];
  //await getPlayer().report_ingame(ACTIVITY_END_REACT, report, 'Agree with '+activity.name +' ' + (card?card.name:'')+' by '+username, 'REACTING', false);
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
  playCardFromHandInPlayField,
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
  discardTopBoon,
  receive_boon_twice,
  discard_card,
  discardCardFromPlayField,
  //discardCard, discardCardFromHand,
  trash_card,
  // trashCardFromHand, trashCardFromPlayField,
  //activate_card,
  reveal_card,
  revealCardList,
  reveal_deck,
  exile_card,
  set_aside_card,
  attack_other,
  message_other,
  react_other,
  do_passive,
  is_attacked,
};
