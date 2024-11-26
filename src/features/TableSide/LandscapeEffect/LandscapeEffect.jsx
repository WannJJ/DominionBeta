import React from "react";
import { showCard } from "../../../Components/display_helper/CardDisplay";

let cardList = [];

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
        return <div 
                className={'event'+canSelectClassName} 
                style={{backgroundImage: `url(${this.props.effectCard.src})`}}
                onClick={this.onClickFunction.bind(this)}
                onContextMenu={(e)=>{e.preventDefault(); showCard(this.props.effectCard)}}
            >
                {this.state.victory_token > 0 
                        && <div className='victory-token'>{this.state.victory_token}</div>}
                {this.state.debt_token > 0 
                        && <div className='debt-token'>{this.state.debt_token}</div>}
            </div>

    }
    createMockObject(){
        return {
            name: this.getName(),
            effectCard: this.props.effectCard.createMockObject(),
            victory_token: this.state.victory_token,
            debt_token:this.state.debt_token,
        };
    }
    parseDataFromMockObject(mockObj){
    }
    parseDataFromMockObjectGeneral(mockObj){ 
        if(mockObj == undefined || mockObj.name == undefined || mockObj.name != this.getName() 
            || mockObj.effectCard == undefined || mockObj.victory_token == undefined || mockObj.debt_token == undefined){
            throw new Error('INVALID Mock Landscape Effect');
        }
        this.props.effectCard.parseDataFromMockObjectGeneral(mockObj.effectCard);
        return new Promise((resolve)=>{
            this.setState(prevState =>({
                victory_token: mockObj.victory_token,
                debt_token: mockObj.debt_token,
            }), 
            resolve);
        });
    }
    parseDataFromMockObjectOwn(mockObj){
        if(mockObj == undefined || mockObj.name == undefined || mockObj.name != this.getName()
            || mockObj.effectCard == undefined || mockObj.victory_token == undefined || mockObj.debt_token == undefined){
            throw new Error('INVALID Mock Landscape Effect');
        }
        this.props.effectCard.parseDataFromMockObjectOwn(mockObj.effectCard);
        return new Promise((resolve)=>{
            this.setState(prevState =>({
                victory_token: mockObj.victory_token,
                debt_token: mockObj.debt_token,
            }), 
            resolve);
        });
    }
    
}

function addLandscapeEffect(card){
    cardList.push(card);
}
function getLandscapeEffectAll(){
    return cardList;
}
function findLandscapeEffect(callback){
    return cardList.find(callback);
}
function findLandscapeEffectAll(callback){
    let array = [];
    for(let card of cardList){
        if(callback(card)){
            array.push(card);
        }
    }
    return array;
}
function markLandscapeEffectAll(crit_func, func){
    
}

export{LandscapeEffect, findLandscapeEffect, findLandscapeEffectAll};