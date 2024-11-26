import $, { ajax } from 'jquery';


const USERNAME = 'QUAN' + Math.floor(Math.random() * 100),
      ROOM = 1;
const hostname = window.location.hostname;//'192.168.0.101:8000';
const port = 8000;
const URL = `http://${hostname}:${port}/game/`; //'http://192.168.0.101:8000/game/'; //'http://127.0.0.1:8000/game/';
const wsURL =  `ws:${hostname}:${port}`;//'ws:192.168.0.101:8000'  //'ws://127.0.0.1:8000';

let lobbyWebSocket = null,
    chatSocket = null;
let player_list = '';
let lobbySocketOff = false;

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
let createLobbyWebSocket = function(){
  lobbyWebSocket = new WebSocket(
    wsURL + "/ws/game/lobby/" + ROOM + "/"
  );
  lobbyWebSocket.onopen = function(){
    console.log("Lobby socket successfully connected.");
  };
  lobbyWebSocket.onclose = function (e) {
    console.log("Lobby socket closed unexpectedly");
  };
  lobbyWebSocket.onmessage = function(e){
    if(lobbySocketOff){
      lobbyWebSocket.close();
    }
    console.log('Lobby Message received:');
    player_list = JSON.parse(e.data).player_list.map(player => player.username).join(',');
    console.log('Player_list:', player_list);
  }
}
let createChatSocket = function(){
  return new Promise((resolve) =>{
    chatSocket = new WebSocket(
      wsURL + "/ws/game/playing/" + USERNAME + "/"
    );
    chatSocket.onopen = function (e) {
      console.log("Chat socket successfully connected.");
      resolve(chatSocket);
      lobbySocketOff = true;
    };
    chatSocket.onclose = function (e) {
      console.log("Chat socket closed unexpectedly");
      //this.open_websocket();
    };
    chatSocket.onmessage = function(e){
      console.log('Message received:', e );
    }
  });
}

let signin = function(username=USERNAME){
  return new Promise((resolve) =>{
    $.ajax({
      type: 'POST',
      url: URL+'signin',
      data:{
        username: username,
        room: ROOM,
      },
      xhrFields: {
        withCredentials: true
      },
      beforeSend: function(xhr){
          xhr.withCredentials = true;
      },
      success: function(data){
        console.log('SIGN IN SUCCESS:');
        resolve();
        setTimeout(()=>{
          createLobbyWebSocket();
        },
        1);
      }
    
    })
  });
}
let getDATA = function(){
  $.ajax({
    type: 'GET',
    url: URL + 'api',
    success: function(data){
      console.log('API:', data);
    }
  });
}
let logout = function(){
  $.ajax({
    type: 'GET',
    url: URL + 'logout',
    success: function(){
      console.log('Loged out:');
    },
  });
}


let getSetupData = function(){
  console.log('GET SETUP DATA')
  return new Promise(async (resolve) =>{
    let csrftoken = getCookie('csrftoken');

    $.ajax({
      type: 'POST',
      url: URL + 'api/GameSetup',
      data:{
        csrfmiddlewaretoken: csrftoken,
        count: 2,
      },
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
        console.log('Receveid data:', data);
        resolve(data);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          console.warn('Resource not found (404). Handling gracefully...');
          // Xử lý logic của bạn khi nhận được 404
        } else {
          console.error('An error occurred:', error);
        }
      },
      complete: function(){

      }
    })

  });
}
let getSetupDataWithRetry = async function(retries = 3, delay = 1000) {
  let result = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try{
      result = await getSetupData();
      return result;
    }catch(error){
      if (attempt === retries) {
        throw error;
      }
      console.warn(`Retrying... (${attempt}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

  }
}


let prepare_game = async function(kingdomNameList, basicNameList, landscapeEffectsNameList, nonSupplyNameList){ 
  let completed = false;
  while(!completed){
    await new Promise((resolve) =>{
      let name_array = player_list.split(',');  
      shuffleArray(name_array); 
      let name_order = name_array.join(',');
      let csrftoken = getCookie('csrftoken');
      console.log('setup_prepare');
  
      $.ajax({
        type:'POST',
        url: URL + 'setup_prepare',
        data:{ 
          csrfmiddlewaretoken: csrftoken,
          game_code: ROOM,  
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
        error: function(data){
          console.log('setup_prepare fail to connect');
          resolve();
        }
      });
    });
    await new Promise((resolve) =>{
      setTimeout(()=>{resolve()}, 100);
    });
  }
  
  
}
let finish_setup = function(data, callback, callback_fail){
  let csrftoken = getCookie('csrftoken');
  data.csrfmiddlewaretoken = csrftoken;
  
  $.ajax({
    type: "POST",
    url: URL + "finish_setup",
    data: data,
    xhrFields: {
      withCredentials: true
    },
    success: callback,
    error: callback_fail,
  });

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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}
  

export {createChatSocket, chatSocket, signin, prepare_game, getSetupData, getSetupDataWithRetry, finish_setup};
