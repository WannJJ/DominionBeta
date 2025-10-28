export const PlayerProfile = {
  username: "",
  game_code: "",
  role: "",
  ordinal_number: 0,
  status: null,

  getUsername: function () {
    return this.username;
  },
  setUsername: function (username) {
    this.username = username;
  },
  getGameCode: function () {
    return this.game_code;
  },
  setGameCode: function (game_code) {
    this.game_code = game_code;
  },
  getRole: function () {
    return this.role;
  },
  setRole: function (role) {
    this.role = role;
  },
  getOrdinalNumber: function () {
    return this.ordinal_number;
  },
  setOrdinalNumber: function (ordinal_number) {
    this.ordinal_number = ordinal_number;
  },
  getStatus: function () {
    return this.status;
  },
  setStatus: function (status) {
    this.status = status;
  },
};
