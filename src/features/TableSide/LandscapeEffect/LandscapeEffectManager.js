

let landscapeEffectManager = null;
class LandscapeEffectManager{
    constructor(){
        this.effect_list = [];
        landscapeEffectManager = this;
    }
    async setup(){
        for(let landscapeComponent of this.effect_list){
            let card = landscapeComponent.getCard();

            //TODO: buoc nay lam tao lao, bi trung lap, nhung chua biet xu ly the nao cho dung
            card.component = landscapeComponent;

            await card.setup();
        }
    }
    addCard(landscapeCard){
        if(landscapeCard == null) return;

        if(this.effect_list.find(card => card.getName()==landscapeCard.getName())) return;
        this.effect_list.push(landscapeCard);
    }
    has_card(crit_func){
        if(this.effect_list.length <= 0){return false;}
        for(let i=0; i<this.effect_list.length; i++){
            let card = this.effect_list[i];
            if(crit_func(card)){return true;}
        }
        return false;
    }
    find_card(crit_func){
        for(let i=0; i<this.effect_list.length; i++){
            let card = this.effect_list[i];
            if(crit_func(card)){return card;}
        }
        return undefined;
    }
    mark_cards(crit_func, func){
        let card_found = false;
        for(let i=0; i<this.effect_list.length; i++){
            let effect_card = this.effect_list[i];
            if(crit_func(effect_card)){
                effect_card.markSelf(card => func(card));
                card_found = true;
            }
            
        }
        return card_found;
    }
    remove_mark(){
        for(let i=0; i<this.effect_list.length; i++){
            let effect_card = this.effect_list[i];
            effect_card.removeSelfMark();
        }
    }
    createMockObject(){
        let landscape_list = [];
        for(let landscapeCard of this.effect_list){
            landscape_list.push(landscapeCard.createMockObject());
        }
        return {effect_list: landscape_list};
    }
    isValidMockObject(mockObj){
        if(mockObj == undefined || mockObj.effect_list == undefined || !Array.isArray(mockObj.effect_list)){
            throw new Error('INVALID Mock Object LandscapeEffectManager');
        }
    }
    async parseDataFromMockObject(mockObj){
        this.isValidMockObject(mockObj);
        for(let mockCard of mockObj.effect_list){
            let effect_card = this.find_card(c => c.getName() == mockCard.name);
            if(effect_card != undefined){
                await effect_card.parseDataFromMockObject(mockCard);
            } else{
                throw new Error('ERROR landscape card not found');
            }
        }
    }
    async parseDataFromMockObjectGeneral(mockObj){
        this.isValidMockObject(mockObj);
        for(let mockCard of mockObj.effect_list){
            let effect_card = this.find_card(c => c.getName() == mockCard.name);
            if(effect_card != undefined){
                await effect_card.parseDataFromMockObjectGeneral(mockCard);
            } else{
                throw new Error('ERROR landscape card not found');
            }
        }
    }
    async parseDataFromMockObjectOwn(mockObj){
        this.isValidMockObject(mockObj);
        for(let mockCard of mockObj.effect_list){
            let effect_card = this.find_card(c => c.getName() == mockCard.name);
            if(effect_card != undefined){
                await effect_card.parseDataFromMockObjectOwn(mockCard);
            } else{
                throw new Error('ERROR landscape card not found');
            }
        }
    }
}

function getLandscapeEffectManager(){
    return landscapeEffectManager;
}

export{ LandscapeEffectManager, getLandscapeEffectManager};