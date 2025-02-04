import React, {useState} from 'react';
import { getGameState } from '../game_logic/GameState';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CollectionsIcon from '@mui/icons-material/Collections';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

import audioManager from '../Audio/audioManager';

const MUTE_DEFAULT = true;
audioManager.setMute(MUTE_DEFAULT);

function SettingButton(){
    const [mute, setMute] = useState(MUTE_DEFAULT);

    let toggleMute = function(){
        audioManager.setMute(!mute);
        setMute(!mute); 
    };

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
                
                <Tooltip title={mute?'UNMUTE':'MUTE'} arrow>
                    <IconButton onClick={toggleMute}>
                        {mute ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </IconButton>
                </Tooltip>
                
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

/*
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
                    
                    <Tooltip title='mute' arrow>
                        <IconButton >
                            <VolumeUpIcon />
                        </IconButton>
                    </Tooltip>
                    
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
    */
  export {SettingButton};