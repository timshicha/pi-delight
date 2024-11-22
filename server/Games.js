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

const ROWS = 6;
const COLUMNS = 4;
const MATCH_CARDS = 20; // How many different match cards the FE has

export class MatchGame {
    constructor () {
        this.admin = null;
        this.players = {}; // username: {matches: 0,}
        this.playerOrder = [];
        this.currentTurnIndex = null;
        this.gameState = "Waiting"; // Waiting, Active, or Finished
        this.turnExpires = null;
        this.board = null;
        this.cardsLeft = null;
        this.playerCount = 0;
        this.cardNumber = 0; //If it's the 0th, 1st, or 2nd card chosen on a turn
        this.flippedCards = [-1, -1, -1];
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
        // If the game is already started
        if(this.gameState === 'Active') {
            return "This game is already in progress.";
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
        return null;
    }

    nextTurn = () => {
        if(this.gameState !== 'Active') {
            return;
        }
        this.currentTurnIndex++;
        if(this.currentTurnIndex >= this.playerCount) {
            this.currentTurnIndex = 0;
        }
    }

    getTurnUsername = () => {
        if(this.gameState !== 'Active') {
            return null;
        }
        return this.playerOrder[this.currentTurnIndex];
    }

    getPlayers = () => {
        return this.playerOrder;
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
    makeTurn = (username, cardChosen) => {
        if(this.gameState !== 'Active') {
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
        if(cardChosen in this.flippedCards) {
            return false;
        }
        // Otherwise flip the card
        // If this is the first card, simply return it
        if(this.cardNumber == 0) {
            this.flippedCards[0] = cardChosen;
            this.cardNumber++;
            return {
                cardIndex: cardChosen,
                cardReveal: this.board[cardChosen],
            };
        }
        // If this is the second card
        if(this.cardNumber == 1) {
            // If it's a match to first card]
            if(this.board[this.flippedCards[0]] == this.board[cardChosen]) {
                this.flippedCards[1] = cardChosen;
                this.cardNumber++;
                return {
                    cardIndex: cardChosen,
                    cardReveal: this.board[cardChosen]
                };
            }
            // If it's not a match
            this.flippedCards = [-1, -1, -1];
            this.cardNumber = 0;
            this.nextTurn();
            return {
                cardIndex: cardChosen,
                cardReveal: this.board[cardChosen]
            };
        }
        // If this is the third card (last card)
        if(this.cardNumber == 2) {
            // If it's also a match
            if(this.board[this.flippedCards[0]] == this.board[cardChosen]) {
                this.flippedCards[2] = cardChosen;
                this.cardNumber++;
                // Record the match
                this.players[this.getTurnUsername()].matches++;
                this.cardsLeft[this.flippedCards[0]] = 0;
                this.cardsLeft[this.flippedCards[1]] = 0;
                this.cardsLeft[this.flippedCards[2]] = 0;
                
                this.flippedCards = [-1, -1, -1];
                this.cardNumber = 0;
                return {
                    cardIndex: cardChosen,
                    cardReveal: this.board[cardChosen]
                };
            }
            // If it's not a match
            this.flippedCards = [-1, -1, -1];
            this.cardNumber = 0;
            this.nextTurn();
            return {
                cardIndex: cardChosen,
                cardReveal: this.board[cardChosen]
            };
        }
        return null;
    }

    startGame = () => {
        if(this.gameState !== 'Waiting'){
            return false;
        }
        this.gameState = 'Active';
        this.cardNumber = 0;
        // Randomize turn
        this.currentTurnIndex = randInt(0, this.playerCount - 1);
        // Make the board
        this.board = Array(20).fill(0);
        this.cardsLeft = Array(20).fill(1);
        // We have 20 cards to choose from to make the 8 sets
        // Choose 8 different numbers between 0 and 19 (they will be in first 8 indeces)
        let cardOptions = Array.from({ length: MATCH_CARDS }, (_, i) => i);
        cardOptions = shuffleArray(cardOptions);
        // Now place them in sets of 3 in an array
        this.board = Array(MATCH_CARDS).fill(-1);
        for (let option = 0; option <= ROWS * COLUMNS / 3; option++) {
            this.board[option * 3] = cardOptions[option];
            this.board[option * 3 + 1] = cardOptions[option];
            this.board[option * 3 + 2] = cardOptions[option];
        }
        // Now shuffle the array
        this.board = shuffleArray(this.board);
        return true;
    }

    getGameState = () => {
        return {
            players: this.playerOrder,
            gameState: this.gameState,
            cardsLeft: this.cardsLeft,
        };
    }
    
}