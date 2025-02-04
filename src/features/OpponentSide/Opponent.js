import { generateCardFromMockObject } from '../../game_logic/GameState.js';
import { getOpponentSide, getOpponentComponentList } from './OpponentSide.jsx';



const opponentManager = {
    opponentList: [],
    leftPlayer: null,
    rightPlayer: null,
    addOpponent: function(newOp){
        if(!(newOp instanceof Opponent)) throw new Error('');
        if(this.findOpponent(newOp.username)) return;
        this.opponentList.push(newOp);
    },
    getOpponentList: function(){
        return this.opponentList;
    },
    findOpponent: function(name){
        return this.opponentList.find(op => op.username === name);
    },
    getLeftPlayer: function(){
        return this.leftPlayer;
    },
    setLeftPlayer: function(opponent){
        this.rightPlayer = opponent;
        this.leftPlayer = opponent;
    },
    getRightPlayer: function(){
        return this.rightPlayer;
    },
    setRightPlayer: function(opponent){
        this.rightPlayer = opponent;
    },
    execute_report: async function(username, report){
        let opponent = this.findOpponent(username);
        if(opponent){
            await opponent.execute_report(report);
        }
    }
}

class Opponent{
    constructor(username, ordinal_number){
        this.username = username;
        this.ordinal_number = ordinal_number;
        this.turn = 0;
        this.move = 0;
        this.action = 0;
        this.buy = 0;
        this.coin = 0;
        this.score = 0;
        this.victory_token = 0;
        this.debt = 0;
        this.coffer = 0;

        this.hand = [];
        this.playField = [];
        this.deck = [];
        this.discard = [];
        this.trash = [];
        this.playArea = [];
        this.exile = [];
        this.all_cards = [];

        this.cards_played_this_turn = [];
        this.cards_gained_this_turn = [];
        this.cards_buyed_this_turn = [];
        this.cards_trashed_this_turn = []; // Use for Goatherd
        this.activities_this_turn = [];

        this.onAnotherGain = false; //TODO, check file report_save_activity.js

        getOpponentSide().addOpponent(username);    
    }
    async execute_report(report){
        if (!report|| report==='') return;
        try{
            report = JSON.parse(report);
        } catch(err){
            console.error('INALID REPORT:', report);
            throw new Error('INVALID REPORT');
        }
        if(report.username === this.username){
            this.turn = report.turn;

            this.hand = report.hand.cards;
            this.playField = report.playField.cards;
            this.deck = report.deck.cards;
            this.discard = report.discard.cards; 
            this.score = report.basicStats.score;
            this.victory_token = report.basicStats.victory_token;
            this.exile = report.exile.cards;
            this.playArea = report.playArea.cards;

            this.all_cards = report.all_cards.map(card => generateCardFromMockObject(card));

            this.cards_played_this_turn = report.cards_played_this_turn;
            this.cards_gained_this_turn = report.cards_gained_this_turn;
            this.cards_buyed_this_turn = report.cards_buyed_this_turn;
            this.cards_trashed_this_turn = report.cards_trashed_this_turn;
            this.activities_this_turn = report.activities_this_turn;
            /*
            this.onAttack = report.reactionEffectManager.onAttack;
            this.onAnotherGain = report.reactionEffectManager.onAnotherGain;
            */
        }

        let component = getOpponentComponentList().find(cmp => cmp.getName() === this.username);
        await component.updateStatus({
            discard: this.discard, 
            deck: this.deck,
            hand: this.hand,
            score: this.score + this.victory_token,
        });
    }
}


export {Opponent, opponentManager};