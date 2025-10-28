import {
  getPlayField,
  getHand,
} from "../features/PlayerSide/CardHolder/CardHolder";
import { getPlayArea } from "../features/PlayerSide/BottomLeftCorner/SideArea";
import { getButtonPanel } from "../features/PlayerSide/ButtonPanel";
import { boonHolder, stateHolder } from "../expansions/nocturne/HexBoonManager";

import {
  report_save_activity,
  report_save_activity2,
} from "./report_save_activity";
import { landscapeEffectManager } from "../features/TableSide/LandscapeEffect/LandscapeEffectManager";
import { ACTIVITY_ACTIVATE } from "../utils/constants";
import { Card, RootCard } from "../expansions/cards";
import { getLogger } from "../Components/Logger";

import { generateCardFromMockObject } from "./GameState";
import { setInstruction } from "../features/PlayerSide/Instruction";
import { playCardAsWay } from "./Activity";
import { shuffleArray } from "../utils/helpers";
import { getType } from "./basicCardFunctions";

/*
    When Another: when gain (Pirate, Cutthroat, Road Network, Black Cat, Mapmaker, Stowaway, Monkey, Fools Gold,Falconer, Invest), 
        When play attack (Moat, Diplomat, Horse Traders, Guard Dog, Beggar, Caravan Guard, Shield, Secret Chamber),
        When play (Enchantress, Frigate, Corsair, Highwayman),
        when another player gains or Invests (Invest)
    When You: When you trash a card (Tomb,Priest, Sewers, Possession, Market Square), 
        When you gain, After gain (Continue, Hill Fort, Invasion, Reap, Replcae, Spell Scroll, Summon),
        When you would gain (Possession, Trader, Guardian, Ghost Town, Night Watchman, Den of Sin, Nomad Camp)
        When you play (Kiln, Teacher, Champion, Urchin, Seaway, LostArts, Training, Pathfinding, Good Harvest, Enlightenment), 
        When you discard (from play) (Herbalist, Scheme, Horn, Trickster, Tireless, Panic) (Page, Peasant, Disciple, Fugitive, Hero, Soldier, TreasureHunter, Warrior, Capital, Way_of_the_Frog, MerchantCamp, Tent, ), 
        When shuffling/ when you shuffle (Order of masons, order of astroloders, fated, stash, star chart, Avoid),
    At the start (114):  At the start of your next turn (70, almost duration), At the start of your turn(23), 
        At the start of your buy phase(9, Only for landmark, ally, state, artifact), 
        At the start of Clean-up(Alchemist, Encampment, Improve, Walled Village), 
        At the start of each of your turn(Hireling, Crypt, Quartermaster, Endless Chalice, Prince), 
    At the end (10): At the end of your buy phase(Treasury, Hermit, Merchant Guild, Wine Merchant, Pageant, Exploration), 
        At the end of your turn(Island Folk, Baths, Deliver, Possession, Save, Foresight, Donate), 
        At the end of this turn(FaithfulHound, Necromancer, The Fields Gilft, The Forests Gift, Way of the Squirrel, Cage, Trickster, Tireless, Puzzle Box, Mountain Pass)
        At the end of the game(Distant Land), At the end of each turn(Way of the Squirrel, River Gift)
    The next time (12): you gain(Charm, Cage, SeludedShrine, Abundance, Rush, Mirror), 
        you play (Kiln, Flagship), you shuffle(Avoid),
        a Supply pile empites(Search), anyone gains a Treasure(Cutthroat), the first card you play(Landing Party)
    The first time (6): you play(merchant, outpost, crossroad, fools gold, citadel), each other plays (Enchantress),
    The first Treasure (Highwayman),
    Once per turn:
    Until: Until the start of your next turn(Corsair, Lighthouse, HauntedWoods, SwampHag, Guardian, Gatekeeper, Highwayman, Warlord, Entchantress)
    During Clean-up: Joust, Coastal Haven, Journey
    After playing a card: (Inspiring),  If it's an Attack (Approaching Army)
        If it's an Action (Coin of the Realm, Royal Carriage, Citadel, Fellowhip of Scribes, Harbor Village, Flagship, Frigate, Daimyo, Great Leader)
        If it's a Liaison (Circle of Witches, League of Shopkeepers),
        If it's a Treasure (Merchant, Sauna, Corsair, Landing Party, Panic),

    When gain: not gain to discard: Sailor, Sleigh, DenofSin, GhotTown, NightWatchman, Guardian, Ghost, BuriedTreasure
    

let card_activate_when_in_hand = [Moat, Sailor, Pirate],
    card_activate_permanently = [Arena, Bandit_Fort, Basilica, Baths, Battlefield, Colonnade, Defiled_Shrine, Fountain, Keep, Labyrinth, Mountain_Pass,
        Museum, Obelisk, Orchard, Palace, Tomb, Tower, Triumphal_Arch, Wall, Wolf_Den],
    card_activate_when_set_aside = [];
    */

const REASON_SHUFFLE = "activate_when_shuffle", // Order of masons, order of astroloders, fated, stash, star chart, Emissary, Avoid
  REASON_START_TURN = "activate_when_start_turn", // 23 cards
  REASON_START_BUY = "activate_when_start_buy_phase", // 9 cards, Only landmark, ally, state and artifact
  REASON_END_BUY = "activate_when_end_buy_phase", // Treasury, Hermit, Merchant Guild, Wine Merchant, Pageant, Exploration, Exploration,
  REASON_START_CLEANUP = "activate_when_start_cleanup", //Alchemist, Encampment, Improve, Walled Village, River Shrine, Biding Time, Friendly, Patient
  REASON_END_TURN = "activate_when_end_turn", // Faithful Hound, Necromancer, PuzzleBox, The River's Gift, Way of the Squirrel, Cage, Trickster, Tireless, Puzzle Box, Mountain Pass
  REASON_END_YOUR_TURN = "activate_when_end_your_turn", //Possession, Save, Baths, Island Folk, Deliver, Foresight, Donate,
  REASON_END_GAME = "activate_when_end_game", //Distant Land
  REASON_WHEN_PLAY = "activate_when_play", // used for Urchin, Seaway, LostArts, Training, Pathfinding, Teacher, Champion, Sauna, Merchant, Kiln
  REASON_WHEN_GAIN = "activate_when_gain", //maybe không cần phải implement
  REASON_WHEN_DISCARD = "activate_when_discard", // used for Herbalist, Scheme, Horn, Trickster, Tireless, Herbalist
  REASON_WHEN_TRASH = "activate_when_trash",
  REASON_WHEN_DISCARD_FROM_PLAY = "activate_when_discard_from_play", // Trickster, Capital
  REASON_WHEN_BEING_ATTACKED = "activate_when_another_attacks",
  REASON_WHEN_ANOTHER_GAIN = "activate_when_another_gains",
  REASON_FIRST_WHEN_ANOTHER_PLAYS = "activate_first_when_another_plays", // Moat, Shield, Diplomat, Horse Traders, Guard Dog, Beggar, Caravan Guard, Secret Chamber,
  REASON_FIRST_WHEN_PLAY = "activate_first_when_play",
  REASON_ON_PLAY = "activate_on_play",
  REASON_AFTER_PLAY = "activate_after_play",
  /* TODO: Bo sung: 
    REASON_DURING_CLEAN_UP
    REASON_BEFORE_YOU_PLAY // Teacher, Seaway, Lost Arts, Training, Pathfinding, Champions, Urchin, Godd Harvest

    Them .move va updata_state de undo
    */

  POSITION_HAND = "hand",
  POSITION_PLAY_FIELD = "playField",
  POSITION_PLAY_AREA = "playArea",
  POSITION_LANDSCAPE_EFFECT = "landscapeEffecManager",
  POSITION_BOON_HOLDER = "boonHolder",
  POSITION_STATE_HOLDER = "stateHolder",
  POSITION_EFFECT_BUFFER = "effectBuffer";

const reactionEffectManager = {
  get_possible_cards: function (reason, card, activity) {
    let cardList = [];
    for (let c of getHand().getCardAll()) {
      if (
        c.activate_when_in_hand &&
        c[reason] &&
        c.should_activate(reason, card, activity)
      ) {
        cardList.push({ card: c, position: POSITION_HAND });
      }
    }
    for (let c of getPlayField().getCardAll()) {
      if (
        c.activate_when_in_play &&
        c[reason] &&
        c.should_activate(reason, card, activity)
      ) {
        cardList.push({ card: c, position: POSITION_PLAY_FIELD });
      }
    }
    for (let c of getPlayArea().getCardAll()) {
      if (
        c.activate_when_in_play &&
        c[reason] &&
        c.should_activate(reason, card, activity)
      ) {
        cardList.push({ card: c, position: POSITION_PLAY_AREA });
      }
    }
    for (let landscapeEffectComponent of landscapeEffectManager.getEffectComponentListAll()) {
      let effectCard = landscapeEffectComponent.getCard();
      if (
        (effectCard.activate_permanently || effectCard.activate_currently) &&
        effectCard[reason] &&
        effectCard.should_activate(reason, card, activity)
      ) {
        cardList.push({
          card: effectCard,
          position: POSITION_LANDSCAPE_EFFECT,
        });
      } else if (
        reason === REASON_WHEN_PLAY &&
        card &&
        card.type.includes("Action") &&
        effectCard.type.includes("Way")
      ) {
        cardList.push({
          card: effectCard,
          position: POSITION_LANDSCAPE_EFFECT,
        });
      }
    }

    for (let boonCard of boonHolder.getBoonList()) {
      if (
        boonCard.activate_currently &&
        boonCard[reason] &&
        boonCard.should_activate(reason, card, activity)
      ) {
        cardList.push({ card: boonCard, position: POSITION_BOON_HOLDER });
      }
    }
    for (let state of stateHolder.getStateList()) {
      if (
        state.activate_currently &&
        state[reason] &&
        state.should_activate(reason, card, activity)
      ) {
        cardList.push({ card: state, position: POSITION_STATE_HOLDER });
      }
    }
    for (let c of effectBuffer.getCardAll()) {
      if (c[reason] && c.should_activate(reason, card, activity)) {
        cardList.push({ card: c, position: POSITION_EFFECT_BUFFER });
      }
    }

    if (
      (reason === REASON_WHEN_TRASH || reason === REASON_WHEN_DISCARD) &&
      card &&
      cardList.filter((obj) => obj.card.id === card.id).length === 0
    ) {
      if (card[reason] && card.should_activate(reason, card, activity))
        cardList.push({ card: card, position: POSITION_EFFECT_BUFFER });
    }

    return cardList;
  },
  solve_cards_at_start_turn: async function () {
    await this.solve_remaining_effects(REASON_START_TURN);
  },
  solve_cards_at_start_buy_phase: async function () {
    await this.solve_remaining_effects(REASON_START_BUY);
  },
  solve_cards_at_end_buy_phase: async function () {
    await this.solve_remaining_effects(REASON_END_BUY);
  },
  solve_cards_at_start_cleanup_phase: async function () {
    await this.solve_remaining_effects(REASON_START_CLEANUP);
  },
  solve_cards_at_end_turn: async function () {
    await this.solve_remaining_effects(REASON_END_TURN);
  },
  solve_cards_at_end_your_turn: async function () {
    await this.solve_remaining_effects(REASON_END_YOUR_TURN);
  },
  solve_cards_when_play: async function (card, askToUseWay = true) {
    if (!card) return;
    let effectPositionList = this.get_possible_cards(REASON_WHEN_PLAY, card);
    let playCardNormally = true;
    if (effectPositionList.length === 0) return playCardNormally;

    await new Promise(async (resolve) => {
      let clearFunc = function () {
        getButtonPanel().clear_buttons();
        setInstruction("");
      };

      for (let effectPosition of effectPositionList) {
        let effect = effectPosition.card;
        getButtonPanel().add_button(
          `Activate ${effect.name}`,
          async function () {
            clearFunc();
            playCardNormally = false;
            await playCardAsWay(effect, card);
            resolve(false);
          }
        );
      }

      if (
        effectPositionList.filter(
          (effectPosition) => !effectPosition.card.type.includes("Way")
        ).length === 0
      ) {
        if (!askToUseWay) {
          clearFunc();
          playCardNormally = true;
          resolve(true);
          return;
        }
        getButtonPanel().add_button("Decline", function () {
          clearFunc();
          playCardNormally = true;
          resolve(true);
        });
      } else if (effectPositionList.length === 1) {
        let effect = effectPositionList[0].card;
        clearFunc();
        playCardNormally = false;
        await playCardAsWay(effect, card);
        resolve(false);
      }
    });

    return playCardNormally;
  },
  solve_cards_on_play: async function (card) {
    if (!card) return;
    let playCardNormally = true;
    let effectPositionList = this.get_possible_cards(REASON_ON_PLAY, card);
    if (effectPositionList.length === 0) return playCardNormally;

    while (effectPositionList.length > 0) {
      let effect = effectPositionList.pop().card;
      await activate_card(effect, REASON_ON_PLAY, card);
      playCardNormally = false;
    }

    return playCardNormally;
  },
  solve_cards_after_playing: async function (card) {
    if (!card) return;
    await this.solve_remaining_effects(REASON_AFTER_PLAY, card);
  },
  /*
     Use cardLocation to apply Stop-Moving Rule and no Visiting rule. 
     Card may affect: Insignia, Sleigh, Tracker, Travelling Fair, WatchTower, Way of the Seal, Villa, Siren, 
                        Watchtower, Changeling, Trader, Berserker, Buried Treasure, Mining Road, Rush,
                        Sailor, Trail, Gatekeeper, Cargo Ship, Deliver, 
    */
  solve_cards_when_gain: async function (card, activity, cardLocation) {
    if (!card) return;
    await this.solve_remaining_effects(
      REASON_WHEN_GAIN,
      card,
      activity,
      cardLocation
    );
  },
  solve_cards_when_discard: async function (card) {
    if (!card) return;
    await this.solve_remaining_effects(REASON_WHEN_DISCARD, card);
  },
  solve_cards_when_trash: async function (card) {
    if (!card) return;
    await this.solve_remaining_effects(REASON_WHEN_TRASH, card);
  },
  solve_cards_when_discard_from_play: async function (card) {
    if (!card) return;
    await this.solve_remaining_effects(REASON_WHEN_DISCARD_FROM_PLAY, card);
  },
  solve_cards_when_shuffle: async function (cardList) {
    return await shufflingEffectManager.solve_cards_when_shuffle(cardList);
  },

  solve_cards_when_another_attacks: async function (card) {
    if (!card) return;
    await this.solve_remaining_effects(REASON_WHEN_BEING_ATTACKED, card);
  },
  // Use activity parameter for Monkey, to determine who causes the Activity Gain
  solve_cards_when_another_gains: async function (card, activity) {
    if (!card) return;
    await this.solve_remaining_effects(
      REASON_WHEN_ANOTHER_GAIN,
      card,
      activity
    );
  },
  solve_cards_first_when_another_plays: async function (card, activity) {
    if (!card) return;
    await this.solve_remaining_effects(
      REASON_FIRST_WHEN_ANOTHER_PLAYS,
      card,
      activity
    );
  },
  solve_cards_first_when_play: async function (card) {
    if (!card) return;
    await this.solve_remaining_effects(REASON_FIRST_WHEN_PLAY, card);
  },

  solve_remaining_effects: async function (reason, card, activity, location) {
    /**
     * Use cardLocationTrack for Sleigh, Deliver, Rush, Insignia, QuarterMaster, MiningRoad, Sailor,
     */
    let card_list = this.get_possible_cards(reason, card, activity);
    let cardLocationTrack = new LocationTrack(location);

    while (card_list.length > 0) {
      getButtonPanel().clear_buttons();
      if (card_list.length === 1) {
        let c_object = card_list.pop();
        await this.solve_single_remaining_effect(
          c_object,
          reason,
          card,
          activity,
          cardLocationTrack
        );
      } else {
        await this.solve_multiple_remaining_effect(
          card_list,
          reason,
          card,
          activity,
          cardLocationTrack
        );
      }
    }
  },
  solve_single_remaining_effect: async function (
    c_object,
    reason,
    card,
    activity,
    cardLocationTrack
  ) {
    let duration_card = c_object.card,
      position = c_object.position;

    if (
      duration_card.should_activate(reason, card, activity, cardLocationTrack)
    ) {
      //cardLocation is unneccessary
      if (
        duration_card.type.includes(Card.Type.REACTION) &&
        position === POSITION_HAND
      ) {
        //ask wether player wants to activate
      } else {
        await this.remove_card_from_position(duration_card, position);
      }
      await activate_card(
        duration_card,
        reason,
        card,
        activity,
        cardLocationTrack
      );
    }
  },
  solve_multiple_remaining_effect: function (
    card_list,
    reason,
    card,
    activity,
    cardLocationTrack
  ) {
    return new Promise((resolve) => {
      for (let i = 0; i < card_list.length; i++) {
        let c_object = card_list[i];
        let duration_card = c_object.card,
          position = c_object.position;
        if (
          !duration_card.should_activate(
            reason,
            card,
            activity,
            cardLocationTrack
          )
        )
          continue; //cardLocation is unneccessary
        getButtonPanel().add_button(
          `${ACTIVITY_ACTIVATE} ${duration_card.name}`,
          async function () {
            getButtonPanel().clear_buttons();
            if (
              duration_card.should_activate(
                reason,
                card,
                activity,
                cardLocationTrack
              )
            ) {
              //cardLocation is unneccessary
              let index = card_list.indexOf(c_object);
              if (index !== -1) {
                card_list.splice(index, 1);
                if (
                  duration_card.type.includes(Card.Type.REACTION) &&
                  position === POSITION_HAND
                ) {
                  //ask wether player wants to activate
                } else {
                  await this.remove_card_from_position(duration_card, position);
                }
                await activate_card(
                  duration_card,
                  reason,
                  card,
                  activity,
                  cardLocationTrack
                );
              }
            }
            resolve();
          }.bind(this)
        );
      }
    });
  },

  remove_card_from_position: async function (card, position) {
    let removed = undefined;
    switch (position) {
      case POSITION_HAND:
        alert("Remove Card from hand. Lan dau thay");
        removed = await getHand().remove(card);
        if (!removed) {
          alert("Cant remove from hand");
          return false;
        } else alert("Card removed from hand. Lan dau tien thay");
        await getPlayField().addCard(card);
        break;
      case POSITION_PLAY_FIELD:
        break;
      case POSITION_PLAY_AREA:
        //if(!(getPlayer().phase === 'reaction' || getPlayer().phase === 'waiting')){
        removed = await getPlayArea().remove(card);
        if (!removed) {
          alert("Cant remove from play area");
          return false;
        }
        await getPlayField().addCard(card);
        break;
      case POSITION_LANDSCAPE_EFFECT:
        break;
      default:
        break;
    }
  },
};

const shufflingEffectManager = {
  cardList: [],
  topCardList: [],
  bottomCardList: [],
  getToShuffleList: function () {
    return this.cardList;
  },
  putTop: function (card) {
    if (!(card instanceof RootCard)) throw new Error();
    this.topCardList.push(card);
  },
  putBottom: function (card) {
    if (!(card instanceof RootCard)) throw new Error();
    this.bottomCardList.push(card);
  },
  removeCard(card) {
    if (!(card instanceof RootCard)) throw new Error();
    let index = this.cardList.indexOf(card);
    if (index !== -1) {
      this.cardList.splice(index, 1);
    } else {
      let index = this.cardList.map((c) => c.id).indexOf(card.id);
      if (index !== -1) this.cardList.splice(index, 1);
      else return undefined;
    }
    return card;
  },
  get_possible_cards: function (cardList) {
    let effectList = [];
    for (let landscapeEffectComponent of landscapeEffectManager.getEffectComponentListAll()) {
      let effectCard = landscapeEffectComponent.getCard();
      if (
        (effectCard.activate_permanently || effectCard.activate_currently) &&
        effectCard[REASON_SHUFFLE] &&
        effectCard.should_activate(REASON_SHUFFLE)
      ) {
        effectList.push(effectCard);
      }
    }

    for (let c of effectBuffer.getCardAll()) {
      if (c[REASON_SHUFFLE] && c.should_activate(REASON_SHUFFLE)) {
        effectList.push(c);
      }
    }

    /*
    for (let card of cardList) {
      if (getType(card).includes(Card.Type.SHADOW) || card.name === "Stash") {
        effectList.push(card);
      }
    }
      */

    return effectList;
  },
  putAllShadowCardsOnBottom() {
    let shadowList = [];
    for (let card of this.cardList) {
      if (getType(card).includes(Card.Type.SHADOW)) shadowList.push(card);
    }
    for (let card of shadowList) {
      this.removeCard(card);
      this.putBottom(card);
    }
  },
  solve_cards_when_shuffle: async function (cardList) {
    //TODO: De player duoc sap xep neu nhieu cards duoc put bottom hay top
    this.cardList = cardList.map((c) => c);
    this.topCardList = [];
    this.bottomCardList = [];

    this.putAllShadowCardsOnBottom();

    let effectList = this.get_possible_cards(this.cardList);

    while (effectList.length > 0) {
      if (effectList.length === 1) {
        let card = effectList.pop();
        await activate_card(card, REASON_SHUFFLE);
      } else {
        await new Promise((resolve) => {
          getButtonPanel().clear_buttons();
          for (let i = 0; i < effectList.length; i++) {
            let card = effectBuffer[i];
            getButtonPanel().add_button(
              `Activate ${card.name}`,
              async function () {
                getButtonPanel().clear_buttons();
                effectList.splice(i, 1);
                await activate_card(card, REASON_SHUFFLE);
                resolve();
              }
            );
          }
        });
      }
    }

    shuffleArray(this.cardList);
    return [...this.bottomCardList, ...this.cardList, ...this.topCardList];
  },
};

/**
 * To remember some cards with effect, but not locate in hand, playField, playArea ...
 * e.g. Villa, Footpad, Duchess, Changeling, Shaman, Siren, Berserker, BuriedTreasure,..
 *
 */
const effectBuffer = {
  //TODO: createMockObject
  cardList: [],
  getCardAll: function () {
    return this.cardList;
  },
  getLength: function () {
    return this.cardList.length;
  },
  addCard: function (card) {
    if (!(card instanceof RootCard)) throw new Error("INVALID Card");

    if (this.hasCardId(card.id)) return false;
    this.cardList.push(card);
    return true;
  },
  hasCardId(id) {
    for (let card of this.cardList) {
      if (card.id === id) {
        return true;
      }
    }
    return false;
  },
  getCardById(id) {
    for (let card of this.cardList) {
      if (card.id === id) {
        return card;
      }
    }
    return undefined;
  },
  remove(card) {
    if (!card || !card.id) return undefined;
    let index = this.cardList.indexOf(card);
    if (index === -1) {
      index = this.cardList.map((c) => c.id).indexOf(card.id);
      if (index === -1) {
        return undefined;
      } else {
        this.cardList.splice(index, 1);
      }
    } else {
      this.cardList.splice(index, 1);
    }
    return card;
  },
  removeCardById(id) {
    let card = this.getCardById(id);
    let removed = undefined;
    if (card) {
      removed = this.remove(card);
    }
    return removed;
  },
  createMockObject() {
    let cardList = [];
    for (let card of this.cardList) {
      if (!(card instanceof RootCard))
        throw new Error("INVALID Card in effectBuffer");
      cardList.push(card.createMockObject());
    }
    return { type: "effectBuffer", name: "effectBuffer", cardList: cardList };
  },
  async parseDataFromMockObject(mockObj) {
    if (
      !mockObj ||
      mockObj.name !== "effectBuffer" ||
      !Array.isArray(mockObj.cardList)
    ) {
      throw new Error("INVALID Mock effectBuffer");
    }
    let cardList = [];

    for (let cardObj of mockObj.cardList) {
      let new_card = generateCardFromMockObject(cardObj);
      cardList.push(new_card);
    }

    this.cardList = cardList;
  },
};

class LocationTrack {
  #location;
  constructor(location) {
    this.#location = location;
  }
  getLocation() {
    // getExpectedLocation
    return this.#location;
  }
  /**
   * Stop-Moving rule: If a card isn't where the effect would expect it to be, or has moved away from there and then back, it can't move the card.
   * @param {*} location
   */
  setLocation(location) {
    this.#location = null; // when card location changes, we lose track completely, so set the location to null;
  }
}

async function activate_card(
  duration_card,
  reason,
  card,
  activity,
  cardLocationTrack
) {
  let activity0 = report_save_activity(ACTIVITY_ACTIVATE, duration_card);
  getLogger().indent_();
  await duration_card.activate(reason, card, activity, cardLocationTrack);
  await report_save_activity2(ACTIVITY_ACTIVATE, duration_card);
  activity0.setFinish();
  getLogger().deindent();
}

//let reactionEffectManager = new ReactionEffectManager();

export {
  reactionEffectManager,
  shufflingEffectManager,
  effectBuffer,
  REASON_SHUFFLE,
  REASON_START_TURN,
  REASON_START_BUY,
  REASON_END_BUY,
  REASON_START_CLEANUP,
  REASON_END_YOUR_TURN,
  REASON_END_TURN,
  REASON_END_GAME,
  REASON_WHEN_PLAY,
  REASON_AFTER_PLAY,
  REASON_WHEN_GAIN,
  REASON_WHEN_DISCARD,
  REASON_WHEN_DISCARD_FROM_PLAY,
  REASON_WHEN_TRASH,
  REASON_WHEN_ANOTHER_GAIN,
  REASON_FIRST_WHEN_ANOTHER_PLAYS,
  REASON_FIRST_WHEN_PLAY,
  REASON_ON_PLAY,
};
