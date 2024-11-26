import React from 'react';
import { getGameState } from '../game_logic/GameState';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import AlarmIcon from '@mui/icons-material/Alarm';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CollectionsIcon from '@mui/icons-material/Collections';
import PersonAddIcon from '@mui/icons-material/PersonAdd';




class SettingButton extends React.Component{
    render(){
        return (
            <div id='setting-buttons'>
                <ButtonGroup variant="contained" aria-label="Basic button group" >
                    <Tooltip title='UNDO' arrow>
                        <IconButton onClick={()=>getGameState().undo()}>
                            <FastRewindIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='HAHA' arrow>
                        <IconButton >
                            <CheckIcon />
                        </IconButton>
                    </Tooltip>
                    
                    <IconButton >
                        <CloseIcon />
                    </IconButton>
                    <IconButton >
                        <CollectionsIcon />
                    </IconButton>
                    <IconButton color='primary'>
                        <PersonAddIcon />
                    </IconButton>
                    
                    
                </ButtonGroup>
            </div>
          );
    }
  }
  export {SettingButton};