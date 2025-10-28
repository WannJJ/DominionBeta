import { Card, RootCard } from "../expansions/cards";
import { getPlayField } from "../features/PlayerSide/CardHolder/CardHolder";
import { getPlayArea } from "../features/PlayerSide/BottomLeftCorner/SideArea";
import { landscapeEffectManager } from "../features/TableSide/LandscapeEffect/LandscapeEffectManager";
//import { effectBuffer } from "./ReactionEffectManager";

const costAffectingNameList = [
  "Bridge",
  "Bridgetroll",
  "Canal",
  "Cheap",
  "FamilyofInventors",
  "Ferry",
  "FlourishingTrade",
  "Highway",
  "Inventor",
  "Princess",
  "Quarry",
  "Renown",
];
const typeAffectingList = [
  "Inheritance",
  "Capitalism",
  "Charlatan",
  "Enlightenment",
];

const CostController = {
  name: "CostController",
  getPossibleCostAffectingList() {
    let effectList = [];

    for (let card of getPlayField().getCardAll()) {
      if (costAffectingNameList.includes(card.name)) {
        effectList.push(card);
      }
    }

    for (let card of getPlayArea().getCardAll()) {
      if (costAffectingNameList.includes(card.name)) {
        effectList.push(card);
      }
    }
    for (let landscapeEffectComponent of landscapeEffectManager.getEffectComponentListAll()) {
      let effectCard = landscapeEffectComponent.getCard();
      if (costAffectingNameList.includes(effectCard.name))
        effectList.push(effectCard);
    }

    return effectList;
  },
  getCardCost(card) {
    if (!(card instanceof RootCard))
      throw new Error("Invalid Card! Cost not exists");
    if (!(card instanceof Card)) return card.getCost();

    let costAffectingList = this.getPossibleCostAffectingList();
    let cost = card.getCost();
    for (let effect of costAffectingList) {
      cost = effect.analyseCardCost(card, cost);
    }
    return cost;
  },
};

const TypeController = {
  name: "TypeController",
  getPossibleTypeAffectingList() {
    let effectList = [];

    for (let landscapeEffectComponent of landscapeEffectManager.getEffectComponentListAll()) {
      let effectCard = landscapeEffectComponent.getCard();
      if (typeAffectingList.includes(effectCard.name))
        effectList.push(effectCard);
    }
    return effectList;
  },
  getCardType(card) {
    if (!card instanceof RootCard)
      throw new Error("Invalid Card! Type not exists");
    if (!(card instanceof Card)) return card.getType();

    let typeAffectingList = this.getPossibleTypeAffectingList();
    let type = card.getType();
    for (let effect of typeAffectingList) {
      type = effect.analyseCardType(card, type);
    }
    return type;
  },
};

function getType(card) {
  if (!(card instanceof RootCard))
    throw new Error("Invalid Card! Type not exists");
  if (!(card instanceof Card)) return card.getType();
  return TypeController.getCardType(card);
}

function getCost(card) {
  if (!(card instanceof RootCard))
    throw new Error("Invalid Card! Cost not exists");
  return CostController.getCardCost(card);
}

export { getType, getCost };
