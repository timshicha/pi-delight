import { MatchGame } from "./Games.js";

export class Lobby {
    constructor (users) {
        this.users = users;
        this.players = [];
        this.icons = [];
        this.gameType = null;
        this.game = null;
        this.chat = [];
        this.maxPlayers = 4;
    }

    addPlayer = (username) => {
        // If too many players
        if(this.players.length >= this.maxPlayers) {
            this.users[username].socket.send(JSON.stringify({
                messageType: 'join',
                error: 'The lobby is already full.'
            }));
            return;
        }
        this.players.push(username);
        this.users[username].lobby = this;
        this.updatePlayerIcons();
    }

    removePlayer = (username) => {
        // If in game
        if(this.game) {
            this.game.removePlayer(username);
        }
        this.players.splice(this.players.indexOf(username), 1);
        this.users[username].lobby = null;
        this.updatePlayerIcons();
    }

    data = () => {
        return {
            players: this.players,
            icons: this.icons,
            gameType: this.gameType,
            game: this.game ? this.game.getVisibleState() : null,
            chat: this.chat
        };
    }

    getAdmin = () => {
        if(this.players.length === 0) {
            return null;
        }
        return this.players[0];
    }

    hasPlayer = (username) => {
        return this.players.includes(username);
    }

    updatePlayerIcons = () => {
        this.icons = this.players.map(username => this.users[username].icon);
    }

    startGame = () => {
        console.log(this.players);
        console.log("starting game");
        this.game = new MatchGame(this.players, this.sendRefresh);
        this.sendRefresh();
    }

    makeMove = (username, moveInfo) => {
        if(!this.game) {
            return;
        }
        const ret = this.game.makeMove(username, moveInfo);
        if(ret) {
            // If the game is now over and we are sending the last
            // refresh, tell the client to not teleport the player
            // back to lobby on this refresh
            const backToLobby = this.game && !this.game.gameIsOver;
            this.sendRefresh(backToLobby);
        }
    }

    sendRefreshTo = (username, backToLobby=true) => {
        if(!this.users[username] || !this.users[username].socket) {
            return;
        }
        const gameType = this.game ? this.game.gameType : null;
        this.users[username].socket.send(JSON.stringify({
            messageType: 'refresh',
            inLobby: true,
            inGame: Boolean(this.game),
            gameType: gameType,
            state: this.data(),
            invited: this.users[username].invited,
            backToLobby: backToLobby
        }));
        // If game is over, send game over
        if(this.game && this.game.gameIsOver) {
            this.users[username].socket.send(JSON.stringify({
                messageType: 'results',
                gameType: gameType,
                data: this.data()
            }));
        }
    }

    // backToLobby: let the client know if the player should be
    // forced back to lobby. If this is true, the player's results
    // window will close and they will be teleported t lobby. This
    // should be set to false if sendRefresh is triggered by someone
    // simply leaving or joining the lobby.
    sendRefresh = (backToLobby=true) => {
        for (let i = 0; i < this.players.length; i++) {
            this.sendRefreshTo(this.players[i], backToLobby);
        }
        // If game is over, reset the game after refresh
        if(this.game && this.game.gameIsOver) {
            this.game = null;
        }
    }
}