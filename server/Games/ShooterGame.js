export class ShooterGame {
    constructor(players, sendRefreshFunc) {

        this.gameType = "Shooter Game";

        this.players = {}; // username: {position: {x: 0, y: 0}, gender: 'boy'}
        this.sendRefreshFunc = sendRefreshFunc;

        // Add each player
        for (let i = 0; i < players.length; i++) {
            const username = players[i];
            if(username in this.players) continue; // Don't add duplicates
            this.players[username] = {
                position: { x: 0, y: 0 },
                gender: 'boy'
            };
        }

        // constantly send a refresh to update players positions
        setInterval(() => {
            this.sendRefreshFunc();
        }, 50);

        this.sendRefreshFunc();
    }

    makeMove = (username, moveInfo) => {
        // check to see which type of move was made
        // if a player move was made, update the player position
        if(moveInfo.moveType == "playerMove") {
            this.players[username].position = moveInfo.newPosition;
        }
    }

    getVisibleState = () => {
        return {
            players: this.players
        };
    }

    removePlayer = (username) => {
        return;
    }
}