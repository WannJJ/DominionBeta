
import $, { ajax } from 'jquery';
import { PlayerProfile } from '../game_logic/PlayerProfile';
import { URL, wsURL } from '../utils/constants';
import { getCookie } from '../utils/helpers';

let chatSocket = null;


export function createChatSocket(){
  return new Promise((resolve) =>{
    chatSocket = new WebSocket(
      wsURL + "/playing/"
      //wsURL + "/playing/" + PlayerProfile.getUsername() + "/"
    );
    chatSocket.onopen = function (e) {
      console.log("Chat socket successfully connected.");
      resolve(chatSocket);
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



export function getSetupData(){
    return new Promise(async (resolve) =>{
      let csrftoken = getCookie('csrftoken');
  
      $.ajax({
        type: 'POST',
        url: URL + 'api/GameSetup',
        data:{
          csrfmiddlewaretoken: csrftoken,
        },
        xhrFields: {
          withCredentials: true
        },
        success: function(data){
          //console.log('Receveid setup data:', data);
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
/*
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
    */



export function finish_setup(data, callback, callback_fail){
  let csrftoken = getCookie('csrftoken');
  data.csrfmiddlewaretoken = csrftoken;
  
  $.ajax({
    type: "POST",
    url: URL + "finish_setup",
    data: data,
    xhrFields: {
      withCredentials: true
    },
    beforeSend: function(xhr){
      xhr.withCredentials = true;
  },
    success: callback,
    error: callback_fail,
  });

}