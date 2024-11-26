import React from 'react';
import {SupplyPile} from './SupplyPile.jsx';

let basicSupply = null,
    kingdomSupply = null;


class Supply extends React.Component{
    constructor(props, id=''){
        super(props);
        this.id = id;
        this.state = {
            class_list: [],
            filterFunc: null,
            onClickFunc: null,
        };
        this.pile_list = [];
    }
    setClassList(class_list){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                    class_list: class_list,
                }),
                resolve,
            );
        });
    }
    async setup(player){
        for(let pile of this.pile_list){
            await pile.setup(player);
        }
    }
    onContextMenuFunction(){
    }
    arrange(class_list){
        return class_list;
    }
    render(){
        this.pile_list = [];
        let card_list = this.arrange(this.state.class_list);
        let pile_list = card_list.map(
            (c, index) => <SupplyPile
                            cardClass={c}
                            key={index}
                            filterFunc={this.state.filterFunc}
                            onClickFunc={this.state.onClickFunc}
                            ref={(e)=>{if(e!==null)this.pile_list.push(e)}}
                            />
        );
        return <div id={this.id} className='card-container'
                    onContextMenu={this.onContextMenuFunction.bind(this)}>
            {pile_list}
        </div>
    }
    find_pile(crit_func){
        for(let i=0; i<this.pile_list.length; i++){
            let pile = this.pile_list[i];
            if(pile !== null && crit_func(pile)){return pile;}
        }
        return undefined;
    }
    mark_piles(filterFunc, onClickFunc){
        this.setState({
            filterFunc: filterFunc,
            onClickFunc: onClickFunc,
        })
    }
    remove_mark(){
        this.setState({
            filterFunc: null,
            onClickFunc: null,
        })
    }
    createMockObject(){
        let pile_list = [];
        for (let pile of this.pile_list){
            pile_list.push(pile.createMockObject());
        }

        return {pile_list: pile_list};
    }
    async parseDataFromMockObject(mockObj){
        if(mockObj === undefined || !Array.isArray(mockObj.pile_list)){
            throw new Error('INVALID Supply object');
        }
        for(let mockPile of mockObj.pile_list){
            let pile = this.find_pile(p => p.getName() === mockPile.name);
            if(pile === undefined) {
                throw new Error('ERROR CANT FIND PILE');
            }
            await pile.parseDataFromMockObject(mockPile);
        }
    }
}
class BasicSupply extends Supply{
    constructor(props){
        super(props, 'basic-supply');
        basicSupply = this;
    }
    arrange(class_list){
        return class_list.sort((clss1, clss2) => new clss2().cost.coin - new clss1().cost.coin);
    }
    
}

class KingdomSupply extends Supply{
    constructor(props){
        super(props, 'kingdom-supply');
        kingdomSupply = this;
    }
    onContextMenuFunction(){
        return;
        /*
        this.mark_piles(
            function(pile){
                return pile.getName() == "Witch" || pile.getName() == 'Moat';
            },
            function(pile){
                pile.popNextCard();
                this.remove_mark();
            }.bind(this)
        );
        */
    }

    arrange(class_list){
        return class_list.sort((clss1, clss2) => new clss1().cost.coin - new clss2().cost.coin);
    }
}


function getBasicSupply(){
    return basicSupply;
}
function getKingdomSupply(){
    return kingdomSupply;
}
function findSupplyPile(callback){
    let pile = getBasicSupply().find_pile(callback);
    if(pile !== undefined) return pile;
    return getKingdomSupply().find_pile(callback);
}
function markSupplyPile(filterFunc, onClickFunc){
    if(findSupplyPile(filterFunc) === undefined) return false;
    getBasicSupply().mark_piles(filterFunc, onClickFunc);
    getKingdomSupply().mark_piles(filterFunc, onClickFunc);
    return true;
}
function removeMarkSupplyPile(){
    getBasicSupply().remove_mark();
    getKingdomSupply().remove_mark();
}

export {BasicSupply, KingdomSupply, 
        getBasicSupply, getKingdomSupply, findSupplyPile,
        markSupplyPile, removeMarkSupplyPile};