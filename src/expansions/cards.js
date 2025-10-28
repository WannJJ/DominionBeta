import { PlayerProfile } from "../game_logic/PlayerProfile";

class RootCard {
  static id = 0;
  static ignoreCount = 0;
  constructor(name = "", cost = new Cost(), type = [], expansion = "") {
    this.name = name;
    this.cost = cost;
    this.type = type;
    this.src = "./img/" + expansion + name + ".JPG";
    this.id = `${PlayerProfile.getOrdinalNumber()}#${RootCard.id++}`;

    this.description = "";

    this.turn = -1;
    this.is_selected = false;
    this.is_face_down = false; // Use for Haven, NativeVillage, Gear,  Archive, Crypt, Druid, Necromancer, Cargoship, Research, Cage, Grotto, PuzzleBox, Prepare, BindingTime, Church,

    //Game phase to be activated
    this.not_discard_in_cleanup = false;
    this.activate_when_shuffle = false;
    this.activate_when_start_turn = false;
    this.activate_when_start_buy_phase = false;
    this.activate_when_end_buy_phase = false;
    this.activate_when_start_cleanup = false;
    this.activate_when_end_turn = false;
    this.activate_when_end_your_turn = false;
    this.activate_when_end_game = false;

    //Player or another player's activity to be activated
    this.activate_when_another_attacks = false;
    this.activate_when_another_gains = false;
    this.activate_first_when_another_plays = false;

    this.activate_first_when_play = false;
    this.activate_when_play = false;
    this.activate_on_play = false;
    this.activate_after_play = false;
    this.activate_when_gain = false;
    this.activate_when_discard = false;
    this.activate_when_trash = false;
    this.activate_when_discard_from_play = false;

    //Condition/ Position to be activated
    this.activate_when_in_hand = false;
    this.activate_when_in_play = false;
    //this.activate_when_being_set_aside = false;
    this.activate_permanently = false;
    this.activate_currently = false;
    this.activate_this_turn = false;
    this.activate_next_turn = false;

    this.chosen_id = null; // PuzzleBox
    this.chosen_id_list = []; // Prepare, Deliver
    this.chosen_name = ""; // Blockade, Gatekeeper
  }
  getCost() {
    return this.cost;
  }
  getType() {
    return this.type;
  }
  getCardBack() {}
  setup() {}
  getInitAmount() {}
  setPlayer(player) {
    this.player = player;
  }
  play() {}
  is_buyed() {}
  do_reaction() {}
  do_passive() {}
  add_score() {}

  should_activate(reason, card, activity, cardLocationTrack) {
    return true;
  } // Unneccessary, should_activate never check for cardLocation
  activate(reason, card, activity, cardLocationTrack) {}
  receive_message(message) {}
  analyseCardCost(card, tempCost) {
    console.error(card.name);
    throw new Error();
  }
  analyseCardType(card, tempType) {
    console.error(this.name, card.name);
    throw new Error("");
  }

  createMockObject(ignoreActivateCondition = false) {
    let mockObj = {
      id: this.id,
      //type: this.type,
      name: this.name,
      //cost = this.cost,
      ifd: this.is_face_down,

      //TODO: Xem lai cai nay.
      // Neu card nam trong discard hay deck, thi may dieu kien activate when in play gi se mat het.
      ...(!ignoreActivateCondition && {
        turn: this.turn,
        issel: this.is_selected,

        ndic: this.not_discard_in_cleanup,
        awsh: this.activate_when_shuffle,
        awss: this.activate_when_start_turn,
        awsbp: this.activate_when_start_buy_phase,
        awebp: this.activate_when_end_buy_phase,
        awscu: this.activate_when_start_cleanup,
        awet: this.activate_when_end_turn,
        awdyt: this.activate_when_end_your_turn,
        aweg: this.activate_when_end_game,

        awaa: this.activate_when_another_attacks,
        awag: this.activate_when_another_gains,
        afwap: this.activate_first_when_another_plays,

        afwpplay: this.activate_first_when_play,
        awplay: this.activate_when_play,
        aoplay: this.activate_on_play,
        afplay: this.activate_after_play,
        awgain: this.activate_when_gain,
        awdiscard: this.activate_when_discard,
        awtrash: this.activate_when_trash,
        awdfp: this.activate_when_discard_from_play,

        awih: this.activate_when_in_hand,
        awip: this.activate_when_in_play,
        aperm: this.activate_permanently,
        acurr: this.activate_currently,
        atist: this.activate_this_turn,
        anet: this.activate_next_turn,

        chsnid: this.chosen_id,
        chsnidlst: this.chosen_id_list,
        chsnn: this.chosen_name,
      }),
    };
    return mockObj;
  }

  parseDataFromMockObject(mockObj, ignoreActivateCondition = false) {
    if (!mockObj || !mockObj.name || mockObj.name !== this.name) {
      console.error(`cards.js, Name: ${this.name}`, mockObj);
      throw new Error("INVALID Mock Root Card");
    }
    this.id = mockObj.id;
    if (parseInt(mockObj.id.split("#")[1]) > RootCard.id)
      RootCard.id = parseInt(mockObj.id.split("#")[1]) + 1;
    //name = mockObj.name;
    //cost = mockObj.cost;
    this.is_face_down = mockObj.ifd;

    if (!ignoreActivateCondition) {
      this.turn = mockObj.turn;
      this.is_selected = mockObj.issel;

      this.not_discard_in_cleanup = mockObj.ndic;
      this.activate_when_shuffle = mockObj.awsh;
      this.activate_when_start_turn = mockObj.awss;
      this.activate_when_start_buy_phase = mockObj.awsbp;
      this.activate_when_end_buy_phase = mockObj.awebp;
      this.activate_when_start_cleanup = mockObj.awscu;
      this.activate_when_end_turn = mockObj.awet;
      this.activate_when_end_your_turn = mockObj.awdyt;
      this.activate_when_end_game = mockObj.aweg;

      this.activate_when_another_attacks = mockObj.awaa;
      this.activate_when_another_gains = mockObj.awag;
      this.activate_first_when_another_plays = mockObj.afwap;

      this.activate_first_when_play = mockObj.afwpplay;
      this.activate_when_play = mockObj.awplay;
      this.activate_on_play = mockObj.aoplay;
      this.activate_after_play = mockObj.afplay;
      this.activate_when_gain = mockObj.awgain;
      this.activate_when_discard = mockObj.awdiscard;
      this.activate_when_trash = mockObj.awtrash;
      this.activate_when_discard_from_play = mockObj.awdfp;

      this.activate_when_in_hand = mockObj.awih;
      this.activate_when_in_play = mockObj.awip;
      this.activate_permanently = mockObj.aperm;
      this.activate_currently = mockObj.acurr;
      this.activate_this_turn = mockObj.atist;
      this.activate_next_turn = mockObj.anet;

      this.chosen_id = mockObj.chsnid;
      this.chosen_id_list = mockObj.chsnidlst;
      this.chosen_name = mockObj.chsnn;
    }
  }
}

class Card extends RootCard {
  //potrait card
  static Type = {
    ACTION: "Action",
    VICTORY: "Victory",
    TREASURE: "Treasure",
    ATTACK: "Attack",
    DURATION: "Duration",
    REACTION: "Reaction",
    CURSE: "Curse",
    COMMAND: "Command",
    NIGHT: "Night",
    LOOT: "Loot",
    SPIRIT: "Spirit",
    DOOM: "Doom",
    FATE: "Fate",
    SHELTER: "Shelter",
    HEIRLOOM: "Heirloom",
    ZOMBIE: "Zombie",
    SHADOW: "Shadow",
    OMEN: "Omen",
    GATHERING: "Gathering",
    CASTLE: "Castle",
  };
  constructor(name, cost, type, expansion) {
    let type1 = type ? type.split(" ") : [];
    super(name, cost, type1, expansion);

    //TODO: face up when set aside  // Use for Prepare
  }
  getInitAmount() {
    return 10;
  }
  getCardBack() {
    return "./img/Basic/Back.JPG";
  }
  play() {}
  do_action() {}
  do_reaction() {}
  async add_score() {}
  is_gained() {}
  is_buyed() {}
  attack() {}

  is_drawn() {}
  is_in_play() {}
  is_attacked(additional_info) {}
  is_discarded() {} // Discard other than during clean-up
  is_trashed() {}
  is_revealed() {}
  is_start_turn() {}
  is_end_action_phase() {}
  is_end_buy_phase() {}

  should_activate(reason, card, activity) {
    return true;
  }
  activate(reason, card, activity) {}

  async setup() {}
  createSplitPile() {}
}
class Cost {
  constructor(coin = 0, debt = 0, potion = 0) {
    this.coin = 0;
    this.debt = 0;
    this.potion = 0;

    if (coin == undefined) {
      throw new Error("INVALID COST");
    }
    if (arguments.length >= 1 && coin && typeof coin === "number") {
      this.coin = coin;
    }
    if (arguments.length >= 2 && debt && typeof debt === "number") {
      this.debt = debt;
    }
    if (arguments.length >= 3 && potion && typeof potion === "number") {
      this.potion = potion;
    }
  }
  static checkValidCost(cost) {
    if (
      cost == undefined ||
      cost.coin == undefined ||
      cost.debt == undefined ||
      cost.potion == undefined
    ) {
      console.error("cost:", cost);
      throw new Error("INVALID COST");
    }
    return true;
  }
  getCoin() {
    return this.coin;
  }
  addCoin(value) {
    this.coin += value;
    this.coin = this.coin > 0 ? this.coin : 0;
  }
  getDebt() {
    return this.debt;
  }
  addDebt(value) {
    this.debt += value;
    this.debt = this.debt > 0 ? this.debt : 0;
  }
  getPotion() {
    return this.potion;
  }
  addPotion(value) {
    this.potion += value;
    this.potion = this.potion > 0 ? this.potion : 0;
  }
  addCost(cost) {
    Cost.checkValidCost(cost);
    this.addCoin(cost.coin);
    this.addDebt(cost.debt);
    this.addPotion(cost.potion);
  }
  subtractCost(cost) {
    Cost.checkValidCost(cost);
    this.addCoin(-1 * cost.coin);
    this.addDebt(-1 * cost.debt);
    this.addPotion(-1 * cost.potion);
  }
  sufficientToBuy(cost) {
    Cost.checkValidCost(cost);
    return this.coin >= cost.coin && this.potion >= cost.potion;
  }
  isGreaterThan(cost) {
    Cost.checkValidCost(cost);
    return (
      this.coin >= cost.coin &&
      this.debt >= cost.debt &&
      this.potion >= cost.potion &&
      (this.coin > cost.coin ||
        this.debt > cost.debt ||
        this.potion > cost.potion)
    );
  }
  isGreaterOrEqual(cost) {
    Cost.checkValidCost(cost);
    return (
      this.coin >= cost.coin &&
      this.debt >= cost.debt &&
      this.potion >= cost.potion
    );
  }
  isEqual(cost) {
    Cost.checkValidCost(cost);
    return (
      this.coin === cost.coin &&
      this.debt === cost.debt &&
      this.potion === cost.potion
    );
  }
}

/*
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';


function generateString(length) {
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
*/
export { RootCard, Card, Cost };
