// Sum two 2-D arrays: [1,4] + [3, 5] = [4, 9]
const sumArrays = (pos1, pos2) => {
    return {
        row: pos1.row + pos2.row,
        col: pos1.col + pos2.col
    };
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

// See if a position exists in an array
const inArray = (array, pos) => {
    for (let i = 0; i < array.length; i++) {
        if(array[i].row == pos.row && array[i].col == pos.col) {
            return true;
        }
    }
    return false;
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
        this.selectedSquare = null;

        this.chessboardElement = document.getElementById("chessboard");
        this.boardElements = Array(8);
        // Add each row to the chessboard
        for (let tr = 0; tr < 8; tr++) {
            let children = this.chessboardElement.getElementsByTagName("tr")[tr];
            this.boardElements[tr] = children.getElementsByTagName("td");

            // Add onclick for all cells
            for (let td = 0; td < 8; td++) {
                this.boardElements[tr][td].replaceChildren(this.generateChessImgElement(this.board[tr][td]));
                this.boardElements[tr][td].onclick = () => {
                    this.selectSquare({
                        row: tr,
                        col: td
                    });
                    return;
                }
            }
        }
    }

    generateChessImgElement = (piece) => {
        const element = document.createElement("img");
        element.classList.add("chessPieceImg");
        if(piece) {
            element.src = "/assets/chess/" + piece + ".svg";
        }
        else {
            element.src = "/assets/chess/blank.svg";
        }
        return element;
    }

    updateChessImgElement = (element, piece) => {
        if(piece) {
            element.src = "/assets/chess/" + piece + ".svg";
        }
        else {
            element.src = "/assets/chess/blank.svg";
        }
        return element;
    }

    // Pass a piece and an image element to see if the correct piece is
    // already shown.
    // This is used to avoid rerendering cells that weren't changed.
    cellMatchesImgElement = (piece, element) => {
        return (element.src === "/assets/chess/" + piece + ".svg");
    }

    drawBoard = () => {        
        // For each row on the board
        for (let row = 0; row < 8; row++) {
            // For each square in the row
            for (let col = 0; col < 8; col++) {
                let thisCell = this.board[row][col];
                this.updateChessImgElement(
                    this.boardElements[row][col].children[0], thisCell
                );
            }
        }
    }

    selectSquare = (pos) => {
        // If selected the same square, unselect
        if(this.selectedSquare && pos.row == this.selectedSquare.row && pos.col == this.selectedSquare.col) {
            this.selectedSquare = null;
            return;
        }
        // If nothing was previously selected and now clicked an empty square, ignore
        else if(!this.selectedSquare && !this.board[pos.row][pos.col]) {
            return;
        }
        // If no previous selected cell, simply select this cell
        else if(!this.selectedSquare) {
            this.selectedSquare = pos;
            return;
        }
        // Otherwise, a piece was selected and a new square was just clicked.
        // Validate the move.
        const previousPos = this.selectedSquare;
        console.log("Selected square:", pos.row, pos.col);

        // If valid move, move and unselect move
        if(this.movePiece(previousPos, pos)) {
            this.selectedSquare = null;
        }
        return;
    }

    // If it's a knight, make sure new square is valid
    movePiece = (pos1, pos2) => {
        let piece = this.board[pos1.row][pos1.col];
        let validMove = false;
        if(piece === "whiteKnight" || piece === "blackKnight") {
            console.log("knight attempt");
            if(inArray(getKnightMoves(pos1), pos2)) {
                validMove = true;
            }
        }
        else {
            validMove = true;
        }
        if(validMove) {
            this.board[pos2.row][pos2.col] = this.board[pos1.row][pos1.col];
            this.board[pos1.row][pos1.col] = null;
            this.drawBoard();
            return true;
        }
        return false;
    }
}
