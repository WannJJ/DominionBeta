

const TYPE_STATE  = 'State';

const NocturneStateHolder = {
    ownStateList: [],
    availableStateList: [],
    getOwnStateList: function(){
        return this.ownStateList;
    },
    getAvailableStateList: function(){
        return this.availableStateList;
    },
    addState: function(state){
        if(state === undefined || state.type !== TYPE_STATE) return;
        
    }

}