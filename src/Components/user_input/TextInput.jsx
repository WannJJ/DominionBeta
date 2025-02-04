import React from "react";
import '../Components.css';
import { getAllCards, getClassName } from "../../setup";

let all_card_names = getAllCards().map(c => getClassName(c));
//let all_card_names = getAllCards().map(cl => new cl()).map(c => c.name);
let textInput = null;

class TextInput extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            visible: false,
            onSubmitFunction: null,
        }
        textInput = this;
    }
    create_name_input(submit_function){
        this.setState(prevState => ({
            visible: true,
            onSubmitFunction: submit_function
        }));
    }
    async onSubmit(e){
        //TODO
        e.preventDefault(); 
        if(this.state.onSubmitFunction != null){
            let input_value = document.querySelector('#input-field').value;
            if(!all_card_names.includes(input_value)){
                alert('Name not exists: '+ input_value);
                return;
            }
            await this.state.onSubmitFunction(input_value);
            this.hide();
        }
    }
    hide(){
        this.setState(prevState =>({
            visible: false,
            onSubmitFunction: null,
        }));
    }
    render(){
        if(this.state.visible){
            let allCardComponentList = all_card_names.map((name, index) => <option value={name} key={index}></option>)
            return <form id="text-form" draggable="true" onSubmit={this.onSubmit.bind(this)}>
                    <label>Name a Card</label>
                    <input id="input-field" type="text" list="datalist" />
                    <datalist id="datalist">
                        {allCardComponentList}
                    </datalist>
                </form>;
        } else{
            return (null);
        }
    }
}

function getTextInput(){
    return textInput;
}
function create_name_input(callback){
    getTextInput().create_name_input(callback);
}

export {TextInput, getTextInput, create_name_input};