
export class MatchGame {
    constructor () {
        this.admin = null;
        this.players = {}; // username: {matches: 0,}
        this.playerOrder = [];
        this.currentTurnIndex = null;
        this.gameState = "Waiting"; // Waiting, Active, or Finished
        this.turnExpires = null;
        this.board = null;
        this.playerCount = 0;
        this.cardNumber = 0; //If it's the 0th, 1st, or 2nd card chosen on a turn
    }

    // Add a player to the game
    addPlayer = (username) => {
        // If they're already in the game
        if(username in this.players) {
            return "You are already in the game.";
        }
        if(this.playerCount >= 4) {
            return "The game is full.";
        }
        // If this is the first player, they're the admin
        if(this.playerCount === 0) {
            this.admin = username;
        }
        this.players[username] = {
            matches: 0
        };
        // Add them to the turn list
        this.playerOrder.push(username);
        this.playerCount++;
    }

    nextTurn = () => {
        this.currentTurnIndex++;
        if(this.currentTurnIndex >= this.playerCount) {
            this.currentTurnIndex = 0;
        }
    }

    getTurnUsername = () => {
        return this.playerOrder[this.currentTurnIndex];
    }

    // Remove a player from the game
    removePlayer = (username) => {
        // If the player is not in the game
        if(!(username in this.players)) {
            return false;
        }
        this.playerCount--;
        // If this is the last player, return true (game is deleted)
        if(this.playerCount === 1) {
            this.players.pop();
            return true;
        }
        delete this.players[username];
        // If it's the admin, promote another player to admin
        if(username === this.admin) {
            this.admin = Object.keys(this.players)[0];
        }
        // If it's this player's turn, skip them
        this.nextTurn();
        // Remove the player from the turns order list
        this.playerOrder = this.playerOrder.filter(player => player !== username);
        return false;
    }

    // If the game is full
    isFull = () => {
        return this.playerCount >= 4;
    }

    // Player move
    makeTurn = (username, row, column) => {
        
    }

    startGame = () => {

    }
}