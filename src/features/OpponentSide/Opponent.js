import { Card } from '../../expansions/cards.js';
import { getOpponentSide, getOpponentComponentList } from './OpponentSide.jsx';
import { getClassFromName } from '../../setup.js';


const opponentManager = {
    opponentList: [],
    addOpponent: function(newOp){
        this.opponentList.push(newOp);
    },
    getOpponentList: function(){
        return this.opponentList;
    },
    findOpponent: function(name){
        return this.opponentList.find(op => op.username == name);
    },
    execute_report: async function(username, report){
        let opponent = this.findOpponent(username);
        if(opponent != undefined){
            await opponent.execute_report(report);
        }
    }
}

class Opponent{
    constructor(username, ordinal_number){ console.log('New Opponent:', username)
        this.username = username;
        this.turn_number = ordinal_number;
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
        this.exile = [];
        this.all_cards = [];

        this.cards_played_this_turn = [];
        this.cards_gained_this_turn = [];
        this.cards_buyed_this_turn = [];
        this.activities_this_turn = [];

        this.onAnotherGain = false; //TODO, check file report_save_activity.js

        getOpponentSide().addOpponent(username);    
    }
    async execute_report(report){
        if (report==undefined || report=='') return;
        try{
            report = JSON.parse(report);
        } catch(err){
            alert('INVALID REPORT');
            console.log('INALID REPORT:', report);
            return;
        }
        if(report.username == this.username){
            this.hand = report.hand.cards;
            this.playField = report.playField.cards;
            this.deck = report.deck.cards;
            this.discard = report.discard.cards; 
            this.score = report.basicStats.score;
            this.victory_token = report.basicStats.victory_token;
            this.exile = report.exile.cards;
            this.playArea = report.playArea.cards;

            /*
            this.onAttack = report.reactionEffectManager.onAttack;
            this.onAnotherGain = report.reactionEffectManager.onAnotherGain;
            */
        }

        let component = getOpponentComponentList().find(cmp => cmp.getName() == this.username);
        await component.updateStatus({
            discard: this.discard, 
            deck: this.deck,
            hand: this.hand,
            score: this.score + this.victory_token,
        });
    }
}

export {Opponent, opponentManager};