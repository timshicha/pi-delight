// Sum two 2-D arrays: [1,4] + [3, 5] = [4, 9]
const sumArrays = (pos1, pos2) => {
    return [pos1.row + pos2.row, pos1.col + pos2.col];
}
// See if the coordinates are a valid chess position (values are between 0 and 7)
const validatePosition = (pos) => {
    return (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8);
}

const generateChessImgElement = (piece) => {
    const element = document.createElement("img");
    element.src = "/assets/chess/" + piece + ".svg";
    return element;
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


export class ChessBoard {
    constructor () {
        this.board = [
            ["blackRook", "blackKnight", "blackBishop", "blackQueen", "blackKing", "blackBishop", "blackKnight", "blackRook"],
            ["blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn"],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ["whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn"],
            ["whiteRook", "whiteKnight", "whiteBishop", "whiteQueen", "whiteKing", "whiteBishop", "whiteKnight", "whiteRook"]
        ];

        const chessboardElement = document.getElementById("chessboard");
        this.boardElements = Array(8);
        // Add each row to the chessboard
        for (let tr = 0; tr < 8; tr++) {
            let children = chessboardElement.getElementsByTagName("tr")[tr];
            this.boardElements[tr] = children.getElementsByTagName("td");
        }
        console.log(this.boardElements);
    }

    drawBoard = () => {        
        // For each row on the board
        for (let row = 0; row < 8; row++) {
            // For each square in the row
            for (let col = 0; col < 8; col++) {
                let thisCell = this.board[row][col];
                // If empty cell
                if(!thisCell) {
                    this.boardElements[row][col].replaceChildren();
                }
                else {
                    this.boardElements[row][col].replaceChildren(
                        generateChessImgElement(thisCell)
                    );
                }
            }
        }
    }
}
