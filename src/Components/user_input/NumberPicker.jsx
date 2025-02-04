import React from "react";

let numberPicker = null;
class NumberPicker extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            minValue: 0,
            maxValue: 5,
            quantity: 0,
            onSubmitFunction: null,
        }
        numberPicker = this;
    }
    create_number_picker(min=0, max=1, callback){
        if(min > max) return;
        this.setState(prevState =>({
            minValue: min,
            maxValue: max, 
            quantity: max,
            onSubmitFunction: callback,
        }))
    }
    onSubmit(e){
        e.preventDefault();
        if(this.state.onSubmitFunction == null) return;


        this.state.onSubmitFunction(this.state.quantity);
        this.hide();
    }
    setValue(value){
        let quantity = this.state.quantity;
        if(value > this.state.maxValue){
            quantity = this.state.maxValue;    
          } else if(value < this.state.minValue){
            quantity = this.state.maxValue;
          } else {
            quantity = value;
          }
          this.setState(prevState =>({
            quantity: quantity,
          }))
    }
    increment(){
        this.setState(prevState => ({
            quantity: Math.min(prevState.quantity + 1, prevState.maxValue),
        }));
    }
    decrement(){
        this.setState(prevState => ({
            quantity: Math.max(prevState.quantity - 1, prevState.minValue),
        }));

    }
    hide(){
        this.setState(prevState =>({

            onSubmitFunction: null,
        }));
    }
    render(){
        if(this.state.onSubmitFunction==null){
            return (null);
        } 
        return <form id="number-picker-form" onSubmit={this.onSubmit.bind(this)}>
          <div>
            <button
              id="increase-button"
              type="button"
              onClick={this.increment.bind(this)}
            ></button>
          </div>
          <div className="input-container">
            <input
              type="number"
              id="quantity"
              name="quantity"
              min={this.state.minValue}
              max={this.state.maxValue}
              step="1"
              value={this.state.quantity}
              onChange={e => this.setValue(e.target.value)}
            />
          </div>
          <div>
            <button
              id="decrease-button"
              type="button"
              onClick={this.decrement.bind(this)}
            ></button>
          </div>
          <button type="submit" form="number-picker-form" >OK</button>
        </form>
    }
}

function getNumberPicker(){
    return numberPicker;
}
function create_number_picker(min=0, max=1, callback){
    getNumberPicker().create_number_picker(min, max, callback);
}
function hide_number_picker(){
  getNumberPicker().hide();
}

export {NumberPicker, create_number_picker, hide_number_picker};