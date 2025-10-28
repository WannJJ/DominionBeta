import React from 'react';
import './PlayerSide.css';
import { Instruction } from './Instruction.jsx';
import { ButtonPanel } from './ButtonPanel.jsx';
import {Discard, Deck, Trash} from './CardPile/CardPile.jsx';
import { PlayField, Hand} from './CardHolder/CardHolder.jsx';
import { BottomLeftCorner } from './BottomLeftCorner/BottomLeftCorner.jsx';
import { TextInput } from '../../Components/user_input/TextInput.jsx';
import { NumberPicker } from '../../Components/user_input/NumberPicker.jsx';

import Tooltip from '@mui/material/Tooltip';
import { Activity } from '../../game_logic/report_save_activity.js';


let basicStats = null;
class PlayerSide extends React.Component{
    render(){
        return <div id="player-side">
            <BasicStats />  
            
            <PlayField />
            <Instruction />
            <ButtonPanel />

            <TextInput />
            <NumberPicker />
            
            <Discard />
            <Deck />
            <Hand />
            <Trash />

            <BottomLeftCorner />
        </div>
    }
}

class BasicStats extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            action: 0,
            buy: 0,
            coin: 0,
            score: 0,
            debt: 0,
            coffer: 0,
            victory_token: 0,
            sun_token: 0,
            stateList: '',
        }
        this.ignoreAddActionsThisTurn = false; // Use for SnowyVillage
        this.addCoinThisTurnIdList = [];
        basicStats = this;
    }
    getAction(){
        return this.state.action;
    }
    setAction(value){
        if(this.ignoreAddActionsThisTurn && value > this.state.value) return;
        return new Promise((resolve) =>{
                this.setState(prevState =>({
                    action: value,
                }),
                resolve,
            );
        });
    }
    addAction(value){
        if(this.ignoreAddActionsThisTurn) return;

        let newValue = value + this.state.action;
        if(newValue < 0) newValue = 0;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                action: newValue,
            }),
            resolve,
        );
    });
    }
    getBuy(){
        return this.state.buy;
    }
    setBuy(value){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                buy: value,
            }),
            resolve,
        );
    });
    }
    addBuy(value){
        let newValue = value + this.state.buy;
        if(newValue < 0) newValue = 0;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                buy: newValue,
            }),
            resolve,
        );
    });
    }
    getCoin(){
        return this.state.coin;
    }
    setCoin(value){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                coin: value,
            }),
            resolve,
        );
    });
    }
    addCoin(value){
        let currentActivity = Activity.current;
        if(currentActivity && value > 0){
            if(currentActivity.card) {
                this.addCoinThisTurnIdList.push(currentActivity.card.id);
            }

        }
        let newValue = value + this.state.coin;
        if(newValue < 0) newValue = 0;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                coin: newValue,
            }),
            resolve,
        );
    });
    }
    getScore(){
        return this.state.score;
    }
    setScore(value){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                score: value,
            }),
            () =>{resolve()},
        );
    });
    }
    addScore(value){
        let newValue = value + this.state.score;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                score: newValue,
            }),
            () =>{resolve()},
        );
    });
    }
    getDebt(){
        return this.state.debt;
    }
    setDebt(value){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                debt: value,
            }),
            resolve,
        );
        });
    }
    addDebt(value){
        let newValue = value + this.state.debt;
        if(newValue < 0) newValue = 0;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                debt: newValue,
            }),
            resolve,
        );
    });
    }
    getCoffer(){
        return this.state.coffer;
    }
    setCoffer(value){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                coffer: value,
            }),
            resolve,
        );
    });
    }
    addCoffer(value){
        let newValue = value + this.state.coffer;
        if(newValue < 0) newValue = 0;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                coffer: newValue,
            }),
            resolve,
        );
    });
    }
    getVictoryToken(){
        return this.state.victory_token;
    }
    setVictoryToken(value){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                victory_token: value,
            }),
            resolve,);
        });
    }
    addVictoryToken(value){
        let newValue = value + this.state.victory_token;
        if(newValue < 0) newValue = 0;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                victory_token: newValue,
            }),
            resolve,
        );
    });
    }    
    getSunToken(){
        return this.state.sun_token;
    }
    setSunToken(value){
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                sun_token: value,
            }),
            resolve,);
        });
    }
    addSunToken(value){
        let newValue = value + this.state.sun_token;
        if(newValue < 0) newValue = 0;
        return new Promise((resolve) =>{
            this.setState(prevState =>({
                sun_token: newValue,
            }),
            resolve,);
        });
    }
    setNewTurn(){
        this.addCoinThisTurnIdList = [];
    }
    setStateList(stateList){
        const result = stateList.map(state => state.name).join(', ');
        this.setState({
            stateList: result,
        })
    }
    render(){
        return <div>
            <div id='action-buy-coin'>
                <Tooltip title='ACTION' placement="top-end">
                    <div style={{backgroundImage: 'url(./img/Basic/settings-icon.png)'}}>
                        {this.state.action}
                    </div>  
                </Tooltip>
                <Tooltip title='BUY' placement="top-end">
                    <div style={{backgroundColor: 'aqua'}}>
                        {this.state.buy}
                    </div>
                </Tooltip>
                <Tooltip title='COIN' placement="top-end">
                    <div style={{backgroundImage: 'url(./img/Basic/Coin.png)'}}>
                        {this.state.coin}
                    </div>
                </Tooltip>
                
            </div>
            
            <Tooltip title={this.state.stateList} placement="bottom-end">
                <div id='score-coffer-debt'>
                    <Tooltip title='SCORE' placement="top-end">
                        <div className={`${this.state.score}`.length>=3?"three-digit":""} 
                            style={{backgroundImage: 'url(./img/Basic/VP1.png)'}}>
                                {this.state.score}
                        </div>
                    </Tooltip>
                    {this.state.victory_token > 0 && 
                        <Tooltip title='VICTORY TOKEN' placement="top-end">
                            <div style={{backgroundImage: 'url(./img/Basic/VP-Token.png)'}}>{this.state.victory_token}</div>
                        </Tooltip>   
                    }
                    {
                        this.state.debt > 0 && 
                        <Tooltip title='DEBT' placement="top-end">
                            <div style={{backgroundImage: 'url(./img/Basic/Debt.png)'}}>{this.state.debt}</div>
                        </Tooltip>
                        
                    }
                    {
                        this.state.coffer > 0 &&
                        <Tooltip title='COFFER' placement="top-end">
                            <div style={{backgroundImage: 'url(./img/Basic/Coffer.png)'}}>{this.state.coffer}</div>
                        </Tooltip>
                        
                    }
                    {
                        this.state.sun_token > 0 &&
                        <Tooltip title='SUN' placement="top-end">
                            <div style={{backgroundImage: 'url(./img/Basic/Sun.png)'}}>{this.state.sun_token}</div>
                        </Tooltip>
                        
                    }
                    
                </div>
            </Tooltip>
        </div>
    }
    createMockObject(){
        return {...this.state,
            acttil: this.addCoinThisTurnIdList,
            iaatt: this.ignoreAddActionsThisTurn,
        };
    }
    parseDataFromMockObject(mockObj){
        this.addCoinThisTurnIdList = mockObj.acttil;
        this.ignoreAddActionsThisTurn = mockObj.iaatt;
        return new Promise(resolve =>{
            this.setState(prevState =>(mockObj), resolve);
        });
    }

}

function getBasicStats(){
    return basicStats;
}
export {PlayerSide, getBasicStats};