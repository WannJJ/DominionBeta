
export const GameProfile = {
    game_code: null,
    player_count: 1,
    status: null,
    
    getGameCode: function(){return this.game_code},
    setGameCode: function(game_code){this.game_code = game_code},
    getPlayerCount: function(){return this.player_count},
    setPlayerCount: function(player_count){this.player_count = player_count},
    getStatus: function(){return this.status},
    getStatus: function(status){this.stats = status},
}