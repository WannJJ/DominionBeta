import {
  Copper,
  Silver,
  Gold,
  Platinum,
  Curse,
  Estate,
  Duchy,
  Province,
  Colony,
} from "./expansions/basic_card.js";
import {
  Chapel,
  Cellar,
  Moat,
  Village,
  Harbinger,
  Merchant,
  Vassal,
  Smithy,
  Remodel,
  Bureaucrat,
  ThroneRoom,
  Militia,
  Gardens,
  Moneylender,
  Poacher,
  CouncilRoom,
  Library,
  Bandit,
  Sentry,
  Laboratory,
  Mine,
  Market,
  Festival,
  Witch,
  Artisan,
  Workshop,
} from "./expansions/base/base_set.js";
import {
  Haven,
  Lighthouse,
  NativeVillage,
  Astrolabe,
  Lookout,
  Monkey,
  FishingVillage,
  SeaChart,
  Smugglers,
  Warehouse,
  Blockade,
  Caravan,
  Cutpurse,
  Island,
  Sailor,
  Salvager,
  TidePools,
  TreasureMap,
  Bazaar,
  Corsair,
  MerchantShip,
  Outpost,
  Pirate,
  SeaWitch,
  Tactician,
  Treasury,
  Wharf,
} from "./expansions/seaside/seaside.js";
import {
  Horse,
  Supplies,
  Sleigh,
  Scrap,
  Cavalry,
  Groom,
  Hostelry,
  Livery,
  Paddock, // gain Horse
  CamelTrain,
  StockPile,
  BountyHunter,
  Cardinal,
  Coven,
  Displace,
  Gatekeeper,
  Sanctuary, // exile
  BlackCat,
  Goatherd,
  Sheepdog,
  SnowyVillage,
  VillageGreen,
  Barge,
  Falconer,
  HuntingLodge,
  Kiln,
  Mastermind,
  Fisherman,
  Destrier,
  Wayfarer,
  AnimalFair,
} from "./expansions/menagerie/menagerie.js";
import {
  Delay,
  Desperation,
  Gamble,
  Pursue,
  Ride,
  Toil,
  Enhance,
  March,
  Transport,
  Banish,
  Bargain,
  Invest,
  Seize_the_Day,
  Commerce,
  Demand,
  Stampede,
  Reap,
  Enclave,
  Alliance,
  Populate,
} from "./expansions/menagerie/menagerie_event.js";
import {
  Way_of_the_Butterfly,
  Way_of_the_Camel,
  Way_of_the_Chameleon,
  Way_of_the_Frog,
  Way_of_the_Goat,
  Way_of_the_Horse,
  Way_of_the_Mole,
  Way_of_the_Monkey,
  Way_of_the_Mouse,
  Way_of_the_Mule,
  Way_of_the_Otter,
  Way_of_the_Owl,
  Way_of_the_Ox,
  Way_of_the_Pig,
  Way_of_the_Rat,
  Way_of_the_Seal,
  Way_of_the_Sheep,
  Way_of_the_Squirrel,
  Way_of_the_Turtle,
  Way_of_the_Worm,
} from "./expansions/menagerie/menagerie_way.js";
import {
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
} from "./expansions/plunder/plunder.js";
import {
  Bury,
  Avoid,
  Deliver,
  Peril,
  Rush,
  Foray,
  Launch,
  Mirror,
  Prepare,
  Scrounge,
  Journey,
  Maelstrom,
  Looting,
  Invasion,
  Prosper,
} from "./expansions/plunder/plunder_event.js";
import {
  Amphora,
  Doubloons,
  EndlessChalice,
  Figurehead,
  Hammer,
  Insignia,
  Jewels,
  Orb,
  PrizeGoat,
  PuzzleBox,
  Sextant,
  Shield,
  SpellScroll,
  Staff,
  Sword,
} from "./expansions/plunder/plunder_loot.js";
import {
  CandlestickMaker,
  Stonemason,
  Doctor,
  Masterpiece,
  Advisor,
  Herald,
  Plaza,
  Taxman,
  Baker,
  Butcher,
  Journeyman,
  MerchantGuild,
  Soothsayer,
} from "./expansions/guilds/guilds.js";
import {
  Hovel,
  Necropolis,
  OvergrownEstate,
} from "./expansions/dark_ages/dark_ages_shelters.js";
import {
  Aqueduct,
  Arena,
  Bandit_Fort,
  Basilica,
  Baths,
  Battlefield,
  Colonnade,
  Defiled_Shrine,
  Fountain,
  Keep,
  Labyrinth,
  Mountain_Pass,
  Museum,
  Obelisk,
  Orchard,
  Palace,
  Tomb,
  Tower,
  Triumphal_Arch,
  Wall,
  Wolf_Den,
} from "./expansions/empires/empires_landmark.js";
import {
  Triumph,
  Annex,
  Donate,
  Advance,
  Delve,
  Tax,
  Banquet,
  Ritual,
  Salt_the_Earth,
  Wedding,
  Windfall,
  Conquest,
  Dominate,
} from "./expansions/empires/empires_event.js";
import {
  Bat,
  Changeling,
  Cobbler,
  Crypt,
  Den_of_Sin,
  GhostTown,
  Guardian,
  DevilsWorkshop,
  Monastery,
  NightWatchman,
  Raider,
  Vampire,
  Exorcist,
  Werewolf, //Night
  FaithfulHound,
  SecretCave,
  Cemetery,
  Conclave,
  Necromancer,
  Shepherd,
  Pooka,
  TragicHero,
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
  Wish,
  Ghost,
  Imp,
  Will_o_Wisp, //Non supply
  ZombieApprentice,
  ZombieMason,
  ZombieSpy,
} from "./expansions/nocturne/nocturne.js";
import {
  HauntedMirror,
  MagicLamp,
  Goat,
  Pasture,
  Pouch,
  CursedGold,
  LuckyCoin,
} from "./expansions/nocturne/nocturne_heirloom.js";
import {
  TheEarthsGift,
  TheFieldsGift,
  TheFlamesGift,
  TheForestsGift,
  TheMoonsGift,
  TheMountainsGift,
  TheRiversGift,
  TheSeasGift,
  TheSkysGift,
  TheSunsGift,
  TheSwampsGift,
  TheWindsGift,
} from "./expansions/nocturne/nocturne_boon.js";
import {
  BadOmens,
  Delusion,
  Envy,
  Famine,
  Fear,
  Greed,
  Haunting,
  Locusts,
  Misery,
  Plague,
  Poverty,
  War,
} from "./expansions/nocturne/nocturne_hex.js";
import {
  Deluded,
  Envious,
  Lost_in_the_Woods,
  Miserable,
  TwiceMiserable,
} from "./expansions/nocturne/nocturne_state.js";
import {
  Alley,
  Aristocrat,
  Artist,
  Change,
  CraftsMan,
  Daimyo,
  Fishmonger,
  GoldMine,
  ImperialEnvoy,
  Kitsune,
  Litter,
  MountainShrine,
  Ninja,
  Poet,
  Rice,
  RiceBroker,
  RiverShrine,
  RiverBoat,
  Ronin,
  RootCellar,
  RusticVillage,
  Samurai,
  SnakeWitch,
  Tanuki,
  TeaHouse,
} from "./expansions/rising_sun/rising_sun.js";
import {
  CityQuarter,
  Engineer,
  Overlord,
  RoyalBlacksmith,
  Encampment,
  Plunder,
  Patrician,
  Emporium,
  Settlers,
  BustlingVillage,
  Catapult,
  Rocks,
  ChariotRace,
  Enchantress,
  FarmersMarket,
  Gladiator,
  Fortune,
  Sacrifice,
  Temple,
  Villa,
  Archive,
  Capital,
  Charm,
  Crown,
  Forum,
  Groundskeeper,
  Legionary,
  WildHunt,
  HumbleCastle,
  CrumblingCastle,
  SmallCastle,
  HauntedCastle,
  OpulentCastle,
  SprawlingCastle,
  GrandCastle,
  KingsCastle,
} from "./expansions/empires/empires.js";

import {
  getKingdomSupply,
  getBasicSupply,
} from "./features/TableSide/Supply.jsx";
import { getDeck } from "./features/PlayerSide/CardPile/CardPile.jsx";
import { getTableSide } from "./features/TableSide/TableSide.jsx";
import { HexBoonManager } from "./expansions/nocturne/HexBoonManager.js";

import { setNonSupplyList } from "./pregame/NonSupplySetup.js";
import { shuffleArray } from "./utils/helpers.js";
import { landscapeEffectManager } from "./features/TableSide/LandscapeEffect/LandscapeEffectManager.js";

const basic = [
    Copper,
    Silver,
    Gold,
    Platinum,
    Curse,
    Estate,
    Duchy,
    Province,
    Colony,
  ],
  base = [
    Chapel,
    Cellar,
    Moat,
    Village,
    Harbinger,
    Merchant,
    Vassal,
    Smithy,
    Remodel,
    Bureaucrat,
    ThroneRoom,
    Militia,
    Gardens,
    Moneylender,
    Poacher,
    CouncilRoom,
    Library,
    Bandit,
    Sentry,
    Laboratory,
    Mine,
    Market,
    Festival,
    Witch,
    Artisan,
    Workshop,
  ],
  seaside = [
    Haven,
    Lighthouse,
    NativeVillage,
    Astrolabe,
    Lookout,
    Monkey,
    FishingVillage,
    SeaChart,
    Smugglers,
    Warehouse,
    Blockade,
    Caravan,
    Cutpurse,
    Island,
    Sailor,
    Salvager,
    TidePools,
    TreasureMap,
    Bazaar,
    Corsair,
    MerchantShip,
    Outpost,
    Pirate,
    SeaWitch,
    Tactician,
    Treasury,
    Wharf,
  ],
  menagerie = [
    Cavalry,
    Supplies,
    Sleigh,
    Scrap,
    Groom,
    Hostelry,
    Livery,
    Paddock,
    CamelTrain,
    StockPile,
    BountyHunter,
    Cardinal,
    Coven,
    Displace,
    Gatekeeper,
    Sanctuary,
    BlackCat,
    Goatherd,
    Sheepdog,
    SnowyVillage,
    VillageGreen,
    Barge,
    Falconer,
    HuntingLodge,
    Kiln,
    Mastermind,
    Fisherman,
    Destrier,
    Wayfarer,
    AnimalFair,
  ],
  menagerie_events = [
    Delay,
    Desperation,
    Gamble,
    Pursue,
    Ride,
    Toil,
    Enhance,
    March,
    Transport,
    Banish,
    Bargain,
    Invest,
    Seize_the_Day,
    Commerce,
    Demand,
    Stampede,
    Reap,
    Enclave,
    Alliance,
    Populate,
  ],
  menagerie_ways = [
    Way_of_the_Butterfly,
    Way_of_the_Camel,
    Way_of_the_Chameleon,
    Way_of_the_Frog,
    Way_of_the_Goat,
    Way_of_the_Horse,
    Way_of_the_Mole,
    Way_of_the_Monkey,
    Way_of_the_Mouse,
    Way_of_the_Mule,
    Way_of_the_Otter,
    Way_of_the_Owl,
    Way_of_the_Ox,
    Way_of_the_Pig,
    Way_of_the_Rat,
    Way_of_the_Seal,
    Way_of_the_Sheep,
    Way_of_the_Squirrel,
    Way_of_the_Turtle,
    Way_of_the_Worm,
  ],
  empires = [
    CityQuarter,
    Engineer,
    Overlord,
    RoyalBlacksmith,
    Encampment,
    Plunder,
    Patrician,
    Emporium,
    Settlers,
    BustlingVillage,
    Catapult,
    Rocks,
    ChariotRace,
    Enchantress,
    FarmersMarket,
    Gladiator,
    Fortune,
    Sacrifice,
    Temple,
    Villa,
    Archive,
    Capital,
    Charm,
    Crown,
    Forum,
    Groundskeeper,
    Legionary,
    WildHunt,
    HumbleCastle,
    CrumblingCastle,
    SmallCastle,
    HauntedCastle,
    OpulentCastle,
    SprawlingCastle,
    GrandCastle,
    KingsCastle,
  ],
  empires_landmarks = [
    Aqueduct,
    Arena,
    Bandit_Fort,
    Basilica,
    Baths,
    Battlefield,
    Colonnade,
    Defiled_Shrine,
    Fountain,
    Keep,
    Labyrinth,
    Mountain_Pass,
    Museum,
    Obelisk,
    Orchard,
    Palace,
    Tomb,
    Tower,
    Triumphal_Arch,
    Wall,
    Wolf_Den,
  ],
  empires_events = [
    Triumph,
    Annex,
    Donate,
    Advance,
    Delve,
    Tax,
    Banquet,
    Ritual,
    Salt_the_Earth,
    Wedding,
    Windfall,
    Conquest,
    Dominate,
  ],
  plunder = [
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
  ],
  plunder_events = [
    Bury,
    Avoid,
    Deliver,
    Peril,
    Rush,
    Foray,
    Launch,
    Mirror,
    Prepare,
    Scrounge,
    Journey,
    Maelstrom,
    Looting,
    Invasion,
    Prosper,
  ],
  loot = [
    Amphora,
    Doubloons,
    EndlessChalice,
    Figurehead,
    Hammer,
    Insignia,
    Jewels,
    Orb,
    PrizeGoat,
    PuzzleBox,
    Sextant,
    Shield,
    SpellScroll,
    Staff,
    Sword,
  ],
  non_supply = [
    Horse,
    Bat,
    Wish,
    Ghost,
    Imp,
    Will_o_Wisp,
    ZombieApprentice,
    ZombieMason,
    ZombieSpy,
  ],
  guilds = [
    CandlestickMaker,
    Stonemason,
    Doctor,
    Masterpiece,
    Advisor,
    Herald,
    Plaza,
    Taxman,
    Baker,
    Butcher,
    Journeyman,
    MerchantGuild,
    Soothsayer,
  ],
  dark_ages_shelters = [Hovel, Necropolis, OvergrownEstate],
  nocturne = [
    Changeling,
    Cobbler,
    Crypt,
    Den_of_Sin,
    GhostTown,
    Guardian,
    DevilsWorkshop,
    Monastery,
    NightWatchman,
    Raider,
    Vampire,
    Exorcist,
    Werewolf,
    FaithfulHound,
    SecretCave,
    Cemetery,
    Conclave,
    Necromancer,
    Shepherd,
    Pooka,
    TragicHero,
    Leprechaun,
    Skulk,
    CursedVillage,
    Tormentor,
    Druid,
    Pixie,
    Tracker,
    Fool,
    Bard,
    BlessedVillage,
    Idol,
    SacredGrove,
  ],
  nocturne_heirloom = [
    HauntedMirror,
    MagicLamp,
    Goat,
    Pasture,
    Pouch,
    CursedGold,
    LuckyCoin,
  ],
  nocturne_hex_boon = [
    TheEarthsGift,
    TheFieldsGift,
    TheFlamesGift,
    TheForestsGift,
    TheMoonsGift,
    TheMountainsGift,
    TheRiversGift,
    TheSeasGift,
    TheSkysGift,
    TheSunsGift,
    TheSwampsGift,
    TheWindsGift,
    BadOmens,
    Delusion,
    Envy,
    Famine,
    Fear,
    Greed,
    Haunting,
    Locusts,
    Misery,
    Plague,
    Poverty,
    War,
  ],
  nocturne_state = [
    Deluded,
    Envious,
    Lost_in_the_Woods,
    Miserable,
    TwiceMiserable,
  ],
  rising_sun = [
    Alley,
    Aristocrat,
    Artist,
    Change,
    CraftsMan,
    Daimyo,
    Fishmonger,
    GoldMine,
    ImperialEnvoy,
    Kitsune,
    Litter,
    MountainShrine,
    Ninja,
    Poet,
    Rice,
    RiceBroker,
    RiverShrine,
    RiverBoat,
    Ronin,
    RootCellar,
    RusticVillage,
    Samurai,
    SnakeWitch,
    Tanuki,
    TeaHouse,
  ];
//expansion_list = [base, seaside, menagerie, plunder, guilds, nocturne, rising_sun];

let all_cards = [];
all_cards.push(...basic);
all_cards.push(...base);
all_cards.push(...seaside);
all_cards.push(...menagerie);
all_cards.push(...menagerie_events);
all_cards.push(...menagerie_ways);
all_cards.push(...empires);
all_cards.push(...empires_landmarks);
all_cards.push(...empires_events);
all_cards.push(...plunder);
all_cards.push(...plunder_events);
all_cards.push(...loot);
all_cards.push(...non_supply);
all_cards.push(...guilds);
all_cards.push(...dark_ages_shelters);
all_cards.push(...nocturne);
all_cards.push(...nocturne_heirloom);
all_cards.push(...nocturne_hex_boon);
all_cards.push(...nocturne_state);
all_cards.push(...rising_sun);
/*
all_cards.push(...nocturne_non_supply);
*/

let all_kingdom_cards = [];
all_kingdom_cards.push(...base);
all_kingdom_cards.push(...seaside);
all_kingdom_cards.push(...menagerie);
all_kingdom_cards.push(...guilds);
all_kingdom_cards.push(...plunder);
all_kingdom_cards.push(...nocturne);
all_kingdom_cards.push(...rising_sun);
all_kingdom_cards.push(...empires);

let all_events = [];
all_events.push(...menagerie_events);
all_events.push(...menagerie_ways);
all_events.push(...empires_landmarks);
all_events.push(...empires_events);
all_events.push(...plunder_events);

let not_finish = [Way_of_the_Chameleon, Journey, Mountain_Pass];

class SetupEngine {
  setup() {}
  choose_starting_deck() {}
  get_replacing_heirloom_class_list(player_kingdom_class_list) {
    let class_list = [];
    if (player_kingdom_class_list.includes(Cemetery)) {
      class_list.push(HauntedMirror);
    }
    if (player_kingdom_class_list.includes(Fool)) {
      class_list.push(LuckyCoin);
    }
    if (player_kingdom_class_list.includes(Pixie)) {
      class_list.push(Goat);
    }
    if (player_kingdom_class_list.includes(Pooka)) {
      class_list.push(CursedGold);
    }
    if (player_kingdom_class_list.includes(SecretCave)) {
      class_list.push(MagicLamp);
    }
    if (player_kingdom_class_list.includes(Shepherd)) {
      class_list.push(Pasture);
    }
    if (player_kingdom_class_list.includes(Tracker)) {
      class_list.push(Pouch);
    }
    return class_list;
  }
  async set_starting_deck(player, heirloom_class_list) {
    this.starting_deck_class_list = [
      //Copper, Copper, Copper,
      //Copper, Copper, Copper, Copper,
      //Hovel, Necropolis, OvergrownEstate,
      //Estate, Estate, Estate,
      Silver,
      Gold,
      //
      /*
            Sentry
            Festival, Festival,
            
            CouncilRoom, 
            Militia, BlackCat,
            */
      Festival,
      Festival,
      Platinum,
      Platinum,
      //Trickster,Capital, SacredGrove,
    ];
    player.all_cards = [];
    for (let clss of this.starting_deck_class_list) {
      let deckCard = new clss(player);
      if (heirloom_class_list.length > 0 && deckCard.name === "Copper") {
        let heirloomClass = heirloom_class_list.pop();
        deckCard = new heirloomClass(player);
      } else {
      }
      player.all_cards.push(deckCard);
    }
    // randomly mix player's deck
    shuffleArray(player.all_cards);
    await getDeck().setCardAll(player.all_cards.map((c) => c));
  }

  //TODO: implement restart game
  restart_game() {}
  /**
   * Called right before game start, when everyone is in game,
   * based on GameSetup data from server, transform cards name into real card and prepare for the gameplay.
   * Called by Engine, or Player. Look at main.js
   * @param {{JSON Object}} data dict data from server response, when request POST to /finish_setup
   * @param {{Player}} player the player, represents user
   * @return
   */
  async finish_setup(data, player, isNewGame = true) {
    let player_kingdom, player_basic, player_landscape_effect, nonSupply;
    if (!data || typeof data === "string" || data instanceof String) {
      //single player mode
      //[player_kingdom, player_basic, player_landscape_effect, nonSupply] = await this.generate_materials();
    } else {
      // multiplayer mode
      //console.log(data);
      let basic = JSON.parse(data.basic),
        kingdom = JSON.parse(data.kingdom),
        landscape_effect = JSON.parse(data.landscape_effect);
      nonSupply = JSON.parse(data.nonSupply);

      player_basic = basic.map((c) => getClassFromName(c));
      player_kingdom = kingdom.map((c) => getClassFromName(c));
      player_landscape_effect = landscape_effect.map((c) =>
        getClassFromName(c)
      );
    }
    await getBasicSupply().setClassList(player_basic);
    await getKingdomSupply().setClassList(player_kingdom);

    await getTableSide().setLandscapeEffectList(player_landscape_effect);
    await setNonSupplyList(nonSupply);
    await HexBoonManager.setHexBoonPile([
      ...player_kingdom,
      ...player_landscape_effect,
    ]);

    if (isNewGame) {
      await getBasicSupply().setup(player);
      await getKingdomSupply().setup(player);

      await landscapeEffectManager.setup();
      //TODO: nen de set non supply list o day; setup cho non supply pile

      let heirloom_class_list =
        this.get_replacing_heirloom_class_list(player_kingdom);
      await this.set_starting_deck(player, heirloom_class_list);
    }
  }
}

function getClassName(clss) {
  let name = undefined;
  try {
    name = clss.name;
  } catch {
    console.log("Class name: ", clss);
    alert("GetClassName ERROR");
  }
  return name;
}
function getClassFromName(class_name) {
  if (!class_name || class_name === "") {
    return;
  }

  console.log(all_cards.length);

  for (let i = 0; i < all_cards.length; i++) {
    let card_class = all_cards[i];
    if (i < 10) console.log(card_class.name, card_class, class_name);
    if (card_class.name === class_name) {
      return card_class;
    }
  }
  console.trace("CANT FIND THIS CLASS", class_name);
  alert("CANT FIND THIS CLASS");
  return undefined;
}
function getAllCards() {
  return all_cards.map((c) => c);
}

export { SetupEngine, getClassFromName, getClassName, getAllCards };
