const hostname = window.location.hostname; //'192.168.0.101:8000';

const port = 8000;
export const URL = `http://${hostname}:${port}/`; //'http://192.168.0.101:8000/game/'; //'http://127.0.0.1:8000/game/';
export const wsURL = `ws:${hostname}:${port}`; //'ws:192.168.0.101:8000'  //'ws://127.0.0.1:8000';

export const GAME_STATUS = {
  NOT_EXISTS: "NOT EXISTS",
  NEW: "NEW",
  PLAYING: "PLAYING",
  END: "END",
};

export const ROLE_HOST = "Host",
  ROLE_GUEST = "Guest";

export const PHASE_ACTION = "action",
  PHASE_BUY = "buy",
  PHASE_NIGHT = "night",
  PHASE_REACTION = "reaction",
  PHASE_WAITING = "waiting",
  PHASE_START_TURN = "start turn",
  PHASE_CLEAN_UP = "clean up",
  PHASE_END_TURN = "end turn",
  PHASE_END_GAME = "end game";

export const ACTIVITY_PLAY = "Play",
  ACTIVITY_BUY = "Buy",
  ACTIVITY_GAIN = "Gain",
  ACTIVITY_BUY_GAIN = "Buy and Gain",
  ACTIVITY_EXILE = "Exile",
  ACTIVITY_RECEIVE = "Receive",
  ACTIVITY_DISCARD = "Discard",
  ACTIVITY_TRASH = "Trash",
  ACTIVITY_REVEAL = "Reveal",
  ACTIVITY_DRAW = "Draw",
  ACTIVITY_SHUFFLE = "Shuffle",
  ACTIVITY_AUTOPLAY_TREASURES = "Autoplay Treasures",
  ACTIVITY_ATTACK = "Attack",
  ACTIVITY_END_REACT = "END_REACT",
  ACTIVITY_ACTIVATE = "Activate",
  ACTIVITY_SET_ASIDE = "Set aside",
  ACTIVITY_PLAY_AS_WAY = "Play as Way",
  ACTIVITY_OTHER_REACT_GAIN = "Let other react when gain",
  ACTIVITY_OTHER_REACT_PLAY = "Let other react when play",
  ACTIVITY_OTHER_REACT_END_TURN = "Let other react when end turn",
  ACTIVITY_MESSAGE_OTHER = "Message";
