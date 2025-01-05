
// Sum two 2-D arrays: [1,4] + [3, 5] = [4, 9]
const sumArrays = (pos1, pos2) => {
    return [pos1.row + pos2.row, pos1.col + pos2.col];
}
// See if the coordinates are a valid chess position (values are between 0 and 7)
const validatePosition = (pos) => {
    return (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8);
}

const getKnightMoves = (pos) => {
    const moves = [
        {row: -2, col: 1},
        {row: -1, col: 2},
        {row: 1, col: 2},
        {row: 2, col: 1},
        {row: 2, col: -2},
        {row: 1, col: -2},
        {row: -1, col: -2},
        {row: -2, col: -1}
    ];
    // Add the valid moves
    let newMoves = [];
    for (let i = 0; i < moves.length; i++) {
        let newMove = sumArrays(pos, moves[i]);
        // If it's a valid position on the chessboard, add it
        if(validatePosition(newMove)) {
            newMoves.push(newMove);
        }
    }
    return newMoves;
}


class ChessBoard {
    constructor () {
        this.board = [
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null]
        ];
    }
}

export class ChessGame {
    constructor (players, sendRefreshFunc) {
        // Make sure there are exactly 2 players
        if(players.length != 2) {
            // Specify that the game was not successfully created
            this.success = false;
            return;
        }
        this.players = {}; // username: {}
        this.sendRefreshFunc = sendRefreshFunc;
        this.gameType = "Chess";

        // Add the players
        this.players[players[0]] = {};
        this.players[players[1]] = {};
        this.success = true;
    }

    getVisibleState = () => {
        return {

        };
    }

    removePlayer = (username) => {
        console.log(this.players, username);
        delete this.players[username];
    }
}