import $, { ajax } from 'jquery';

let logout = function(){
    $.ajax({
      type: 'GET',
      url: URL + 'logout',
      success: function(){
        console.log('Loged out:');
      },
    });
  }
  