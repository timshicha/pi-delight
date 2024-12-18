const MATCH_SETS = 8; // How many sets of cards there are
const MATCH_CARDS = 20; // How many different match cards the FE has

const randInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//  Fisher-Yates Shuffle algorithm (generated by Google's Generative AI)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export class MatchGame {
    constructor (players) {
        if(players.length < 1) return; // Minimum of 1 players
        if(players.length > 4) return; // Maxinum of 4 players
        this.gameType = "Match";
        this.admin = null;
        this.players = {}; // username: {matches: 0, gender: 'boy'}
        this.playerOrder = [];
        this.currentTurnIndex = null;
        this.turnExpires = null;
        this.board = null;
        this.cardsLeft = null;
        this.visibleBoard = null;
        this.playerCount = 0;
        this.firstCardChosen = false;
        this.firstCardIndex = -1;
        this.secondCardIndex = -1;
        this.gameIsOver = false;

        // Add each player
        for (let i = 0; i < players.length; i++) {
            const username = players[i];
            if(username in this.players) continue; // Don't add duplicates
            this.players[username] = {
                matches: 0,
                gender: 'boy'
            };
        }
        this.admin = players[0];
        this.playerOrder = players;
        this.playerCount = players.length;
        this.startGame();
        console.log("game started");
    }

    nextTurn = () => {
        if(this.gameIsOver) {
            return;
        }
        this.currentTurnIndex++;
        if(this.currentTurnIndex >= this.playerCount) {
            this.currentTurnIndex = 0;
        }
    }

    updateVisibleBoard = () => {
        // Show the board as it should be seen by users
        for (let i = 0; i < this.visibleBoard.length; i++) {
            // If this card was taken
            if(!this.cardsLeft[i]) {
                this.visibleBoard[i] = null;
            }
            // If this card is visible
            else if(this.firstCardIndex == i || this.secondCardIndex == i) {
                this.visibleBoard[i] = this.board[i];
            }
            // If not visible
            else {
                this.visibleBoard[i] = -1;
            }
        }
    }

    getTurnUsername = () => {
        if(this.gameIsOver) {
            return null;
        }
        return this.playerOrder[this.currentTurnIndex];
    }

    getPlayers = () => {
        return this.playerOrder;
    }

    // Delete this game from a list of match games
    deleteGame = (gameList) => {
        for (let i = 0; i < gameList.length; i++) {
            if(this == gameList[i]) {
                gameList.splice(i, 1);
                return;
            }
        }
    }

    // Remove a player from the game.
    // Return true if last player
    removePlayer = (username) => {
        // If the player is not in the game
        if(!(username in this.players)) {
            return false;
        }
        this.playerCount--;
        // If this is the last player, return true (game is deleted)
        if(this.playerCount === 0) {
            delete this.players[username];
            return true;
        }
        delete this.players[username];
        console.log(Object.keys(this.players));
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

    // Wrap the makeTurn call for safety
    makeMove = (username, moveInfo) => {
        console.log(this.board);
        // Make sure it's their turn
        if(this.getTurnUsername() !== username) {
            return;
        }
        const index = moveInfo.index; //parseInt(moveInfo.index) || 0;
        return this.makeTurn(username, index);
    }

    // Player move
    makeTurn = (username, cardChosen) => {
        if(this.gameIsOver) {
            return false;
        }
        // If not user's turn
        if(username !== this.getTurnUsername()) {
            return false;
        }
        // If the card is not in range
        if(cardChosen < 0 || cardChosen >= this.board.length) {
            return false;
        }
        // Make sure the card is still available
        if(!this.cardsLeft[cardChosen]) {
            return false;
        }
        // Make sure they didn't select this card already on this turn
        if(this.firstCardChosen && this.firstCardIndex === cardChosen) {
            return false;
        }
        // If first card
        if(!this.firstCardChosen) {
            this.firstCardIndex = cardChosen;
            this.secondCardIndex = -1;
        }
        // If second card
        else {
            this.secondCardIndex = cardChosen;
        }
        // If second card, check for match
        if(this.firstCardChosen) {
            // If a match
            if(this.board[this.firstCardIndex] === this.board[this.secondCardIndex]) {
                this.cardsLeft[this.firstCardIndex] = 0;
                this.cardsLeft[this.secondCardIndex] = 0;
                this.players[username].matches++;
            }
            else {
                this.nextTurn();
            }
            this.firstCardChosen = false;
        }
        else {
            this.firstCardChosen = true;
        }
        this.updateVisibleBoard();
        // If game is over
        this.checkGameOver();
        return true;
    }

    // See if game is over (update self.gameIsOver)
    checkGameOver = () => {
        // See if any cards are left
        for (let i = 0; i < this.cardsLeft.length; i++) {
            if(this.cardsLeft[i]) {
                return;
            }
        }
        this.gameIsOver = true;
    }

    startGame = () => {
        this.cardNumber = 0;
        // Randomize turn
        this.currentTurnIndex = randInt(0, this.playerCount - 1);
        // We have 20 cards to choose from to make the sets
        // Choose SETS different numbers between 0 and 19 (they will be in first SETS indeces)
        let cardOptions = Array.from({ length: MATCH_CARDS }, (_, i) => i);
        cardOptions = shuffleArray(cardOptions);
        // Make the board
        this.board = Array(MATCH_SETS * 2).fill(-1);
        this.cardsLeft = Array(MATCH_SETS * 2).fill(1);
        this.visibleBoard = Array(MATCH_SETS * 2).fill(-1);
        // Now place them in sets of 2 in an array
        for (let option = 0; option < MATCH_SETS; option++) {
            this.board[option * 2] = cardOptions[option];
            this.board[option * 2 + 1] = cardOptions[option];
        }
        // Now shuffle the array
        this.board = shuffleArray(this.board);
        console.log(this.board);
        return true;
    }

    // What current cards are visible
    getCurrentVisibleCards = () => {
        let visible = {};
        visible[this.firstCardIndex] = this.board[this.firstCardIndex];
        visible[this.secondCardIndex] = this.board[this.secondCardIndex];
        return visible;
    }

    getVisibleState = () => {
        let players = [];
        // For each player
        let usernames = Object.keys(this.players);
        for (let i = 0; i < this.playerCount; i++) {
            players.push({
                username: usernames[i],
                gender: this.players[usernames[i]].gender,
                score: this.players[usernames[i]].matches
            });
        }
        return {
            players: players,
            admin: this.admin,
            visibleBoard: this.visibleBoard,
            currentTurn: this.gameIsOver ? null: this.getTurnUsername(),
            gameIsOver: this.gameIsOver
        };
    }

    isActive = () => {
        return !this.gameIsOver;
    }
}

// Delete a game from dict of game lists.
// Provide the fill dict and the game to delete.
export const deleteGame = (games, game) => {
    if(!game) {
        return;
    }
    const gameType = null;
    if(typeof(game) === MatchGame) {
        gameType === 'match';
    }
    game.deleteGame(games[gameType]);
}