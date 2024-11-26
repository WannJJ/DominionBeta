import { Horse, Supplies, Sleigh, Scrap, Cavalry, Groom, Hostelry, Livery, Paddock,} from "../expansions/menagerie/menagerie";
import { Ride, Bargain, Demand, Stampede } from "../expansions/menagerie/menagerie_event";
import { Amphora, Doubloons, EndlessChalice, Figurehead, Hammer, Insignia,
    Jewels, Orb, PrizeGoat, PuzzleBox, Sextant, Shield, SpellScroll,
    Staff, Sword } from "../expansions/plunder/plunder_loot";
import { JewelledEgg, Search, Pickaxe, WealthyVillage, Cutthroat, SackofLoot } from "../expansions/plunder/plunder";
import { Bat, Vampire, Wish, Leprechaun, SecretCave, 
    Ghost, Exorcist, Cemetery, Imp, DevilsWorkshop, Tormentor, 
    Will_o_Wisp, Druid, Pixie, Tracker, Fool, Bard, BlessedVillage, Idol, SacredGrove, } from "../expansions/nocturne/nocturne";

import { getTableSide } from "../features/TableSide/TableSide";
import { HauntedMirror, MagicLamp } from "../expansions/nocturne/nocturne_heirloom";



async function choose_non_supply(playCardList){
    let name_list = [];

    let gain_horse_cards = [Sleigh, Supplies, Scrap, Cavalry, Groom, Hostelry, Livery, Paddock,
                        Ride, Bargain, Demand, Stampede];
    if(gain_horse_cards.find(card => playCardList.includes(card))) {
        name_list.push('Horse');
    }

    let gain_loot_cards = [JewelledEgg, Search, Pickaxe, WealthyVillage, Cutthroat, SackofLoot];
            //gain_loot_events = [Peril, Foray, Looting, Invasion, Prosper];
    if(gain_loot_cards.find(card => playCardList.includes(card))){
        name_list.push('Loot');
    }   

    if(playCardList.includes(Vampire)){
        name_list.push('Bat');
    }

    let gain_wish_cards = [MagicLamp, Leprechaun, SecretCave];
    if(gain_wish_cards.find(card => playCardList.includes(card))) {
        name_list.push('Wish');
    }

    let gain_ghost_cards = [HauntedMirror, Cemetery, Exorcist];
    if(gain_ghost_cards.find(card => playCardList.includes(card))) {
        name_list.push('Ghost');
    }

    let gain_imp_cards = [DevilsWorkshop, Tormentor, Exorcist];
    if(gain_imp_cards.find(card => playCardList.includes(card))) {
        name_list.push('Imp');
    }

    let gain_wow_cards = [Exorcist, Druid, Pixie, Tracker, Fool, Bard, BlessedVillage, Idol, SacredGrove,];
    if(gain_wow_cards.find(card => playCardList.includes(card))) {
        name_list.push('Will_o_Wisp');
    }


    //await setNonSupplyList(name_list);
    return name_list;
    /*
        let name_list = [];
        let gain_wish = [Leprechaun, SecretCave];
        if(gain_wish.find(c => this.kingdom_name.includes(c))) name_list.push('Wish');        
        let gain_wowisp = [Exorcist];
        if(gain_wowisp.find(c => this.kingdom_name.includes(c))) name_list.push('Will_o_Wisp');
        let gain_imp = [DevilsWorkshop, Tormentor, Exorcist];
        if(gain_imp.find(c => this.kingdom_name.includes(c))) name_list.push('Imp');
        let gain_ghost = [Exorcist, Cemetery];
        if(gain_ghost.find(c => this.kingdom_name.includes(c))) name_list.push('Ghost');
        let gain_hex = [CursedVillage, Leprechaun, Skulk, Tormentor, Vampire, Werewolf];
        if(gain_hex.find(c => this.kingdom_name.includes(c))) name_list.push('Hex');
        let gain_boon = [Bard, BlessedVillage, Druid, Fool, Idol, Pixie, SacredGrove, Tracker];
        if(gain_boon.find(c => this.kingdom_name.includes(c))) name_list.push('Boon');

        return name_list;
        */
}
async function setNonSupplyList(name_list){
    let nonSupplyList = [];

    if(name_list.includes('Horse')){
        nonSupplyList.push({
            cardClass: Horse,
            quantity: new Horse().getInitAmount(),
            cardList: [],
            name: '',
        });
    }

    if(name_list.includes('Loot')){
        let lootClass = [Amphora, Doubloons, EndlessChalice, Figurehead, Hammer, Insignia,
            Jewels, Orb, PrizeGoat, PuzzleBox, Sextant, Shield, SpellScroll,
            Staff, Sword, 
            Amphora, Doubloons, EndlessChalice, Figurehead, Hammer, Insignia,
            Jewels, Orb, PrizeGoat, PuzzleBox, Sextant, Shield, SpellScroll,
            Staff, Sword];
        let lootList = lootClass.map(clss => new clss());
        shuffleArray(lootList);

        nonSupplyList.push({
            cardList: lootList,
            name: 'Loot',
        });
    }

    if(name_list.includes('Bat')){
        nonSupplyList.push({
            cardClass: Bat,
            quantity: new Bat().getInitAmount(),
            cardList: [],
            name: '',
        });
    }

    if(name_list.includes('Wish')){
        nonSupplyList.push({
            cardClass: Wish,
            quantity: new Wish().getInitAmount(),
            cardList: [],
            name: '',
        });
    }

    if(name_list.includes('Ghost')){
        nonSupplyList.push({
            cardClass: Ghost,
            quantity: new Ghost().getInitAmount(),
            cardList: [],
            name: '',
        });
    }

    if(name_list.includes('Imp')){
        nonSupplyList.push({
            cardClass: Imp,
            quantity: new Imp().getInitAmount(),
            cardList: [],
            name: '',
        });
    }

    if(name_list.includes('Will_o_Wisp')){
        nonSupplyList.push({
            cardClass: Will_o_Wisp,
            quantity: new Will_o_Wisp().getInitAmount(),
            cardList: [],
            name: '',
        });
    }

    await getTableSide().setNonSupplyList(nonSupplyList);
    

}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
export {choose_non_supply, setNonSupplyList};