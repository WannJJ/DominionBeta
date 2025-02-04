const path = "./sound/";

var MUTE = false;

const audioManager = {
  // Định nghĩa các âm thanh
  sounds: {
    crow: new Audio(path + "crow.mp3"),
    horse: new Audio(path + "horse-neighing.mp3"),
    gameOver: new Audio(path + "game-over.mp3"),
    matchFound: new Audio(path + "match-found.mp3"),
    ping: new Audio(path + "ping.mp3"),
    shuffle: new Audio(path + "shuffle.mp3"),
    win: new Audio(path + "win.mp3"),
    yourTurn: new Audio(path + "your-turn.mp3"),
  },

  // Phát âm thanh theo tên
  playSound: function (soundName) {
    if (MUTE) {
      return;
    }
    const sound = this.sounds[soundName];
    if (sound) {
      sound.play().catch((error) => {
        console.error("Không thể phát âm thanh:", error);
      });
    } else {
      console.warn("Âm thanh không tồn tại:", soundName);
    }
  },

  // Dừng âm thanh theo tên
  stopSound: function (soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.pause();
      sound.currentTime = 0; // Đặt lại thời gian phát
    }
  },

  setMute: function (mute) {
    MUTE = mute;
  },
};

/*
var audio = new Audio('./sound/crow.mp3');
audio.autoplay = true;
audio.playsinline = true;
audio.muted = false;
audio.click();
*/

// Xuất đối tượng audioManager để có thể sử dụng ở nơi khác
export default audioManager;
