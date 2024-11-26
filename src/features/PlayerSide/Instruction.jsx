import React from "react";
let instruction = null;

class Instruction extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            message: '',
        }
        instruction = this;
    }
    setMessage(mess){
        this.setState(prevState => ({
            message: mess,
        }));
    }
    render(){
        return <div id="instruction">
            {this.state.message}
        </div>
    }
}
function getInstruction(){
    return instruction;
}
function setInstruction(ins=''){
    getInstruction().setMessage(ins);
}
export {Instruction, setInstruction};