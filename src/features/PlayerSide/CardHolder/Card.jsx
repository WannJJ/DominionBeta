import React from 'react';
import { showCard, hideCardDisplay } from '../../../Components/display_helper/CardDisplay';
class Card extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isSelected: false,
        }
    }
    static getDerivedStateFromProps(props, state) {
        if(props.filterFunc == null || props.onClickFunc == null){
            return {isSelected: false };
        }
        return state;
      }
    async clickFunction(){//TODO: Nếu card isSelected
        if(!this.props.filterFunc(this.props.card)) return;
        const isSelected = this.state.isSelected;
        if(isSelected && !this.props.canUnclick) return;

        this.setState(prevState =>({
            isSelected: !prevState.isSelected,
        }));
        
        if(isSelected){
            this.props.cancelSelection(this.props.card);
        } else{
            this.props.makeSelection(this.props.card);
        }
        await this.props.onClickFunc(this.props.card);
    }

    render(){
        let canSelect = false,
            onClickFunction = null;
        if(this.props.filterFunc != null && this.props.onClickFunc != null && this.props.selectType!=''){ 
            if(this.props.filterFunc(this.props.card) || this.state.isSelected){
                canSelect = true;
                onClickFunction = this.clickFunction.bind(this);
            }
        } else{

        }
        let selectType = canSelect?this.props.selectType:'',
            selectedClass = this.state.isSelected?'is-selected':'';
        

        return <div 
                className={'card '+selectType+' '+selectedClass} 
                style={{backgroundImage: `url(${this.props.card.src})`}}
                onClick={onClickFunction}
                onContextMenu={(e) => {e.preventDefault();showCard(this.props.card);}}
            >
        </div>
    }
}

export {Card};