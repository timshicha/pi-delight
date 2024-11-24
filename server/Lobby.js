
export class Lobby {
    constructor (users) {
        this.users = users;
        this.players = [];
        this.icons = [];
        this.gameSelected = null;
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
        this.players.splice(this.players.indexOf(username), 1);
        this.users[username].lobby = null;
        this.updatePlayerIcons();
    }

    data = () => {
        return {
            players: this.players,
            icons: this.icons,
            gameSelected: this.gameSelected,
            game: this.game,
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

    sendRefresh = () => {
        // If in game
        if(this.game) {
            for (let i = 0; i < this.players.length; i++) {

            }
        }
        // If still in lobby
        else {
            for (let i = 0; i < this.players.length; i++) {
                if(this.users[this.players[i]].socket) {
                    this.users[this.players[i]].socket.send(JSON.stringify({
                        messageType: 'refresh',
                        inLobby: true,
                        state: this.data(),
                        invited: this.users[this.players[i]].invited
                    }));
                }
            }
        }
    }
}