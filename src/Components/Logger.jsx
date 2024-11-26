import React from "react";
import { getPlayer } from "../player";
import { showCard, hideCardDisplay } from "./display_helper/CardDisplay";

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
    write(mess){
        
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
    generate_card_text_element(card){
        if(card == undefined || card.src==undefined || card.name == undefined) return '';
        let cardClass = 'action-card';
        if(card.type.includes('Action')){
            cardClass = 'action-card';
        } else if(card.type.includes('Treasure')){
            cardClass = 'treasure-card';
        } else if(card.type.includes('Victory')){
            cardClass = 'victory-card';
        }
        return `<span class="${cardClass} card" style="background-image: ${card.src};">${card.name}</span>`;
    }
    
    render(){
        let childList = this.state.contentList.map((messObj, index) => 
            <Message key={index} 
                    message={messObj.message} 
                    activity={messObj.activity}
                    additional_message={messObj.additional_message}
                    indent_count={messObj.indent_count}/>);
        return <div id={this.id}>
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
        return {
            contentList: [],//this.state.contentList,
            indent_count: this.indent_count,
        }
    }
    parseDataFromMockObject(mockObj){
        this.setState(prevState =>({
            contentList: mockObj.contentList,
            indent_count: mockObj.indent_count,
        }));
    }
}
class Message extends React.Component{
    render(){
        let indentation = ''.padStart(this.props.indent_count * tab.length, tab);
        indentation = '&emsp;';
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
                {(activity.username==getPlayer().username)?'':(activity.username + ' ')}
                {activity.name + ' '} 
                {
                    activity.card && 
                    <span className={getCSSClassNameFromCard(activity.card)}
                        onContextMenu={(e)=>{e.preventDefault();showCard(activity.card)}}>
                        {activity.card.name}
                    </span>
                }
                {
                    activity.card_list.length > 0 && 
                    <> 
                        {activity.card_list.map((c, index) => <span className={getCSSClassNameFromCard(c)}
                                                                    key={index} 
                                                                    onContextMenu={(e)=>{e.preventDefault();showCard(c)}} >
                                                                    {index>0?', ':''}
                                                                    {c.name}
                                                                </span>)}
                    </>
                }
                { ' ' + this.props.additional_message }
            </div>;
        }
    }
}

function getCSSClassNameFromCard(card){
    if(card == undefined || card.src==undefined || card.name == undefined) return '';
    let className = 'action-card';
    if(card.type.includes('Action')){
        className = 'action-card';
    } else if(card.type.includes('Treasure')){
        className = 'treasure-card';
    } else if(card.type.includes('Victory')){
        className = 'victory-card';
    }
    return className
}
function getLogger(){
    return logger;
}
export {Logger, getLogger};