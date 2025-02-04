import { useEffect, useState } from "react";
import styles from './LobbyPage.module.css';
import LogoutIcon from '@mui/icons-material/Logout';
import IconButton from '@mui/material/IconButton';
import { Tooltip } from "@mui/material";

import { PlayerProfile } from "../../game_logic/PlayerProfile";
import { ROLE_GUEST, ROLE_HOST } from "../../utils/constants";
import { LobbyController } from "../../api/LobbyAPI";
import PregameEngine from "../../pregame/PregameEngine";

let isSetupSent = false;

function LobbyPage(){
    const [count, setCount] = useState(1);
    const [playerList, setPlayerList] = useState('');


    const {startGame,
        setupGame,
        restartGame,
        logoutGame,
        createLobbyWebSocket, closeLobbyWebSocket,
        setPlayerListFunction,
        }  = LobbyController();

    let username = PlayerProfile.getUsername(),
        player = {
            role: PlayerProfile.getRole(),
        },
        message = '';
    let game_code =  PlayerProfile.getGameCode();

    let sendSetupMaterialToServer = async function(){
        let materials = PregameEngine.generate_materials();
        await setupGame(...materials); 
    }

    let handleStart = async function(e){
        e.preventDefault();

        if(!isSetupSent){
            await sendSetupMaterialToServer(); 
        }
        startGame();
    }

    let handleSetup = async function(e){
        e.preventDefault();

        await sendSetupMaterialToServer(); 
        isSetupSent = true;
    }

    let handleLogout = function(e){
        e.preventDefault();
        logoutGame();
    }

    

    useEffect(() => {
        setPlayerListFunction(setPlayerList);
        createLobbyWebSocket();
        return () =>{
            closeLobbyWebSocket();
        }
    }, [])


    const playerListComponent = playerList.split(',').map(
        (name, index) => <li key={index} 
                            className={styles.list_item}>
                                <span>{index + 1}</span>
                                {name}
                        </li>
    );

    return (
        <div className={styles.lobby_layout}>
            <div className={styles.header}>
                    <div><h1>LOBBY</h1>  </div>
                    <div>Welcome {username}</div>
                    <div>({player.role})</div>    
            </div>

            <form action="" method="POST" className={styles.game_form}>
                <div className={styles.container}>
                    <label id="name-role"> </label>
                    <label htmlFor="count">Count</label>
                    {
                        player.role === ROLE_HOST &&
                        <> 
                        <input id="count" type="number" name="count" 
                            min="0" max="5" 
                            placeholder="player" value={count} 
                            onChange={e => setCount(e.target.value)} />    
                            <div>
                                <button id="start" type='button' onClick={handleStart}>Start</button>
                            </div> 
                            <div>
                                <button id="setup-game" type="button" onClick={handleSetup}>SETUP</button>   
                            </div> 
                            <div>
                                <button id="restart-game" type="button">RESTART</button>   
                            </div>         
                        
                        </>
                    }
                    {
                        player.role === ROLE_GUEST &&
                        <div>{playerList.split(',').length}</div>
                    }
                    
                    

                    <div>{message}</div>                    
                </div>

            </form>

            <div className={styles.players_list}>
                <h2>ROOM {game_code}</h2>
                <ul className={styles.list}>
                    {playerListComponent}
                </ul>
            </div>

            <div className={styles.logout}>
                <Tooltip title='LOGOUT'>
                    <IconButton aria-label="log-out" size='large'  variant="contained"
                        onClick={handleLogout} >
                        <LogoutIcon color='error' fontSize="large"/>
                    </IconButton>
                </Tooltip>
            </div>
            


        
        </div>

        
    )
}

export default LobbyPage;