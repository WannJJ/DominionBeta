import React from "react";
import Button from '@mui/material/Button';

let buttonPanel = null;
class ButtonPanel extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            buttonList: [],
        };
        buttonPanel = this;
    }
    render(){
        let childList = this.state.buttonList.map((buttonObj,index) => 
            <Button 
                key={index}
                sx={{pointerEvents: 'auto'}}
                variant="contained" 
                onClick={buttonObj.callback}>
                    {buttonObj.message}
            </Button>
            /*<button className='button' onClick={buttonObj.callback} key={index}>
                {buttonObj.message}
            </button>
            */
        );
        return <div id='buttons-pannel'>
            {childList}
        </div>
    }
    clear_buttons(){
        this.setState(prevState => ({
            buttonList: [],
        }))
    }
    add_button(message, callback){
        let buttonObject = {
            message: message,
            callback: callback,
        }
        this.setState(prevState => ({
            buttonList: [...prevState.buttonList, buttonObject],
        }));
    }
    
}
function getButtonPanel(){
    return buttonPanel;
}
export {ButtonPanel, getButtonPanel};