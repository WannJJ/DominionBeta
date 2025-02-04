

//let landscapeEffectManager = null;

const landscapeEffectManager = {
    effectComponentList : [],
    setup: async function(){
        for(let landscapeComponent of this.effectComponentList){
            let card = landscapeComponent.getCard();

            //TODO: buoc nay lam tao lao, bi trung lap, nhung chua biet xu ly the nao cho dung
            card.component = landscapeComponent;

            await card.setup();
        }
    },
    addComponent: function(landscapeCard){
        if(!landscapeCard) return;

        if(this.effectComponentList.find(card => card.getName()===landscapeCard.getName())) return;
        this.effectComponentList.push(landscapeCard);
    },
    has_card: function(crit_func){
        if(this.effectComponentList.length <= 0){return false;}
        for(let i=0; i<this.effectComponentList.length; i++){
            let card = this.effectComponentList[i];
            if(crit_func(card)){return true;}
        }
        return false;
    },
    find_card(crit_func){
        for(let i=0; i<this.effectComponentList.length; i++){
            let card = this.effectComponentList[i];
            if(crit_func(card)){return card;}
        }
        return undefined;
    },
    getEffectComponentListAll(){
        return this.effectComponentList;
    },
    mark_cards: function(crit_func, func){
        let card_found = false;
        for(let i=0; i<this.effectComponentList.length; i++){
            let effectComponent = this.effectComponentList[i];
            if(crit_func(effectComponent)){
                effectComponent.markSelf(card => func(card));
                card_found = true;
            }
        }
        return card_found;
    },
    remove_mark: function(){
        for(let i=0; i<this.effectComponentList.length; i++){
            let effect_card = this.effectComponentList[i];
            effect_card.removeSelfMark();
        }
    },
    createMockObject(){
        let landscapeList = [];
        for(let landscapeCard of this.effectComponentList){
            landscapeList.push(landscapeCard.createMockObject());
        }
        return {effectComponentList: landscapeList};
    },
    isValidMockObject: function(mockObj){
        if(!mockObj|| !mockObj.effectComponentList|| !Array.isArray(mockObj.effectComponentList)){
            throw new Error('INVALID Mock Object LandscapeEffectManager');
        }
    },
    parseDataFromMockObject: async function(mockObj){
        this.isValidMockObject(mockObj);
        for(let mockCard of mockObj.effectComponentList){
            let effectComponent = this.find_card(c => c.getName() === mockCard.name);
            if(effectComponent){
                await effectComponent.parseDataFromMockObject(mockCard);
            } else{
                throw new Error('ERROR landscape card not found');
            }
        }
    },
    parseDataFromMockObjectGeneral: async function(mockObj){
        this.isValidMockObject(mockObj);
        for(let mockCard of mockObj.effectComponentList){
            let effectComponent = this.find_card(c => c.getName() === mockCard.name);
            if(effectComponent){
                await effectComponent.parseDataFromMockObjectGeneral(mockCard);
            } else{
                throw new Error('ERROR landscape card not found');
            }
        }
    },
    parseDataFromMockObjectOwn: async function(mockObj){
        this.isValidMockObject(mockObj);
        for(let mockCard of mockObj.effectComponentList){
            let effectComponent = this.find_card(c => c.getName() === mockCard.name);
            if(effectComponent){
                await effectComponent.parseDataFromMockObjectOwn(mockCard);
            } else{
                throw new Error('ERROR landscape card not found');
            }
        }
    },
}



export{ landscapeEffectManager};