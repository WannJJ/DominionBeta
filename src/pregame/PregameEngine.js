import basicCardsData from "./cardsData/basicCardsData";
import baseCardsData from "./cardsData/baseCardsData";
import seasideCardsData from "./cardsData/seasideCardsData";
import darkAgesCardsData from "./cardsData/darkAgesCardsData";
import empiresCardsData from "./cardsData/empiresCardsData";
import menagerieCardsData from "./cardsData/menagerieCardsData";
import nocturneCardsData from "./cardsData/nocturneCardsData";
import plunderCardsData from "./cardsData/plunderCardsData";
import { guildsCardsData } from "./cardsData/guildsCardsData";
import { risingSunCardsData } from "./cardsData/risingSunCardsData";

import { shuffleArray } from "../utils/helpers";

let allCardsData = [
  ...basicCardsData.cards,
  ...baseCardsData.cards,
  ...guildsCardsData.cards,
  ...menagerieCardsData.cards,
  ...empiresCardsData.cards,
  ...darkAgesCardsData.cards,
  ...nocturneCardsData.cards,
  ...plunderCardsData.cards,
  ...risingSunCardsData.cards,
  ...seasideCardsData.cards,
];

let all_events = allCardsData.filter((card) => {
  return (
    card.type.includes("Event") ||
    card.type.includes("Landmark") ||
    card.type.includes("Way") ||
    card.type.includes("Trait") ||
    card.type.includes("Project")
    //||card.type.includes("Prophecy")
  );
});

const not_finish = [
  "Way_of_the_Chameleon",
  "Journey",
  "Seize_the_Day",
  "DivineWind",
];

const PregameEngine = {
  choose_kingdom: function () {
    let all_kingdom_cards = allCardsData;
    //all_kingdom_cards = [...menagerieCardsData.cards];

    all_kingdom_cards = all_kingdom_cards.filter((card) => card.isKingdom);
    shuffleArray(all_kingdom_cards);

    const KINGDOM_COUNT = 10;
    let kingdomNameList = [];

    /*
        kingdomNameList.push("Outpost");
        */
    //kingdomNameList.push("Sleigh"); 

    while (
      kingdomNameList.length < KINGDOM_COUNT &&
      all_kingdom_cards.length > 0
    ) {
      let card = all_kingdom_cards.pop();
      let cardName = card.name;
      if (
        !not_finish.includes(cardName) &&
        !kingdomNameList.includes(cardName)
      ) {
        kingdomNameList.push(cardName);
      }
    }

    return kingdomNameList.sort();
  },
  choose_basic: function () {
    let basic_cards = [
      "Copper",
      "Curse",
      "Estate",
      "Silver",
      "Gold",
      "Duchy",
      "Province",
      "Platinum",
      "Colony",
    ];
    return basic_cards;
  },
  choose_prophecy: function (landscape_effects, kingdomList) {
    const omenCardNames = allCardsData
      .filter((card) => card.type.includes("Omen"))
      .map((card) => card.name);
    const prophecyList = allCardsData.filter(
      (card) =>
        card.type.includes("Prophecy") && !not_finish.includes(card.name)
    );
    if (omenCardNames.length <= 0 || prophecyList.length <= 0) return;
    if (!kingdomList.find((name) => omenCardNames.includes(name))) return;

    shuffleArray(prophecyList);
    //landscape_effects.push("Enlightenment");
    landscape_effects.push(prophecyList[0].name);
    if (landscape_effects.includes("ApproachingArmy"))
      this.setup_approaching_army(kingdomList);
  },
  choose_landscape_effect: function (kingdomList) {
    const EVENT_COUNT = 3;
    shuffleArray(all_events);
    let landscape_effects = [];
    this.choose_prophecy(landscape_effects, kingdomList);

    while (landscape_effects.length < EVENT_COUNT && all_events.length > 0) {
      let card = all_events.pop();
      if (!not_finish.includes(card.name)) {
        landscape_effects.push(card.name);
      }
    }

    //landscape_effects.push("Maelstrom");
    //landscape_effects.push("Inherited");

    return landscape_effects.sort();
  },
  choose_non_supply: function (playCardList) {
    let name_list = [];

    if (playCardList.includes("Way_of_the_Mouse")) {
      let chosenName = this.setup_way_of_the_mouse(playCardList);
      if (chosenName) {
        name_list.push("Way_of_the_Mouse");
        name_list.push(`Way_of_the_Mouse;${chosenName}`);
        playCardList.push(`${chosenName}`);
      }
    }
    if (playCardList.includes("RiverBoat")) {
      let chosenName = this.setup_riverboat(playCardList);
      if (chosenName) {
        name_list.push("RiverBoat");
        name_list.push(`RiverBoat;${chosenName}`);
        playCardList.push(`${chosenName}`);
      }
    }

    let gain_horse_cards = [
      "Sleigh",
      "Supplies",
      "Scrap",
      "Cavalry",
      "Groom",
      "Hostelry",
      "Livery",
      "Paddock",
      "Ride",
      "Bargain",
      "Demand",
      "Stampede",
    ];
    if (gain_horse_cards.find((card) => playCardList.includes(card))) {
      name_list.push("Horse");
    }

    let gain_loot_cards = [
      "JewelledEgg",
      "Search",
      "Pickaxe",
      "WealthyVillage",
      "Cutthroat",
      "SackofLoot",
      "Peril",
      "Foray",
      "Looting",
      "Invasion",
      "Prosper",
      "Cursed",
    ];
    if (gain_loot_cards.find((card) => playCardList.includes(card))) {
      name_list.push("Loot");
    }

    if (playCardList.includes("Vampire")) {
      name_list.push("Bat");
    }

    let gain_wish_cards = ["MagicLamp", "Leprechaun", "SecretCave"];
    if (gain_wish_cards.find((card) => playCardList.includes(card))) {
      name_list.push("Wish");
    }

    let gain_ghost_cards = ["HauntedMirror", "Cemetery", "Exorcist"];
    if (gain_ghost_cards.find((card) => playCardList.includes(card))) {
      name_list.push("Ghost");
    }

    let gain_imp_cards = ["DevilsWorkshop", "Tormentor", "Exorcist"];
    if (gain_imp_cards.find((card) => playCardList.includes(card))) {
      name_list.push("Imp");
    }

    let gain_wow_cards = [
      "Exorcist",
      "Druid",
      "Pixie",
      "Tracker",
      "Fool",
      "Bard",
      "BlessedVillage",
      "Idol",
      "SacredGrove",
    ];
    if (gain_wow_cards.find((card) => playCardList.includes(card))) {
      name_list.push("Will_o_Wisp");
    }

    return name_list;
  },
  setup_way_of_the_mouse: function (kingdomNameList) {
    let conditionCallback = function (card) {
      let cost = card.cost;
      return (
        card.type.includes("Action") &&
        (cost.coin === 2 || cost.coin === 3) &&
        !cost.debt &&
        !cost.potion
      );
    };
    let chosenCardName = null;
    let all_kingdom_cards = allCardsData.filter(
      (card) => card.isKingdom && !not_finish.includes(card.name)
    );
    let unused_kingdom_cards = all_kingdom_cards.filter(
      (card) => !kingdomNameList.includes(card.name)
    );
    shuffleArray(unused_kingdom_cards);
    unused_kingdom_cards = unused_kingdom_cards.filter(conditionCallback);
    if (unused_kingdom_cards.length > 0) {
      chosenCardName = unused_kingdom_cards[0].name;
    }
    return chosenCardName;
  },
  setup_riverboat: function (kingdomNameList) {
    let conditionCallback = function (card) {
      let cost = card.cost;
      return (
        !card.type.includes("Duration") &&
        card.type.includes("Action") &&
        cost.coin === 5 &&
        !cost.debt &&
        !cost.potion
      );
    };
    let chosenCardName = null;
    let all_kingdom_cards = allCardsData.filter(
      (card) => card.isKingdom && !not_finish.includes(card.name)
    );
    let unused_kingdom_cards = all_kingdom_cards.filter(
      (card) => !kingdomNameList.includes(card.name)
    );
    shuffleArray(unused_kingdom_cards);
    unused_kingdom_cards = unused_kingdom_cards.filter(conditionCallback);
    if (unused_kingdom_cards.length > 0) {
      chosenCardName = unused_kingdom_cards[0].name;
    }
    return chosenCardName;
  },
  setup_approaching_army: function (kingdomNameList) {
    let chosenCardName = null;
    let all_kingdom_cards = allCardsData.filter(
      (card) => card.isKingdom && !not_finish.includes(card.name)
    );
    let unused_kingdom_cards = all_kingdom_cards.filter(
      (card) => !kingdomNameList.includes(card.name)
    );
    shuffleArray(unused_kingdom_cards);
    unused_kingdom_cards = unused_kingdom_cards.filter((card) =>
      card.type.includes("Attack")
    );
    if (unused_kingdom_cards.length > 0) {
      chosenCardName = unused_kingdom_cards[0].name;
    }
    kingdomNameList.push(chosenCardName);
    return chosenCardName;
  },
  /**
   * Generates game material: kingdom list, basic list, landscape, non supply
   */
  generate_materials: function () {
    let kingdomList = this.choose_kingdom(),
      basicList = this.choose_basic(),
      landscapeEffectsList = this.choose_landscape_effect(kingdomList);

    let nonSupplyList = this.choose_non_supply(
      kingdomList.concat(basicList).concat(landscapeEffectsList)
    );

    return [kingdomList, basicList, landscapeEffectsList, nonSupplyList];
  },
  /**
   * Call when in /lobby phase, to choose which (kingdom) cards would be played in this game
   * @param
   * @return
   */
  prepare_game: async function () {
    //let materials = this.generate_materials();
    //await prepare_game(...materials);
  },
};

export default PregameEngine;
