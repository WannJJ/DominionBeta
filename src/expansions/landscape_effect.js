import { RootCard } from './cards.js';
import { getPlayer } from '../player.js';
import { getHand, getPlayField } from '../features/PlayerSide/CardHolder/CardHolder.jsx';
import { getLogger } from '../Components/Logger.jsx';
import { findLandscapeEffect } from '../features/TableSide/LandscapeEffect/LandscapeEffect.jsx';

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

        this.html_setup_main = document.getElementById('setup-main');
    }
    setup(){}
    is_buyed(){}
    play(){}
    add_score(){}
    setup(){}
    should_activate(reason, card){return true;}
    activate(){}
    getVictoryToken(){
        return this.victory_token;
    }
    async setVictoryToken(value){
        this.victory_token = value;
        let landscapeComponent = findLandscapeEffect(component => component.getName() == this.name);
        await landscapeComponent.setVictoryToken(value);
    }
    getDebtToken(){
        return this.debt_token;
    }
    async setDebtToken(value){
        this.debt_token = value;
        let landscapeComponent = findLandscapeEffect(component => component.getName() == this.name);
        await landscapeComponent.setDebtToken(value);
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
        if(mockObj == undefined || mockObj.name == undefined || mockObj.name != this.name){
            console.log(`cards.js, Name: ${this.name}`, mockObj);
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
        //TODO: let card play their text below dividing lines
    }
    should_activate_way(reason, card){
        return (card == undefined && getPlayer().phase == 'action' && getHand().has_card(c => c.type.includes('Action')))
                || (card!= undefined && card.type.includes('Action'));
    }
    activate_way(reason, card){
        if(card == undefined){
            if(getHand().length() <= 0) return;
            return new Promise((resolve) =>{
                let is_marked = getHand().mark_cards(
                    function(c){return c.type.includes('Action')},
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
            });
            
        } else{

        }
    }
}
class Project extends LandscapeEffect{
    constructor(name, cost, additional_link, player){
        super(name, cost, ['Project'], additional_link, player);
    }
    is_buyed(){}
}


export {Event, Landmark, Trait, Way, Project};
