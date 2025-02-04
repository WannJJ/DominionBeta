import { Card, RootCard } from './cards.js';
import { getPlayer } from '../player.js';
import { getHand, getPlayField } from '../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getLogger } from '../Components/Logger.jsx';
import { findLandscapeEffect } from '../features/TableSide/LandscapeEffect/LandscapeEffect.jsx';
import { PHASE_ACTION } from '../utils/constants.js';
import { getDeck } from '../features/PlayerSide/CardPile/CardPile.jsx';
import { mayPlayCardFromHand, playCardAsWay } from '../game_logic/Activity.js';
import { setInstruction } from '../features/PlayerSide/Instruction.jsx';
import { getSupportHand } from '../features/SupportHand.jsx';

class LandscapeEffect extends RootCard{
    static Type = {
        EVENT: 'Event',
        LANDMARK: 'Landmark',
        TRAIT: 'Trait',
        PROJECT: 'Project',
        WAY: 'Way',  
    }
    constructor(name,cost, type, additional_link, player){
        super(name,cost, type, additional_link, player); 

        this.victory_token = 0;
        this.debt_token = 0;
        this.chosen_pile_name = ''; // Use for Obelisk
    }
    setup(){}
    is_buyed(){}
    play(){}
    add_score(){}
    should_activate(reason, card){return true;}
    activate(){}
    getVictoryToken(){
        return this.victory_token;
    }
    async setVictoryToken(value){
        this.victory_token = value;
        let landscapeComponent = findLandscapeEffect(component => component.getName() === this.name);
        await landscapeComponent.setVictoryToken(value);
    }
    getDebtToken(){
        return this.debt_token;
    }
    async setDebtToken(value){
        this.debt_token = value;
        let landscapeComponent = findLandscapeEffect(component => component.getName() === this.name);
        await landscapeComponent.setDebtToken(value);
    }
    getChosenPileName(){
        return this.chosen_pile_name;
    }
    createMockObject(){
        let mockObj = super.createMockObject();
        mockObj.vctrtkn = this.victory_token;
        mockObj.dbttkn = this.debt_token;
        mockObj.chsnplnm = this.chosen_pile_name;
        return mockObj;
    }
    parseDataFromMockObject(mockObj){
        super.parseDataFromMockObject(mockObj);
        this.victory_token = mockObj.vctrtkn;
        this.debt_token = mockObj.dbttkn ;
        this.chosen_pile_name = mockObj.chsnplnm;
    }
    parseDataFromMockObjectGeneral(mockObj){ 
        if(!mockObj || !mockObj.name || mockObj.name !== this.name){
            console.error(`cards.js, Name: ${this.name}`, mockObj);
            throw new Error('INVALID Mock Landscape Effect');
        }
        this.victory_token = mockObj.vctrtkn;
        this.debt_token = mockObj.dbttkn;
        this.chosen_pile_name = mockObj.chsnplnm;
    }
    parseDataFromMockObjectOwn(mockObj){
        super.parseDataFromMockObject(mockObj);
        this.victory_token = mockObj.vctrtkn;
        this.debt_token = mockObj.dbttkn;
        this.chosen_pile_name = mockObj.chsnplnm;
    }
}

class Event extends LandscapeEffect{
    constructor(name, cost, additional_link, player){
        super(name, cost, ['Event'], additional_link, player);
        this.activate_currently = false;
    }
    is_buyed(){}
}
// Landmark is only in Empires expansion
class Landmark extends LandscapeEffect{
    constructor(name, additional_link, player){
        super(name, -1, ['Landmark'], additional_link, player);
    }    
    add_score(){}
    should_activate(){return true;}
}
class Trait extends LandscapeEffect{
    constructor(name, additional_link, player){
        super(name, -1, ['Trait'], additional_link, player);
    }
    is_buyed(){}
}
class Way extends LandscapeEffect{
    constructor(name, additional_link, player){
        super(name, -1, ['Way'], additional_link, player);
    }
    play(card){
        //TODO: let card play their text below dividing lines (Highway, Peasant)
    }
    should_activate_way(){
        return getHand().has_card(c => c.type.includes(Card.Type.ACTION))
            || getDeck().has_card(card => card.type.includes(Card.Type.ACTION) || card.type.includes(Card.Type.SHADOW));
    }
    activate_way(){
        if(getHand().length() <= 0) return;
        return new Promise((resolve) =>{
            let clearFunc = function(){
                getHand().remove_mark();
                getSupportHand().clear();
                getSupportHand().hide();
                getDeck().removeCanSelect();
                setInstruction('');
            }
            setInstruction(`${this.name}: Choose an Action card to play as Way.`)
            let mayPlayAction = mayPlayCardFromHand(
                function(c){
                    return c.type.includes(Card.Type.ACTION);
                },
                async function(c){
                    clearFunc();

                    await getPlayField().addCard(c);
                    await playCardAsWay(this, c);

                    /*
                    getLogger().writeMessage(`Play ${c.name} as ${this.name}`);
                    await this.play(c);
                    */
                   
                    resolve('Way finish');
                }.bind(this),

            );

            /*
            let is_marked = getHand().mark_cards(
                function(c){return c.type.includes(Card.Type.ACTION)},
                async function(c){
                    getHand().remove_mark();
                    await getHand().remove(c);
                    await getPlayField().addCard(c);
                    getLogger().writeMessage(`Play ${c.name} as ${this.name}`);
                    await this.play(c);
                    resolve('Way finish');
                }.bind(this),
                'discard',
            );
            if(!is_marked){
                resolve();
            }
                */
        });
            
        
    }
}
class Project extends LandscapeEffect{
    constructor(name, cost, additional_link, player){
        super(name, cost, ['Project'], additional_link, player);
    }
    is_buyed(){}
}


export {Event, Landmark, Trait, Way, Project};
