import React from "react";
import styles from './Logger.module.css';
import { getPlayer } from "../player";
import { showCard } from "./display_helper/CardDisplay";
import { ACTIVITY_PLAY_AS_WAY } from "../utils/constants";
import { Activity } from "../game_logic/report_save_activity";

let logger = null;
const tab = "&emsp;";


class Logger extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            contentList: [],
        }
        this.id = 'chat-container'
        this.indent_count = 0;
        logger = this;
    }
    deindent(){
        this.indent_count -= 1;
        if(this.indent_count <= 0){
            this.indent_count = 0;
        } 
    }
    indent_(){
        this.indent_count += 1;
    }
    clear_indent(){
        this.indent_count = 0;
    }
    writeMessage(mess){
        let indent_count = this.indent_count;
        this.setState(prevState => ({
            contentList: [...prevState.contentList, {message: mess, indent_count: indent_count, activity:null}],
        }));
    }
    writeActivity(activity, additional_message=''){
        let indent_count = this.indent_count;
        this.setState(prevState => ({
            contentList: [...prevState.contentList, {message: '', indent_count: indent_count, activity:activity, additional_message:additional_message}],
        }));
    }

    render(){
        let childList = this.state.contentList.map(
            function(messObj, index){
                let activity = messObj.activity;
                if(activity  && activity.name === ACTIVITY_PLAY_AS_WAY){
                    return <WayMessage key={index}   
                                activity={activity}
                                indent_count={messObj.indent_count}   
                            />
                }
                return <Message key={index} 
                    message={messObj.message} 
                    activity={messObj.activity}
                    additional_message={messObj.additional_message}
                    indent_count={messObj.indent_count}/>
            }
        );
        return <div id={this.id} className={styles.chat_container}>
            {childList}
        </div>
    }
    componentDidUpdate(){
        let element = document.getElementById(this.id);
        if(element.scrollTop + element.clientHeight < element.scrollHeight){
            element.scrollTop = element.scrollHeight - element.clientHeight;
        }
    }
    createMockObject(){
        const mockContentList = this.state.contentList.map(messObj =>{
            return {
                message: messObj.message,
                indent_count: messObj.indent_count,
                additional_message: messObj.additional_message,
                activity: messObj.activity?messObj.activity.createMockObject():null,
            }
        });
        return {
            id: this.id,
            contentList: mockContentList,//this.state.contentList,
            indent_count: this.indent_count,
        }
    }
    parseDataFromMockObject(mockObj){
        if(!mockObj || mockObj.id !== this.id) throw new Error("Invalid Logger");
        const contentList = mockObj.contentList.map(messObj =>{
            return {
                message: messObj.message,
                indent_count: messObj.indent_count,
                additional_message: messObj.additional_message,
                activity: messObj.activity?Activity.generateCardFromMockObject(messObj.activity): null,
            }
        });
        this.setState(prevState =>({
            contentList: contentList,
            indent_count: mockObj.indent_count,
        }));
    }
}
class Message extends React.Component{
    render(){
        /*
        let indentation = ''.padStart(this.props.indent_count * tab.length, tab);
        indentation = '&emsp;';
        */
        let indentList = [];
        for(let i=0; i<this.props.indent_count; i++){
            indentList.push(<span key={i}>&emsp;</span>);
        }
        if(this.props.activity==null){
            return <div>
                {indentList}
                {this.props.message}
            </div>;
        } else{
            let activity = this.props.activity;
            return <div>
                {indentList}

                <span className={styles.userInfo}>
                {(activity.username===getPlayer().username)?'':(activity.username.toUpperCase() + ' ')}
                </span>

                {activity.name + ' '} 
                {
                    activity.card && 
                    <span className={`${styles.cardInfo} ${getCSSClassNameFromCard(activity.card)}`}
                        onContextMenu={(e)=>{e.preventDefault();showCard(activity.card)}}>
                        {activity.card.name}
                    </span>
                }
                {
                    activity.cardList.length > 0 && 
                    <> 
                        {activity.cardList.map((c, index) =><span key={index} >
                                {index>0?', ':''}
                                <span className={`${styles.cardInfo} ${getCSSClassNameFromCard(c)}`}
                                    onContextMenu={(e)=>{e.preventDefault();showCard(c)}} >
                                    {c.name}
                                </span>
                            </span>)}
                    </>
                }
                { this.props.additional_message &&
                    ` ${this.props.additional_message }`
                }
            </div>;
        }
    }
}

class WayMessage extends React.Component{
    render(){
        let indentList = [];
        for(let i=0; i<this.props.indent_count; i++){
            indentList.push(<span key={i}>&emsp;</span>);
        }
        let activity = this.props.activity;

        return <div>
            {indentList}
            <span className={styles.userInfo}>
                {(activity.username===getPlayer().username)?'':(activity.username.toUpperCase() + ' ')}
            </span>
            Play 
            <> </>
            {
                activity.cardList.length > 0 &&
                <>
                    {activity.cardList.map((c, index) =><span>
                                                        {index>0?', ':''}   
                                                        <span className={`${styles.cardInfo} ${getCSSClassNameFromCard(c)}`}
                                                            key={index} 
                                                            onContextMenu={(e)=>{e.preventDefault();showCard(c)}} >
                                                            {c.name}
                                                        </span>
                                                        </span>)}
                </>
            } 
            <> </>
            as
            <> </>
            {
                activity.card && 
                <span className={`${styles.cardInfo} ${getCSSClassNameFromCard(activity.card)}`}
                    onContextMenu={(e)=>{e.preventDefault();showCard(activity.card)}}>
                    {activity.card.name}
                </span>
            }
        </div>;
        
    }

}


function getCSSClassNameFromCard(card){
    if(!card || !card.src || !card.name) return '';
    let className = styles.action_card;
    if(card.type.includes('Action')){
        className = styles.action_card;
    } else if(card.type.includes('Treasure') || card.type.includes('Boon')){
        className = styles.treasure_card;
    } else if(card.type.includes('Victory') || card.type.includes('Landmark')){
        className = styles.victory_card;
    } else if(card.type.includes('Curse') || card.type.includes("Hex") || card.type.includes('Trait')){
        className = styles.curse_card;
    } else if(card.type.includes('Night')){
        className = styles.night_card;
    }
    return className
}
function getLogger(){
    return logger;
}
function deindent(){
    logger.deindent();
}
function indent_(){
    logger.indent_();
}
function clear_indent(){
    logger.clear_indent();
}
function writeNewPhase(message){
    if(!logger) return;
    clear_indent();
    indent_();
    logger.writeMessage(message);
    indent_();
}

export {Logger, getLogger, deindent, indent_, clear_indent, writeNewPhase};