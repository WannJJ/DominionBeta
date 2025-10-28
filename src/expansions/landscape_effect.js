import { Card, RootCard } from "./cards.js";
import {
  getHand,
  getPlayField,
} from "../features/PlayerSide/CardHolder/CardHolder.jsx";
import { findLandscapeEffect } from "../features/TableSide/LandscapeEffect/LandscapeEffect.jsx";
import { getDeck } from "../features/PlayerSide/CardPile/CardPile.jsx";
import { mayPlayCardFromHand, playCardAsWay } from "../game_logic/Activity.js";
import { setInstruction } from "../features/PlayerSide/Instruction.jsx";
import { getSupportHand } from "../features/SupportHand.jsx";
import {
  findSupplyPile,
  findSupplyPileAll,
} from "../features/TableSide/SupplyPile.jsx";
import { getKingdomSupply } from "../features/TableSide/Supply.jsx";
import { opponentManager } from "../features/OpponentSide/Opponent.js";

class LandscapeEffect extends RootCard {
  static Type = {
    EVENT: "Event",
    LANDMARK: "Landmark",
    TRAIT: "Trait",
    PROJECT: "Project",
    WAY: "Way",
    PROPHECY: "Prophecy",
  };
  constructor(name, cost, type, additional_link) {
    super(name, cost, type, additional_link);

    this.victory_token = 0;
    this.debt_token = 0;
    this.sun_token = 0;
    this.chosen_pile_name = ""; // Use for Obelisk
  }
  setup() {}
  is_buyed() {}
  play() {}
  add_score() {}
  should_activate(reason, card) {
    return true;
  }
  activate() {}
  getVictoryToken() {
    return this.victory_token;
  }
  async setVictoryToken(value) {
    this.victory_token = value;
    let landscapeComponent = findLandscapeEffect(
      (component) => component.getName() === this.name
    );
    await landscapeComponent.setVictoryToken(value);
  }
  getDebtToken() {
    return this.debt_token;
  }
  async setDebtToken(value) {
    this.debt_token = value;
    let landscapeComponent = findLandscapeEffect(
      (component) => component.getName() === this.name
    );
    await landscapeComponent.setDebtToken(value);
  }
  getSunToken() {
    return this.sun_token;
  }
  async setSunToken(value) {
    this.sun_token = value;
    let landscapeComponent = findLandscapeEffect(
      (component) => component.getName() === this.name
    );
    await landscapeComponent.setSunToken(value);
  }
  async removeSunToken(value = 1) {
    this.sun_token = Math.max(this.sun_token - value, 0);
    let landscapeComponent = findLandscapeEffect(
      (component) => component.getName() === this.name
    );
    await landscapeComponent.setSunToken(this.sun_token);
  }
  getChosenPileName() {
    return this.chosen_pile_name;
  }
  createMockObject() {
    let mockObj = super.createMockObject();
    mockObj.vctrtkn = this.victory_token;
    mockObj.dbttkn = this.debt_token;
    mockObj.sntkn = this.sun_token;
    mockObj.chsnplnm = this.chosen_pile_name;
    return mockObj;
  }
  parseDataFromMockObject(mockObj) {
    super.parseDataFromMockObject(mockObj);
    this.victory_token = mockObj.vctrtkn;
    this.debt_token = mockObj.dbttkn;
    this.sun_token = mockObj.sntkn;
    this.chosen_pile_name = mockObj.chsnplnm;
  }
  parseDataFromMockObjectGeneral(mockObj) {
    if (!mockObj || !mockObj.name || mockObj.name !== this.name) {
      console.error(`cards.js, Name: ${this.name}`, mockObj);
      throw new Error("INVALID Mock Landscape Effect");
    }
    this.victory_token = mockObj.vctrtkn;
    this.debt_token = mockObj.dbttkn;
    this.sun_token = mockObj.sntkn;
    this.chosen_pile_name = mockObj.chsnplnm;
  }
  parseDataFromMockObjectOwn(mockObj) {
    super.parseDataFromMockObject(mockObj);
    this.victory_token = mockObj.vctrtkn;
    this.debt_token = mockObj.dbttkn;
    this.sun_token = mockObj.sntkn;
    this.chosen_pile_name = mockObj.chsnplnm;
  }
}

class Event extends LandscapeEffect {
  constructor(name, cost, additional_link, player) {
    super(name, cost, ["Event"], additional_link, player);
    this.activate_currently = false;
  }
  is_buyed() {}
}
// Landmark is only in Empires expansion
class Landmark extends LandscapeEffect {
  constructor(name, additional_link) {
    super(name, -1, ["Landmark"], additional_link);
  }
  add_score() {}
  should_activate() {
    return true;
  }
}
class Trait extends LandscapeEffect {
  constructor(name, additional_link) {
    super(name, -1, ["Trait"], additional_link);
    this.activate_permanently = true;
    this.chosen_pile_name = "";
  }
  async setup() {
    let pileList = getKingdomSupply().pile_list.filter(
      (pile) => pile.getTraitCard() == null
    );
    if (pileList.length === 0) return;

    let min = 0,
      max = pileList.length - 1;
    let index = Math.floor(Math.random() * (max - min + 1)) + min;
    let chosenPile = pileList[index];

    this.chosen_pile_name = chosenPile.getName();
    await chosenPile.setTraitCard(this);
    console.log(this.name, "chose", this.chosen_pile_name);
  }
  getChosenPile() {
    let chosenPile = findSupplyPile(
      (pile) => pile.getName() === this.chosen_pile_name
    );
    if (!chosenPile) {
      console.error(chosenPile, this.chosen_pile_name);
      throw new Error("Cant find chosen pile.");
    }
    return chosenPile;
  }
  is_buyed() {}
}
class Way extends LandscapeEffect {
  constructor(name, additional_link) {
    super(name, -1, ["Way"], additional_link);
  }
  play(card) {}
  should_activate_way() {
    return (
      getHand().has_card((c) => c.type.includes(Card.Type.ACTION)) ||
      getDeck().has_card(
        (card) =>
          card.type.includes(Card.Type.ACTION) ||
          card.type.includes(Card.Type.SHADOW)
      )
    );
  }
  activate_way() {
    if (getHand().length() <= 0) return;
    return new Promise((resolve) => {
      let clearFunc = function () {
        getHand().remove_mark();
        getSupportHand().clear();
        getSupportHand().hide();
        getDeck().removeCanSelect();
        setInstruction("");
      };
      setInstruction(`${this.name}: Choose an Action card to play as Way.`);
      let mayPlayAction = mayPlayCardFromHand(
        function (c) {
          return c.type.includes(Card.Type.ACTION);
        },
        async function (c) {
          clearFunc();

          await getPlayField().addCard(c);
          await playCardAsWay(this, c);

          resolve("Way finish");
        }.bind(this)
      );
      if (!mayPlayAction) {
        clearFunc();
        resolve();
      }
    });
  }
}
class Prophecy extends LandscapeEffect {
  constructor(name, additional_link) {
    super(name, -1, [LandscapeEffect.Type.PROPHECY], additional_link);
    this.activate_permanently = false;
  }
  async setSunToken(value) {
    let postValue = this.sun_token;
    await super.setSunToken(value);
    if (postValue > 0 && this.sun_token <= 0) {
      await this.playerRemoveLastSunToken();
    }
  }
  async removeSunToken(value = 1) {
    let postValue = this.sun_token;
    await super.removeSunToken(value);
    if (postValue > 0 && this.sun_token <= 0) {
      await this.playerRemoveLastSunToken();
    }
  }
  async playerRemoveLastSunToken() {
    if (this.sun_token > 0) throw new Error();
    this.activate_permanently = true;
  }
  async setup() {
    const sunTokenCount = [2, 5, 8, 10, 12, 13];
    let playerCount = Math.min(opponentManager.getOpponentList().length + 1, 6);

    let startingSunToken = sunTokenCount[playerCount - 1];
    await this.setSunToken(startingSunToken);
  }
}
class Project extends LandscapeEffect {
  constructor(name, additional_link) {
    super(name, -1, ["Project"], additional_link);
  }
}

export { Event, Landmark, Trait, Way, Project, Prophecy };
