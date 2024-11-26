

class RootCard{
    static id = 0;
    constructor(name='', cost=new Cost(), type=[], expansion='', player=null){
        this.name = name;
        this.cost = cost;
        this.type = type;
        this.src = "./img/" + expansion + name+ ".JPG";
        this.player = player;
        this.id = RootCard.id++;
        /*
        this.name = '';
        this.cost = null;
        this.type = [];
        this.src = null;
        this.player = null;
        */

        this.turn = -1;
        this.is_selected = false;

        //Game phase to be activated
        this.not_discard_in_cleanup = false;
        this.activate_when_shuffle = false;
        this.activate_when_start_turn = false;
        this.activate_when_start_buy_phase = false;
        this.activate_when_end_buy_phase = false;
        this.activate_when_start_cleanup = false;
        this.activate_when_end_turn = false;
        this.activate_when_end_game = false;

        //Player or another player's activity to be activated
        this.activate_when_another_attacks = false;
        this.activate_when_another_gains = false;

        this.activate_when_play = false;
        this.activate_when_gain = false;
        this.activate_when_discard = false;
        this.activate_when_trash = false;

        //Condition to be activated
        this.activate_when_in_hand = false;
        this.activate_when_in_play = false;
        //this.activate_when_being_set_aside = false;
        this.activate_permanently = false;
        this.activate_currently = false;
        this.activate_this_turn = false;
        this.activate_next_turn = false;

        this.chosen_id = null; // PuzzleBox
        this.chosen_id_list = [];    // Prepare, Deliver
    }
    setup(){}
    getInitAmount(){}
    setPlayer(player){
        this.player = player;
    }
    play(){}
    is_buyed(){}
    do_reaction(){}
    add_score(){}

    should_activate(reason, card){ return true;}
    activate(reason, card){}

    createMockObject(ignoreActivateCondition=false){
        let mockObj =  {
            id : this.id,
            type: this.type,
            name : this.name,
            //cost = this.cost,
            turn : this.turn,
            issel : this.is_selected,
            
            /*
            not_discard_in_cleanup : this.not_discard_in_cleanup,
            activate_when_shuffle : this.activate_when_shuffle,
            activate_when_start_turn : this.activate_when_start_turn,
            activate_when_start_buy_phase : this.activate_when_start_buy_phase,
            activate_when_end_buy_phase : this.activate_when_end_buy_phase,
            activate_when_start_cleanup : this.activate_when_start_cleanup,
            activate_when_end_turn : this.activate_when_end_turn,
            activate_when_end_game : this.activate_when_end_game,
            */
            ...(!ignoreActivateCondition && {
                ndic : this.not_discard_in_cleanup,
                awsh : this.activate_when_shuffle,
                awss : this.activate_when_start_turn,
                awsbp : this.activate_when_start_buy_phase,
                awebp : this.activate_when_end_buy_phase,
                awscu : this.activate_when_start_cleanup,
                awet : this.activate_when_end_turn,
                aweg : this.activate_when_end_game,

                awaa : this.activate_when_another_attacks,
                awag : this.activate_when_another_gains,

                awplay : this.activate_when_play,
                awgain : this.activate_when_gain,
                awdiscard : this.activate_when_discard,
                awtrash : this.activate_when_trash,
                
                awih : this.activate_when_in_hand,
                awip : this.activate_when_in_play,
                awbsa : this.activate_when_being_set_aside, //Notice: remove
                aperm : this.activate_permanently,
                acurr : this.activate_currently,
                atist : this.activate_this_turn,
                anet : this.activate_next_turn,
            }),

            chsnid : this.chosen_id,
            chsnidlst : this.chosen_id_list,
        }
        return mockObj;
    }

    parseDataFromMockObject(mockObj, ignoreActivateCondition=false){
        if(mockObj == undefined || mockObj.name == undefined || mockObj.name != this.name){
            console.log(`cards.js, Name: ${this.name}`, mockObj);
            alert('INVALID Mock Root Card');
            return;
        }
        this.id = mockObj.id;
        //name = mockObj.name;
        //cost = mockObj.cost;
        this.turn = mockObj.turn;
        this.is_selected = mockObj.issel;

        if(!ignoreActivateCondition){
            this.not_discard_in_cleanup = mockObj.ndic;
        this.activate_when_shuffle = mockObj.awsh;
        this.activate_when_start_turn = mockObj.awss;
        this.activate_when_start_buy_phase = mockObj.awsbp;
        this.activate_when_end_buy_phase = mockObj.awebp;
        this.activate_when_start_cleanup = mockObj.awscu;
        this.activate_when_end_turn = mockObj.awet;
        this.activate_when_end_game = mockObj.aweg;

        this.activate_when_another_attacks = mockObj.awaa;
        this.activate_when_another_gains = mockObj.awag;

        this.activate_when_play = mockObj.awplay;
        this.activate_when_gain = mockObj.awgain;
        this.activate_when_discard = mockObj.awdiscard;
        this.activate_when_trash = mockObj.awtrash;
        
        this.activate_when_in_hand = mockObj.awih;
        this.activate_when_in_play = mockObj.awip;
        this.activate_when_being_set_aside = mockObj.awbsa;
        this.activate_permanently = mockObj.aperm;
        this.activate_currently = mockObj.acurr;
        this.activate_this_turn = mockObj.atist;
        this.activate_next_turn = mockObj.anet;
        }

        this.chosen_id = mockObj.chsnid;
        this.chosen_id_list = mockObj.chsnidlst;
    }
}

class Card extends RootCard{ //potrait card
    static Type = {
        ACTION: 'Action',
        VICTORY : 'Victory',
        TREASURE: 'Treasure',
        ATTACK: 'Attack',
        DURATION: 'Duration',
        REACTION: 'Reaction',
        CURSE: 'Curse',
        COMMAND: 'Command',
        NIGHT: "Night",
        LOOT: "Loot",
        SPIRIT: "Spirit",
        DOOM: 'Doom',
        FATE: 'Fate',
        SHELTER: 'Shelter',
        HEIRLOOM: "Heirloom",
        ZOMBIE: "Zombie",
        SHADOW: 'Shadow',
        OMEN: "Omen",
        
    }
    constructor(name,cost, type, expansion, player){
        let type1 = (type!=undefined)?type.split(" "):[];
        super(name,cost, type1, expansion, player);
        

        //TODO: face up when set aside  // Use for Prepare

    }
    getInitAmount(){
        return 10;
    }
    play(){}
    do_action(){}
    do_passive(){}
    do_reaction(){}
    async add_score(){}
    is_gained(){}
    is_buyed(){}
    attack(){}
    do_duration(){
        this.set_aside = false;
    }

    is_drawn(){}
    is_in_play(){}
    is_attacked(){}
    is_discarded(){}    
    is_trashed(){}
    is_revealed(){}
    is_start_turn(){}
    is_end_action_phase(){}
    is_end_buy_phase(){}

    should_activate(reason, card){ return true;}
    activate(reason, card){}
    async setup(){}
    
}
class Cost{
    constructor(coin=0, debt=0, potion=0){
        this.coin = 0;
        this.debt = 0;
        this.potion = 0;
        if(coin==undefined){
            throw new Error('INVALID COST');
        }
        if(arguments.length>=1 && coin!=undefined && typeof coin=='number'){
            this.coin = coin;
        } 
        if(arguments.length>=2 && debt!=undefined && typeof debt=='number'){
            this.debt = debt;
        }
        if(arguments.length>=3 && potion!=undefined && typeof potion=='number'){
            this.potion = potion;
        }
    }
    static checkValidCost(cost){
        if(cost == undefined || cost.coin == undefined || cost.debt == undefined || cost.potion == undefined) {
            console.log('cost:', cost);
            throw new Error('INVALID COST');
            alert('INVALID COST');
            return false;
        }
        return true;
    }
    getCoin(){
        return this.coin;
    }
    getDebt(){
        return this.debt;
    }
    getPotion(){
        return this.potion;
    }
    addCost(cost){
        Cost.checkValidCost(cost);
        this.coin += cost.coin;
        this.debt += cost.debt;
        this.potion += cost.potion;
    }
    sufficientToBuy(cost){
        Cost.checkValidCost(cost);
        return this.coin >= cost.coin  && this.potion >= cost.potion;
    }
    isGreaterThan(cost){
        Cost.checkValidCost(cost);
        return this.coin >= cost.coin && this.debt >= cost.debt && this.potion >= cost.potion
                && (this.coin > cost.coin || this.debt > cost.debt || this.potion > cost.potion);
    }   
    isGreaterOrEqual(cost){
        Cost.checkValidCost(cost);
        return this.coin >= cost.coin && this.debt >= cost.debt && this.potion >= cost.potion;
    }
    isEqual(cost){
        Cost.checkValidCost(cost);
        return this.coin == cost.coin && this.debt == cost.debt && this.potion == cost.potion;
    }
}

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateString(length) {
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export {RootCard, Card, Cost};