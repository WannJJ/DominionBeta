import React from "react";
import { showCard } from "../../../Components/display_helper/CardDisplay";

let componentList = [];

class LandscapeEffect extends React.Component{
    constructor(props){
        super(props);
        this.effectCard = this.props.effectCard;
        this.effectCard.component = this;
        this.state = {
            canSelect: false,
            onClick: null,
            victory_token: 0,
            debt_token: 0,
            sun_token: 0,
        } 
        addLandscapeEffect(this);
    }
    getCard(){
        return this.props.effectCard;
    }
    getName(){
        return this.props.effectCard.name;
    }
    getID(){
        return this.props.effectCard.id;
    }
    getCost(){
        return this.props.effectCard.cost;
    }
    getType(){
        return this.props.effectCard.type;
    }
    setVictoryToken(value){
        return new Promise(resolve =>{
            this.setState(
                prevState => ({
                    victory_token: value,
                }),
                resolve
            );
        })
        
    }
    getVictoryToken(){
        return this.state.victory_token;
    }
    setDebtToken(value){
        return new Promise((resolve) =>{
            this.setState(
                prevState => ({
                    debt_token: value,
                }),
                resolve
            );
        })   
    }
    getDebtToken(){
        return this.state.debt_token;
    }
    setSunToken(value){
        return new Promise(resolve =>{
            this.setState(
                prevState => ({
                    sun_token: value>0?value:0,
                }),
                resolve
            );
        })
    }
    async removeSunToken(value){
        await this.setSunToken(this.state.sun_token - value);
    }
    getSunToken(){
        return this.state.sun_token;
    }
    markSelf(callback){
        this.setState(prevState =>({
            canSelect: true,
            onClick: callback,
        }))
    } 
    removeSelfMark(){
        this.setState(prevState =>({
            canSelect: false,
            onClick: null,
        }))
    }
    async onClickFunction(){
        if(this.state.onClick == null) return;
        await this.state.onClick(this.props.effectCard);
    }
    render(){
        let canSelectClassName = this.state.canSelect?' canSelect':'';
        let landscapeCard = this.props.effectCard;
        
        return <div 
                className={'event'+canSelectClassName} 
                style={{backgroundImage: `url(${landscapeCard.src})`}}
                onClick={this.onClickFunction.bind(this)}
                onContextMenu={(e)=>{e.preventDefault(); showCard(landscapeCard)}}
            >
                {this.state.victory_token > 0 
                        && <div className='victory-token'>{this.state.victory_token}</div>}
                {this.state.debt_token > 0 
                        && <div className='debt-token'>{this.state.debt_token}</div>}
                {landscapeCard.chosen_pile_name 
                    && <div>{landscapeCard.chosen_pile_name}</div>
                }
                {this.state.sun_token > 0 
                        && <div className='sun-token'>{this.state.sun_token}</div>}

            </div>

    }
    createMockObject(){
        return {
            name: this.getName(),
            effectCard: this.props.effectCard.createMockObject(),
            victory_token: this.state.victory_token,
            debt_token:this.state.debt_token,
            sun_token: this.state.sun_token,
        };
    }
    parseDataFromMockObject(mockObj){
    }
    parseDataFromMockObjectGeneral(mockObj){ 
        if(!mockObj|| !mockObj.name|| mockObj.name !== this.getName() 
            || !mockObj.effectCard || mockObj.victory_token == undefined 
            || mockObj.debt_token == undefined || mockObj.sun_token == undefined
        ){
            console.error(mockObj);
            throw new Error('INVALID Mock Landscape Effect');
        }
        this.props.effectCard.parseDataFromMockObjectGeneral(mockObj.effectCard);
        return new Promise((resolve)=>{
            this.setState(prevState =>({
                victory_token: mockObj.victory_token,
                debt_token: mockObj.debt_token,
                sun_token: mockObj.sun_token,
            }), 
            resolve);
        });
    }
    parseDataFromMockObjectOwn(mockObj){
        if(!mockObj || !mockObj.name || mockObj.name !== this.getName()
            || !mockObj.effectCard || mockObj.victory_token == undefined 
            || mockObj.debt_token == undefined || mockObj.sun_token == undefined
        ){
            throw new Error('INVALID Mock Landscape Effect');
        }
        this.props.effectCard.parseDataFromMockObjectOwn(mockObj.effectCard);
        return new Promise((resolve)=>{
            this.setState(prevState =>({
                victory_token: mockObj.victory_token,
                debt_token: mockObj.debt_token,
                sun_token: mockObj.sun_token,
            }), 
            resolve);
        });
    }
    
}

function addLandscapeEffect(card){
    componentList.push(card);
}

function findLandscapeEffect(callback){
    return componentList.find(callback);
}
function findLandscapeEffectAll(callback){
    let array = [];
    for(let card of componentList){
        if(callback(card)){
            array.push(card);
        }
    }
    return array;
}


export{LandscapeEffect, findLandscapeEffect, findLandscapeEffectAll};