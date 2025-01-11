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
            [{color: "black", type: "rook"}, {color: "black", type: "knight"}, {color: "black", type: "bishop"}, {color: "black", type: "queen"}, {color: "black", type: "king"}, {color: "black", type: "bishop"}, {color: "black", type: "knight"}, {color: "black", type: "rook"}],
            [{color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [{color: "white", type: "pawn"}, {color: "white", type: "pawn"}, {color: "white", type: "pawn"}, {color: "white", type: "pawn"}, {color: "white", type: "pawn"}, {color: "white", type: "pawn"}, {color: "white", type: "pawn"}, {color: "white", type: "pawn"}],
            [{color: "white", type: "rook"}, {color: "white", type: "knight"}, {color: "white", type: "bishop"}, {color: "white", type: "queen"}, {color: "white", type: "king"}, {color: "white", type: "bishop"}, {color: "white", type: "knight"}, {color: "white", type: "rook"}]
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
            element.src = "/assets/chess/" + piece + piece.type + ".svg";
        }
        else {
            element.src = "/assets/chess/blank.svg";
        }
        return element;
    }

    updateChessImgElement = (element, piece) => {
        if(piece) {
            element.src = "/assets/chess/" + piece.color + piece.type + ".svg";
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

        // Moves only if move is valid
        this.movePiece(previousPos, pos);
        this.selectedSquare = null;
        return;
    }

    getKnightMoves = (pos) => {
        const moves = [
            {row: -2, col: 1},
            {row: -1, col: 2},
            {row: 1, col: 2},
            {row: 2, col: 1},
            {row: 2, col: -1},
            {row: 1, col: -2},
            {row: -1, col: -2},
            {row: -2, col: -1}
        ];
        // Add the valid moves
        const currentPiece = this.board[pos.row][pos.col];
        let newMoves = [];
        for (let i = 0; i < moves.length; i++) {
            let newMove = sumArrays(pos, moves[i]);
            // If it's a valid position on the chessboard and not
            // of the same color, add it
            if(validatePosition(newMove) &&
                (!this.board[newMove.row][newMove.col] || (this.board[newMove.row][newMove.col].color !== currentPiece.color))) {
                newMoves.push(newMove);
            }
        }
        return newMoves;
    }

    // Get the squares a bishop can move to
    getBishopMoves = (pos) => {
        const validMoves = [];
        const currentPiece = this.board[pos.row][pos.col];
        // Up-right moves
        for (let offset = 1; validatePosition({row: pos.row - offset, col: pos.col + offset}); offset++) {
            console.log("evaluating bishop", pos.row - offset, pos.col + offset);
            // If there's a piece in the new square
            const newSquare = this.board[pos.row - offset][pos.col + offset];
            if(newSquare) {
                // If different colors, include it
                if(newSquare.color !== currentPiece.color) {
                    validMoves.push({row: pos.row - offset, col: pos.col + offset});
                }
                // Skip the rest (prevent from jumping over pieces)
                break;
            }
            // Otherwise add the move
            else {
                validMoves.push({row: pos.row - offset, col: pos.col + offset});
            }
        }
        // Down-right moves
        for (let offset = 1; validatePosition({row: pos.row + offset, col: pos.col + offset}); offset++) {
            console.log("evaluating bishop", pos.row + offset, pos.col + offset);
            // If there's a piece in the new square
            const newSquare = this.board[pos.row + offset][pos.col + offset];
            if(newSquare) {
                // If different colors, include it
                if(newSquare.color !== currentPiece.color) {
                    validMoves.push({row: pos.row + offset, col: pos.col + offset});
                }
                // Skip the rest (prevent from jumping over pieces)
                break;
            }
            // Otherwise add the move
            else {
                validMoves.push({row: pos.row + offset, col: pos.col + offset});
            }
        }
        // Down-left moves
        for (let offset = 1; validatePosition({row: pos.row + offset, col: pos.col - offset}); offset++) {
            console.log("evaluating bishop", pos.row + offset, pos.col - offset);
            // If there's a piece in the new square
            const newSquare = this.board[pos.row + offset][pos.col - offset];
            if(newSquare) {
                // If different colors, include it
                if(newSquare.color !== currentPiece.color) {
                    validMoves.push({row: pos.row + offset, col: pos.col - offset});
                }
                // Skip the rest (prevent from jumping over pieces)
                break;
            }
            // Otherwise add the move
            else {
                validMoves.push({row: pos.row + offset, col: pos.col - offset});
            }
        }
        // Up-left moves
        for (let offset = 1; validatePosition({row: pos.row - offset, col: pos.col - offset}); offset++) {
            console.log("evaluating bishop", pos.row - offset, pos.col - offset);
            // If there's a piece in the new square
            const newSquare = this.board[pos.row - offset][pos.col - offset];
            if(newSquare) {
                // If different colors, include it
                if(newSquare.color !== currentPiece.color) {
                    validMoves.push({row: pos.row - offset, col: pos.col - offset});
                }
                // Skip the rest (prevent from jumping over pieces)
                break;
            }
            // Otherwise add the move
            else {
                validMoves.push({row: pos.row - offset, col: pos.col - offset});
            }
        }
        return validMoves;
    }

    getRookMoves = (pos) => {
        const validMoves = [];
        const currentPiece = this.board[pos.row][pos.col];
        // Moves up
        for (let row = pos.row - 1; row >= 0; row--) {
            const newSquare = this.board[row][pos.col];
            // If there's a piece here
            if(newSquare) {
                // If other color, include it
                if(newSquare.color !== currentPiece.color) {
                    validMoves.push({row: row, col: pos.col});
                }
                // Since we hit a piece, stop the loop
                break;
            }
            else {
                validMoves.push({row: row, col: pos.col});
            }
        }
        // Moves to the right
        for (let col = pos.col + 1; col < 8; col++) {
            const newSquare = this.board[pos.row][col];
            // If there's a piece here
            if(newSquare) {
                // If other color, include it
                if(newSquare.color !== currentPiece.color) {
                    validMoves.push({row: pos.row, col: col});
                }
                break;
            }
            else {
                validMoves.push({row: pos.row, col: col});
            }
        }
        // Moves down
        for (let row = pos.row + 1; row < 8; row++) {
            const newSquare = this.board[row][pos.col];
            // If there's a piece here
            if(newSquare) {
                if(newSquare.color !== currentPiece.color) {
                    validMoves.push({row: row, col: pos.col});
                }
                break;
            }
            else {
                validMoves.push({row: row, col: pos.col});
            }
        }
        // Moves to the left
        for (let col = pos.col - 1; col >= 0; col--) {
            const newSquare = this.board[pos.row][col];
            // If there's a piece here
            if(newSquare) {
                if(newSquare.color !== currentPiece.color) {
                    validMoves.push({row: pos.row, col: col});
                }
                break;
            }
            else {
                validMoves.push({row: pos.row, col: col});
            }
        }
        return validMoves;
    }

    getQueenMoves = (pos) => {
        // A queen is a bishop + rook
        const validBishopMoves = this.getBishopMoves(pos);
        const validRookMoves = this.getRookMoves(pos);
        return validBishopMoves.concat(validRookMoves);
    }

    // If it's a knight, make sure new square is valid
    movePiece = (pos1, pos2) => {
        let piece = this.board[pos1.row][pos1.col];
        let validMove = false;
        if(piece.type === "knight") {
            console.log("knight attempt");
            if(inArray(this.getKnightMoves(pos1), pos2)) {
                validMove = true;
            }
        }
        else if(piece.type === "bishop") {
            console.log("bishop attempt");
            if(inArray(this.getBishopMoves(pos1), pos2)) {
                validMove = true;
            }
        }
        else if(piece.type === "rook") {
            console.log("rook attempt");
            if(inArray(this.getRookMoves(pos1), pos2)) {
                validMove = true;
            }
        }
        else if(piece.type === "queen") {
            console.log("queen attempt");
            if(inArray(this.getQueenMoves(pos1), pos2)) {
                validMove = true;
            }
        }
        else {
            validMove = true;
        }
        // Make sure move is valid and there's no same color piece there
        if(validMove) {
            this.board[pos2.row][pos2.col] = this.board[pos1.row][pos1.col];
            this.board[pos1.row][pos1.col] = null;
            this.drawBoard();
            return true;
        }
        return false;
    }
}
