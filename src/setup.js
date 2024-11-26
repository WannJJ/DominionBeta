
import {Copper, Silver, Gold, Platinum, Curse, Estate, Duchy, Province, Colony} from './expansions/basic_card.js';
import {Chapel, Cellar, Moat, Village, Harbinger, Merchant, Vassal, Smithy, Remodel, Bureaucrat, ThroneRoom,
    Militia, Gardens, Moneylender, Poacher, CouncilRoom, Library, Bandit,
    Sentry, Laboratory, Mine, Market, Festival, Witch, Artisan, Workshop} from './expansions/base/base_set.js';
import {Haven, Lighthouse, NativeVillage, Astrolabe, Lookout, Monkey, FishingVillage, SeaChart, Smugglers, Warehouse,
    Blockade, Caravan, Cutpurse, Island, Sailor, Salvager, TidePools, TreasureMap, Bazaar, Corsair, MerchantShip,
    Outpost, Pirate, SeaWitch, Tactician, Treasury, Wharf} from './expansions/seaside/seaside.js';
import { Horse, Supplies, Sleigh, Scrap, Cavalry, Groom, Hostelry, Livery, Paddock, // gain Horse
    CamelTrain, StockPile, BountyHunter, Cardinal, Coven, Displace, Gatekeeper, Sanctuary, // exile
    BlackCat, Goatherd, Sheepdog, SnowyVillage, VillageGreen, Barge, Falconer, HuntingLodge,
    Kiln, Mastermind, Fisherman, Destrier, Wayfarer, AnimalFair } from './expansions/menagerie/menagerie.js';
import {Delay, Desperation, Gamble, Pursue, Ride, Toil, Enhance, March, Transport, 
    Banish, Bargain, Invest, Seize_the_Day, Commerce, Demand, Stampede, Reap, Enclave,
    Alliance, Populate} from './expansions/menagerie/menagerie_event.js';
import {Way_of_the_Butterfly, Way_of_the_Camel, Way_of_the_Chameleon, Way_of_the_Frog, Way_of_the_Goat,
    Way_of_the_Horse, Way_of_the_Mole, Way_of_the_Monkey, Way_of_the_Mouse, Way_of_the_Mule, Way_of_the_Otter,
    Way_of_the_Owl, Way_of_the_Ox, Way_of_the_Pig, Way_of_the_Rat, Way_of_the_Seal, Way_of_the_Sheep, Way_of_the_Squirrel,
    Way_of_the_Turtle, Way_of_the_Worm} from './expansions/menagerie/menagerie_way.js';
import {JewelledEgg, Search, Pickaxe, WealthyVillage, Cutthroat, SackofLoot} from './expansions/plunder/plunder.js';
import {Bury, Avoid, Deliver, Peril, Rush, Foray, Launch, Mirror, Prepare, Scrounge,
    Journey, Maelstrom, Looting, Invasion, Prosper} from './expansions/plunder/plunder_event.js';
import {Amphora, Doubloons, EndlessChalice, Figurehead, Hammer, Insignia, Jewels, Orb, PrizeGoat, PuzzleBox, Sextant, Shield, SpellScroll,
    Staff, Sword} from './expansions/plunder/plunder_loot.js';
import {CandlestickMaker, Stonemason, Doctor, Masterpiece, Advisor, Herald,
    Plaza, Taxman, Baker, Butcher, Journeyman, MerchantGuild, Soothsayer} from './expansions/guilds/guilds.js';
import {Hovel, Necropolis, OvergrownEstate} from './expansions/dark_ages/dark_ages_shelters.js';
import { Aqueduct, Arena, Bandit_Fort, Basilica, Baths, Battlefield, Colonnade, Defiled_Shrine, Fountain, Keep, Labyrinth, Mountain_Pass,
    Museum, Obelisk, Orchard, Palace, Tomb, Tower, Triumphal_Arch, Wall, Wolf_Den } from './expansions/empires/empires_landmark.js';
import {Triumph, Annex, Donate, Advance, Delve, Tax, Banquet, 
    Ritual, Salt_the_Earth, Wedding, Windfall, Conquest, Dominate} from './expansions/empires/empires_event.js';
import { Bat, Changeling, Cobbler, Crypt, Den_of_Sin, GhostTown, Guardian, DevilsWorkshop, Monastery, NightWatchman, Raider, Vampire, Exorcist, Werewolf,   //Night
    FaithfulHound, SecretCave, Cemetery, Conclave, Necromancer, Shepherd, Pooka, TragicHero, 
    Leprechaun, Skulk, CursedVillage, Tormentor, //DOOM
    Druid, Pixie, Tracker, Fool, Bard, BlessedVillage, Idol, SacredGrove, //FATE
    Wish, Ghost, Imp, Will_o_Wisp, //Non supply
    } from './expansions/nocturne/nocturne.js';
import { HauntedMirror, MagicLamp, Goat, Pasture, Pouch, CursedGold, LuckyCoin } from './expansions/nocturne/nocturne_heirloom.js';
import { TheEarthsGift, TheFieldsGift, TheFlamesGift, TheForestsGift, TheMoonsGift, TheMountainsGift, 
    TheRiversGift, TheSeasGift, TheSkysGift, TheSunsGift, TheSwampsGift, TheWindsGift } from './expansions/nocturne/nocturne_boon.js'; 
import { BadOmens, Delusion, Envy, Famine, Fear, Greed, Haunting, Locusts, Misery, Plague, Poverty, War } from './expansions/nocturne/nocturne_hex.js';
import { Deluded, Envious, Lost_in_the_Woods, Miserable, TwiceMiserable } from './expansions/nocturne/nocturne_state.js';
import { Alley, Aristocrat, Artist, Change, CraftsMan, Daimyo, Fishmonger, GoldMine, ImperialEnvoy,
    Kitsune, Litter, MountainShrine, Ninja, Poet, Rice, RiceBroker, 
   RiverShrine, RiverBoat, Ronin, RootCellar, RusticVillage, Samurai, SnakeWitch, Tanuki, TeaHouse } from './expansions/rising_sun/rising_sun.js';
    /*

import {ZombieApprentice, ZombieMason, ZombieSpy, //Non supply
    } from './expansions/nocturne/nocturne.js';
*/

import { getKingdomSupply, getBasicSupply } from './features/TableSide/Supply.jsx';
import { getDeck } from './features/PlayerSide/CardPile/CardPile.jsx';
import { getTableSide } from './features/TableSide/TableSide.jsx';
import { HexBoonManager } from './expansions/nocturne/HexBoonManager.js';

import { choose_non_supply, setNonSupplyList } from './pregame/NonSupplySetup.js';
import { prepare_game } from './api/signin.js';


const basic = [Copper, Silver, Gold, Platinum, Curse, Estate, Duchy, Province, Colony],
        base = [Chapel, Cellar, Moat, Village, Harbinger, Merchant, Vassal, Smithy, Remodel, Bureaucrat, ThroneRoom,
            Militia, Gardens, Moneylender, Poacher, CouncilRoom, Library, Bandit,
            Sentry, Laboratory, Mine, Market, Festival, Witch, Artisan, Workshop],
        seaside = [Haven, Lighthouse, NativeVillage, Astrolabe, Lookout, Monkey, FishingVillage, SeaChart, Smugglers, Warehouse,
            Blockade, Caravan, Cutpurse, Island, Sailor, Salvager, TidePools, TreasureMap, Bazaar, Corsair, MerchantShip,
            Outpost, Pirate, SeaWitch, Tactician, Treasury, Wharf],
        menagerie =[Cavalry, Supplies, Sleigh, Scrap, Groom, Hostelry, Livery, Paddock,
            CamelTrain, StockPile, BountyHunter, Cardinal, Coven, Displace, Gatekeeper, Sanctuary,
            BlackCat, Goatherd, Sheepdog, SnowyVillage, VillageGreen, Barge, Falconer, HuntingLodge,
            Kiln, Mastermind, Fisherman, Destrier, Wayfarer, AnimalFair],
        menagerie_events = [Delay, Desperation, Gamble, Pursue, Ride, Toil, Enhance, March, Transport, 
            Banish, Bargain, Invest, Seize_the_Day, Commerce, Demand, Stampede, Reap, Enclave,
            Alliance, Populate],
        menagerie_ways = [Way_of_the_Butterfly, Way_of_the_Camel, Way_of_the_Chameleon, Way_of_the_Frog, Way_of_the_Goat,
            Way_of_the_Horse, Way_of_the_Mole, Way_of_the_Monkey, Way_of_the_Mouse, Way_of_the_Mule, Way_of_the_Otter,
            Way_of_the_Owl, Way_of_the_Ox, Way_of_the_Pig, Way_of_the_Rat, Way_of_the_Seal, Way_of_the_Sheep, Way_of_the_Squirrel,
            Way_of_the_Turtle, Way_of_the_Worm],
        empires_landmarks = [Aqueduct, Arena, Bandit_Fort, Basilica, Baths, Battlefield, Colonnade, Defiled_Shrine, Fountain, Keep, Labyrinth, Mountain_Pass,
            Museum, Obelisk, Orchard, Palace, Tomb, Tower, Triumphal_Arch, Wall, Wolf_Den],
        empires_events = [Triumph, Annex, Donate, Advance, Delve, Tax, Banquet, 
            Ritual, Salt_the_Earth, Wedding, Windfall, Conquest, Dominate],
        plunder = [JewelledEgg, Search, Pickaxe, WealthyVillage, Cutthroat, SackofLoot],
        plunder_events = [Bury, Avoid, Deliver, Peril, Rush, Foray, Launch, Mirror, Prepare, Scrounge,
            Journey, Maelstrom, Looting, Invasion, Prosper],
        loot = [Amphora, Doubloons, EndlessChalice, Figurehead, Hammer, Insignia, Jewels, Orb, PrizeGoat, PuzzleBox, Sextant, Shield, SpellScroll,
            Staff, Sword],
        non_supply = [Horse, Bat, Wish, Ghost, Imp, Will_o_Wisp],
        guilds = [CandlestickMaker, Stonemason, Doctor, Masterpiece, Advisor, Herald,
            Plaza, Taxman, Baker, Butcher, Journeyman, MerchantGuild, Soothsayer],
        dark_ages_shelters = [Hovel, Necropolis, OvergrownEstate],
        nocturne = [Changeling, Cobbler, Crypt, Den_of_Sin, GhostTown, Guardian, DevilsWorkshop, Monastery, NightWatchman, Raider, Vampire, Exorcist, Werewolf,
            FaithfulHound, SecretCave, Cemetery, Conclave, Necromancer, Shepherd, Pooka, TragicHero,
            Leprechaun, Skulk, CursedVillage, Tormentor, 
            Druid, Pixie, Tracker, Fool, Bard, BlessedVillage, Idol, SacredGrove,
            ],
        nocturne_heirloom = [HauntedMirror, MagicLamp, Goat, Pasture, Pouch, CursedGold, LuckyCoin],
        nocturne_hex_boon = [TheEarthsGift, TheFieldsGift, TheFlamesGift, TheForestsGift, TheMoonsGift, TheMountainsGift, 
            TheRiversGift, TheSeasGift, TheSkysGift, TheSunsGift, TheSwampsGift, TheWindsGift,
            BadOmens, Delusion, Envy, Famine, Fear, Greed, Haunting, Locusts, Misery, Plague, Poverty, War,],
        nocturne_state = [Deluded, Envious, Lost_in_the_Woods, Miserable, TwiceMiserable],
        rising_sun = [Alley, Aristocrat, Artist, Change, CraftsMan, Daimyo, Fishmonger, GoldMine, ImperialEnvoy,
            Kitsune, Litter, MountainShrine, Ninja, Poet, Rice, RiceBroker, 
           RiverShrine, RiverBoat, Ronin, RootCellar, RusticVillage, Samurai, SnakeWitch, Tanuki, TeaHouse],
        expansion_list = [base, seaside, menagerie, plunder, guilds, nocturne, rising_sun];

let all_cards = [];
all_cards.push(...basic);
all_cards.push(...base);
all_cards.push(...seaside);
all_cards.push(...menagerie);
all_cards.push(...menagerie_events);
all_cards.push(...menagerie_ways);
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

let all_events = [];
all_events.push(...menagerie_events);
all_events.push(...menagerie_ways);
all_events.push(...empires_landmarks);
all_events.push(...empires_events);
all_events.push(...plunder_events);

let not_finish = [
    Smugglers, Outpost, Corsair,
    Gatekeeper, Goatherd,
    Advisor, 
    Way_of_the_Butterfly, Way_of_the_Chameleon, Way_of_the_Frog, Way_of_the_Mouse, Way_of_the_Seal, Way_of_the_Squirrel, Way_of_the_Turtle,
    Avoid, Journey, Maelstrom,      
    Search, Cutthroat,
    Keep, Mountain_Pass,
    Necromancer, Pixie, Druid,
    RiverBoat,
];


class SetupEngine{
    setup(){
    }
    choose_kingdom(no_rules=true){
        if(no_rules){       // completely random, pick 10 cards out of all cards
            //all_kingdom_cards = rising_sun;
            
            const KINGDOM_COUNT = 10;
            shuffleArray(all_kingdom_cards);
            this.kingdom_name = [];
            //this.kingdom_name = all_kingdom_cards.slice(0, KINGDOM_COUNT);
            while(this.kingdom_name.length < KINGDOM_COUNT && all_kingdom_cards.length > 0){
                let card_class = all_kingdom_cards.pop();
                if(!not_finish.includes(card_class)){
                    this.kingdom_name.push(card_class);
                }
            }

            //this.kingdom_name.push(DevilsWorkshop);
            
            return this.kingdom_name;
        } else{
            let chosen = [];
            while(chosen.length < 10){
                let index = Math.floor(Math.random() * all_kingdom_cards.length);
                let Card = all_kingdom_cards[index];
                if(chosen.includes(Card)) continue;
                if(new Card().cost.coin <= 2 && chosen.filter(C => new C().cost.coin <= 2).length >= 3) continue;
                if(new Card().cost.coin >= 6 && chosen.filter(C => new C().cost.coin >= 6).length >= 3) continue;
                if(chosen.length === 9 && new Card().cost.coin !== 5 && chosen.find(C => new C().cost.coin === 5) === undefined) continue;
                if(chosen.length === 9 && !new Card().type.includes('Attack') && chosen.find(C => new C().type.includes('Attack')) === undefined) continue;
                if(new Card().type.includes('Attack') && chosen.filter(C => new C().type.includes('Attack')).length >= 3) continue;
                if(new Card().type.includes('Treasure') && chosen.filter(C => new C().type.includes('Treasure')).length >= 5) continue;
                if(new Card().type.includes('Reaction') && chosen.filter(C => new C().type.includes('Reaction')).length >= 4) continue;
                if(new Card().type.includes('Victory') && chosen.filter(C => new C().type.includes('Victory')).length >= 3) continue;
                if(new Card().type.includes('Victory') && chosen.filter(C => new C().type.includes('Victory') && new C().type.length===1).length >= 2) continue;
                let expansion_counter = expansion_list.map(c => 0);
                all_kingdom_cards.forEach(C => {
                    for(let i=0; i<expansion_list.length; i++){
                        if(expansion_list[i].includes(C)){
                            expansion_counter[i] += 1;
                            break;
                        }
                    }
                });  
                chosen.push(Card);              
            }                        
        }        
    }
    choose_basic(){
        this.basic_cards = [Copper, Curse, Estate, Silver, Gold, Duchy, Province, Platinum, Colony]
        return this.basic_cards;
    }
    choose_landscape_effect(){
        //all_events = empires_events;

        const EVENT_COUNT = 3;
        shuffleArray(all_events);
        this.landscape_effects = [];
        //this.landscape_effects = all_events.slice(0, EVENT_COUNT);
        while(this.landscape_effects.length < EVENT_COUNT && all_events.length > 0){
            let card_class = all_events.pop();
            if(!not_finish.includes(card_class)){
                this.landscape_effects.push(card_class);
            }
        }
       
        //this.landscape_effects.push(Way_of_the_Rat);                                                                                                             
                                    
        return this.landscape_effects;
    }
    choose_starting_deck(){}
    get_replacing_heirloom_class_list(player_kingdom_class_list){
        let class_list = [];
        if(player_kingdom_class_list.includes(Cemetery)){
            class_list.push(HauntedMirror);
        }
        if(player_kingdom_class_list.includes(Fool)){
            class_list.push(LuckyCoin);
        }
        if(player_kingdom_class_list.includes(Pixie)){
            class_list.push(Goat);
        }
        if(player_kingdom_class_list.includes(Pooka)){
            class_list.push(CursedGold);
        }
        if(player_kingdom_class_list.includes(SecretCave)){
            class_list.push(MagicLamp);
        }
        if(player_kingdom_class_list.includes(Shepherd)){
            class_list.push(Pasture);
        }
        if(player_kingdom_class_list.includes(Tracker)){
            class_list.push(Pouch);
        }
        return class_list;
        
    }
    async set_starting_deck(player, heirloom_class_list){
        this.starting_deck_class_list = [
            Copper, Copper, Copper,
            Copper, Copper, Copper, Copper,
            Hovel, Necropolis, OvergrownEstate,
            //Estate, Estate, Estate,
            //Silver, Gold, Sentry,  
        ];
        player.all_cards = [];
        for(let clss of this.starting_deck_class_list){
            let deckCard = new clss(player);
            if(heirloom_class_list.length > 0 && deckCard.name === 'Copper'){
                let heirloomClass = heirloom_class_list.pop();
                deckCard = new heirloomClass(player);
            } else {}
            player.all_cards.push(deckCard);
        }
        // randomly mix player's deck
        shuffleArray(player.all_cards);
        await getDeck().setCardAll(player.all_cards.map(c => c));
    }
    
    /**
     * Generates game material: kingdom list, basic list, landscape, non supply
     */
    async generate_materials(){
        let kingdomList = this.choose_kingdom(),
            basicList = this.choose_basic(),
            landscapeEffectsList = this.choose_landscape_effect(),
            nonSupplyList = await choose_non_supply(this.basic_cards.concat(this.kingdom_name).concat(this.landscape_effects));
        return [kingdomList, basicList, landscapeEffectsList, nonSupplyList];
    }

    /**
     * Call when in /setup or setup.html, to choose which (kingdom) cards would be played in this game
     * @param
     * @return
     */
    async prepare_game(){
        /*
        let kingdomNameList = this.choose_kingdom().map(clss => getClassName(clss)).sort(),
            basicNameList = this.choose_basic().map(clss => getClassName(clss)),
            landscapeEffectsNameList = this.choose_landscape_effect().map(clss => getClassName(clss)).sort(),
            nonSupplyNameList = await choose_non_supply(this.basic_cards.concat(this.kingdom_name).concat(this.landscape_effects));
        */
        let [kingdomList, basicList, landscapeEffectsList, nonSupplyList] = await this.generate_materials();
        let kingdomNameList = kingdomList.map(clss => getClassName(clss)).sort(),
            basicNameList = basicList.map(clss => getClassName(clss)),
            landscapeEffectsNameList = landscapeEffectsList.map(clss => getClassName(clss)).sort(),
            nonSupplyNameList = nonSupplyList;
        
        await prepare_game(kingdomNameList, basicNameList, landscapeEffectsNameList, nonSupplyNameList);

    }
    //TODO
    restart_game(){}
    /**
     * Called right before game start, when everyone is in game, 
     * based on GameSetup data from server, transform cards name into real card and prepare for the gameplay.
     * Called by Engine, or Player. Look at main.js
     * @param {{JSON Object}} data dict data from server response, when request POST to /finish_setup
     * @param {{Player}} player the player, represents user
     * @return
     */ 
    async finish_setup(data, player){
        let player_kingdom, player_basic, player_landscape_effect, nonSupply;

        if(data === undefined || typeof data === 'string' || data instanceof String){ //single player mode
            [player_kingdom, player_basic, player_landscape_effect, nonSupply] = await this.generate_materials();
        } else{// multiplayer mode
            console.log(data);
            let basic = JSON.parse(data.basic),
                kingdom = JSON.parse(data.kingdom),
                landscape_effect = JSON.parse(data.landscape_effect);
            nonSupply = JSON.parse(data.nonSupply);

            player_basic = basic.map(c => getClassFromName(c));
            player_kingdom = kingdom.map(c => getClassFromName(c));
            player_landscape_effect = landscape_effect.map(c => getClassFromName(c));
        }
        
        await getBasicSupply().setClassList(player_basic);
        await getBasicSupply().setup(player);
        await getKingdomSupply().setClassList(player_kingdom);
        await getKingdomSupply().setup(player);

        await getTableSide().setLandscapeEffectList(player_landscape_effect);
        await getTableSide().getLandscapeEffectManager().setup();
        await setNonSupplyList(nonSupply);
        await HexBoonManager.setHexBoonPile([...player_kingdom, ...player_landscape_effect]);

        let heirloom_class_list = this.get_replacing_heirloom_class_list(player_kingdom);
        await this.set_starting_deck(player, heirloom_class_list);
        //player.setup();
    }    
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getClassName(clss){
    let name = undefined; 
    try{
        name = clss.name
    } catch{
        console.log('Class name: ', clss);
        alert('GetClassName ERROR');
    }    
    return name;
}
function getClassFromName(class_name){
    if(class_name===undefined || class_name===''){
        return;
    }
    for(let i=0; i<all_cards.length; i++){
        let card_class = all_cards[i];
        if(card_class.name === class_name){
            return card_class;
        }
    }
    console.log('CANT FIND THIS CLASS', class_name);
    alert('CANT FIND THIS CLASS')
    return undefined;
}
function getAllCards(){
    return all_cards.map(c => c);
}



/*
let setup_engine = new SetupEngine();


setTimeout(() => {
    try{
        setup_engine.prepare_game();
    }
    catch(e){
        console.log('Prepare game failed!!');
        console.log('ERROR:', e);
    }
}, 2000);

*/




export {SetupEngine, getClassFromName, getClassName, getAllCards};