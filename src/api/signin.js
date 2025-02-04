import $, { ajax } from 'jquery';
import { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { GAME_STATUS, URL, wsURL } from '../utils/constants';
import { PlayerProfile } from '../game_logic/PlayerProfile';


export const SigninController = () =>   {
  const { isAuthenticated, setIsAuthenticated, isGameStarted, setIsGameStarted } = useContext(AppContext);

  const signin = function(username='', room=''){
    return new Promise((resolve) =>{
      $.ajax({
        type: 'POST',
        url: URL+'signin',
        data:{
          username: username,
          room: room,
        },  
        xhrFields: {
          withCredentials: true
        },
        
        beforeSend: function(xhr){
            xhr.withCredentials = true;
        },
        success: function(data, text){
          if(data.message === "Logged in successfully"){
            console.log('SIGN IN SUCCESS:', data);  

            let username = data.username,
              game_code = data.game_code,
              role = data.role,
              ordinal_number = data.ordinal_number,
              player_status = data.status;
            PlayerProfile.setUsername(username);
            PlayerProfile.setRole(role);
            PlayerProfile.setGameCode(game_code);
            PlayerProfile.setOrdinalNumber(ordinal_number);
            PlayerProfile.setStatus(player_status);

            setIsAuthenticated(true);
          }
          
          resolve();
        },
        error: function(request, status, error){
          console.warn("Error", error);
          console.log("Status", status)
        }
      
      })
    });
  }

  return {
    signin
  };

}

export const CheckAuthHook = () =>{
  const { isAuthenticated, setIsAuthenticated, isGameStarted, setIsGameStarted, isGameEnded, setIsGameEnded, } = useContext(AppContext);
  
  const check_auth = function(){
    $.ajax({
      type: 'GET',
      url: URL + 'check_auth',
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
        console.log('check_auth:', data);
        if(data.logged_in){

          let username = data.username,
              game_code = data.game_code,
              role = data.role,
              ordinal_number = data.ordinal_number,
              player_status = data.player_status,
              game_status = data.game_status;
          PlayerProfile.setUsername(username);
          PlayerProfile.setRole(role);
          PlayerProfile.setGameCode(game_code);
          PlayerProfile.setOrdinalNumber(ordinal_number);
          PlayerProfile.setStatus(player_status);

          setIsAuthenticated(true);

          if(game_status === GAME_STATUS.NEW){
            setIsGameStarted(false);
            setIsGameEnded(false);
          }
          if(game_status === GAME_STATUS.PLAYING){
            setIsGameStarted(true);
            setIsGameEnded(false);
          } else if(game_status === GAME_STATUS.END){
            setIsGameStarted(true);
            setIsGameEnded(true);
          }
        }
      }
    });
  }
  return {
    check_auth,
  }
}


/*
let response = await fetch('http://127.0.0.1:8000/game/signin', {
  method: 'POST',
  mode: "cors", 
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: 'quan',
    room: 'dada',
  }),
});
let getResponse = await fetch('http://127.0.0.1:8000/game/signin', {
  method: 'GET',
});
console.log(getResponse.headers.getSetCookie());
console.log('COOKIE:',document.cookie);
console.log(response);
*/

