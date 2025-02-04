import React from 'react';
import './TableSide.css';
import { BasicSupply, KingdomSupply } from './Supply.jsx';
import {NonSupplyPile} from './NonSupplyPile.jsx';
import { NocturneEffectPile } from './NocturneEffect/NocturneEffectPile.jsx';
import { LandscapeEffect } from './LandscapeEffect/LandscapeEffect.jsx';
import { landscapeEffectManager } from './LandscapeEffect/LandscapeEffectManager.js';

let table = null;

class TableSide extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            kingdom_class_list : [],
            basic_class_list : [],
            landscape_effects_class_list : [],
            nonSupplyList: [],
            hexBoonPileList: [],
        }
        this.landscapeEffectComponentList  = [];
        this.nonSupplyPileList = [];

        table = this;
    }
    setNonSupplyList(nonSupplyList){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                nonSupplyList: nonSupplyList,
            }), resolve);
        });
        
    }
    addNonSupplyPile(nonSupplyPileObj){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                nonSupplyList: [...this.state.nonSupplyList, nonSupplyPileObj],
            }), resolve);
        });
    }
    setHexBoonPileList(hexBoonPileList){
        return new Promise((resolve) =>{
            this.setState(prevstate =>({
                hexBoonPileList: hexBoonPileList,
            }), resolve);
        });
    }
    setLandscapeEffectList(landscape_effects_class_list){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                landscape_effects_class_list: landscape_effects_class_list.map(cardClass => new cardClass()),
            }), ()=>{resolve();});
        });
    }
    render(){ 
        let landscape_effects_list  = this.state.landscape_effects_class_list.map(
            (effectCard, index) => <LandscapeEffect effectCard={effectCard} 
                                                    key={index} 
                                                    ref={(element)=>{this.landscapeEffectComponentList.push(element);
                                                                    landscapeEffectManager.addComponent(element)}}/>
            );
        let nonSupplyList = this.state.nonSupplyList.map(
            (nonSupply, index) => <NonSupplyPile cardClass={nonSupply.cardClass}
                                                quantity={nonSupply.quantity}
                                                cardList={nonSupply.cardList?nonSupply.cardList:[]}
                                                name={nonSupply.name?nonSupply.name:''}
                                                key={index}
                                                ref={(element)=>{this.nonSupplyPileList.push(element)}}/>
        );
        let hexBoonComponentList = this.state.hexBoonPileList.map(
            (pileController, index) => <NocturneEffectPile name={pileController.getName()}
                                                            quantity={pileController.getQuantity()} 
                                                            key={index}
                                                            ref={element => pileController.registerEffectComponent(element)}/>
        )

        return <div id='table-side'>
            <BasicSupply 
                class_list={ []}
            />
            <div id='setup-main'>
                
                <KingdomSupply 
                    class_list={ []}
                />
            
                {landscape_effects_list}
                {nonSupplyList}
                {hexBoonComponentList}

            </div>
        </div>
    }
    componentDidMount(){ 
        return;
        /*
        this.setNonSupplyList([{
            cardClass: null,
            quantity: 20,
            cardList: [new Copper(), new Gold()],
            name: 'haha',
        }]);
        */
    }
}




function getTableSide(){
    return table;
}

export {TableSide, getTableSide};