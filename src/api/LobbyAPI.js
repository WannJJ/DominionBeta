import $, { ajax } from 'jquery';
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { URL, wsURL } from '../utils/constants';
import { shuffleArray } from '../utils/helpers';
import { PlayerProfile } from '../game_logic/PlayerProfile';
import { getCookie } from '../utils/helpers';



let player_list = '';
let lobbyWebSocket = null;




export const LobbyController = () => {
    const { isAuthenticated, setIsAuthenticated, isGameStarted, setIsGameStarted } = useContext(AppContext);
    let setPlayerList = null;

    const startGame = function(){
      if(lobbyWebSocket == null) return;
      lobbyWebSocket.send(JSON.stringify({
        message: 'START_GAME',
      }));
    };

    const setupGame = async function(kingdomNameList, basicNameList, landscapeEffectsNameList, nonSupplyNameList){ 
        let completed = false;
        while(!completed){
          await new Promise((resolve) =>{
            let name_array = player_list.split(',');  
            shuffleArray(name_array); 
            let name_order = name_array.join(',');
            let csrftoken = getCookie('csrftoken');
            //console.log('setup_prepare');
        
            $.ajax({
              type:'POST',
              url: URL + 'setup_prepare',
              data:{ 
                csrfmiddlewaretoken: csrftoken,
                game_code: PlayerProfile.getGameCode(),  
                kingdom:  JSON.stringify(kingdomNameList),
                basic: JSON.stringify(basicNameList),
                landscape_effect: JSON.stringify(landscapeEffectsNameList),
                nonSupply: JSON.stringify(nonSupplyNameList),
                name_order: name_order,
              },
              xhrFields: {
                withCredentials: true
              },
              beforeSend: function(xhr){
                  xhr.withCredentials = true;
              },
              success: function(data){
                  console.log('setup_prepare success:',data);
                  completed = true;
                  resolve();
              },
              error: function(request, status, error){
                console.error('setup_prepare fail to connect');
                resolve();
              }
            });
          });
          /*
          await new Promise((resolve) =>{
            setTimeout(()=>{resolve()}, 10000);
          });
          */
        }
      }

    const restartGame = function(){

    }

    const logoutGame = function(){
        ajax({
            type: 'GET',
            url: URL + 'logout',
            xhrFields: {
                withCredentials: true
              },      
            success: function(data){
                console.log('Logged out:', data);
                setIsAuthenticated(false);
            },
        });
        
    }

    const createLobbyWebSocket = function(){
      lobbyWebSocket = new WebSocket(
        wsURL + "/lobby/dlkda"
        //wsURL + "/lobby/" + PlayerProfile.getGameCode() + "/"
      );
      lobbyWebSocket.onopen = function(){
        console.log("Lobby socket successfully connected.");
      };
      lobbyWebSocket.onclose = function (e) {
        console.log("Lobby socket closed unexpectedly");
      };
      lobbyWebSocket.onmessage = function(e){
        //console.log('Lobby Message received:', e.data);
        
        let data = JSON.parse(e.data);
        if(data.message === 'player_join'){
          player_list = data.player_list.map(player => player.username).join(',');
          //console.log('Player_list:', player_list); 
        } else if(data.message === "START_GAME"){
          setIsGameStarted(true);
        }

        if(setPlayerList !== null){
          setPlayerList(player_list);
        }
    
        //lobbyWebSocket.close();
      }
    }

    const closeLobbyWebSocket = function(){
      if(lobbyWebSocket == null) return;
      lobbyWebSocket.close();
    }

    const setPlayerListFunction = function(setPlayerlist){
      setPlayerList = setPlayerlist;
    }

    return {
        startGame,
        setupGame,
        restartGame,
        logoutGame,
        createLobbyWebSocket,
        closeLobbyWebSocket,
        setPlayerListFunction,
    }
}

