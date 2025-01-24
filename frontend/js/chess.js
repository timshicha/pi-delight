import { bishopDownLeftOffsets, bishopDownRightOffsets, bishopUpLeftOffsets, bishopUpRightOffsets, kingOffsets, knightOffsets, pawnAttackOffsets, rookDownOffsets, rookLeftOffets, rookRightOffsets, rookUpOffsets } from "./chessOffsets";

// Sum two 2-D arrays: [1,4] + [3, 5] = [4, 9]
const sumArrays = (pos1, pos2) => {
    return {
        row: pos1.row + pos2.row,
        col: pos1.col + pos2.col
    };
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

// See if a position exists in an array
const inArray4 = (array, pos) => {
    for (let i = 0; i < array.length; i++) {
        if(array[i].fromRow === pos.fromRow &&
            array[i].fromCol === pos.fromCol &&
            array[i].toRow === pos.toRow &&
            array[i].toCol === pos.toCol
        ) {
            return true;
        }
    }
    return false;
}

class ChessMove {
    constructor () {
        this.changes = [];
    }

    record = (row, col, piece) => {
        this.changes.push({
            row: row,
            col: col,
            piece: piece
        });
    }
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
        this.moveHistory = [];

        // Keep track of king and rook movements for castling
        this.kingMoved = {
            "white": false,
            "black": false
        };
        this.leftRookMoved = {
            "white": false,
            "black": false
        };
        this.rightRookMoved = {
            "white": false,
            "black": false
        };

        this.turn = "white";

        this.prevMove = {
            pawnDouble: false,
            color: "white",
            pos: {
                row: 0,
                col: 0
            }
        };

        this.elPassant = false;

        this.currentValidMoves = this.getValidMoves(this.turn);

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

    getOppositeColor = (color) => {
        if(color === "black") {
            return "white";
        }
        return "black";
    }

    getKingPosition = (color) => {
        for (let row = 0; row < 8; row++) {
            for(let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if(piece && piece.type === "king" && piece.color === color) {
                    return {
                        row: row,
                        col: col
                    };
                }
            }
        }
        return null;
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
        this.move(previousPos, pos);
        this.selectedSquare = null;
        return;
    }

    move = (previousPos, pos) => {
        console.log(this.currentValidMoves);
        // If it's a valid move
        if(inArray4(this.currentValidMoves, {
            fromRow: previousPos.row,
            fromCol: previousPos.col,
            toRow: pos.row,
            toCol: pos.col
        })) {
            this.board[pos.row][pos.col] = this.board[previousPos.row][previousPos.col];
            this.board[previousPos.row][previousPos.col] = null;
            this.drawBoard();
            this.swapTurn();
            this.currentValidMoves = this.getValidMoves(this.turn);
            if(this.isInCheck(this.turn)) {
                console.log(this.turn + " is in CHECK");
            }
        }
    }

    swapTurn = () => {
        if(this.turn === "white") {
            this.turn = "black";
        }
        else {
            this.turn = "white";
        }
    }

    // Return true if the position is on the chessboard
    isValid = (pos) => {
        return (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8);
    }

    isValidWithOffset = (pos, rowChange, colChange) => {
        const newPos = {
            row: pos.row + rowChange,
            col: pos.col + colChange
        };
        return this.isValid(newPos);
    }

    isValidCoords = (row, col) => {
        return (row >= 0 && row < 8 && col >= 0 && col < 8);
    }

    // Return piece or null
    // If position is outside of chessboard, return undefined
    getPiece = (pos) => {
        if(pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8) {
            return this.board[pos.row][pos.col];
        }
        return undefined;
    }
    
    // Return piece or null
    // If position is outside of chessboard, return undefined
    getPieceWithOffset = (pos, rowChange, colChange) => {
        const newPos = {
            row: pos.row + rowChange,
            col: pos.col + colChange
        };
        return this.validatePosition(newPos);
    }

    getPieceWithCoords = (row, col) => {
        return this.getPiece({
            row: row,
            col: col
        });
    }

    // Get valid attacks by color
    // Returns what pieces are attacking what squares (even if they are pinned)
    getAttackingSquares = (color) => {
        const attacks = [];

        // Go through each square on the board to look for pieces
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                let piece = this.board[row][col];

                // If there's a piece and it's of this color
                if(piece && piece.color === color) {
                    // See what squares it is attacking

                    // If it's a pawn
                    if(piece.type === "pawn") {
                        for (let i = 0; i < pawnAttackOffsets[color].length; i++) {
                            const rowOffset = pawnAttackOffsets[color][i].row;
                            const colOffset = pawnAttackOffsets[color][i].col;
                            if(this.isValidCoords(row + rowOffset, col + colOffset)) {
                                attacks.push({
                                    fromRow: row,
                                    fromCol: col,
                                    toRow: row + rowOffset,
                                    toCol: col + colOffset
                                });
                            }
                        }
                    }

                    // If it's a knight
                    if(piece.type === "knight") {
                        for (let i = 0; i < knightOffsets.length; i++) {
                            const rowOffset = knightOffsets[i].row;
                            const colOffset = knightOffsets[i].col;
                            if(this.isValidCoords(row + rowOffset, col + colOffset)) {
                                attacks.push({
                                    fromRow: row,
                                    fromCol: col,
                                    toRow: row + rowOffset,
                                    toCol: col + colOffset
                                });
                            }
                        }
                    }

                    // If it's a bishop or queen
                    if(piece.type === "bishop" || piece.type === "queen") {
                        const directions = [
                            bishopUpRightOffsets,
                            bishopDownRightOffsets,
                            bishopDownLeftOffsets,
                            bishopUpLeftOffsets
                        ];
                        // For each bishop direction
                        for (let i = 0; i < directions.length; i++) {
                            // For each square in this direction
                            for (let j = 0; j < directions[i].length; j++) {
                                const rowOffset = directions[i][j].row;
                                const colOffset = directions[i][j].col;
                                const result = this.getPieceWithCoords(row + rowOffset, col + colOffset);
                                // If we reached the end of the board
                                if(result === undefined) {
                                    break;
                                }
                                // If we are still on the board
                                else {
                                    attacks.push({
                                        fromRow: row,
                                        fromCol: col,
                                        toRow: row + rowOffset,
                                        toCol: col + colOffset
                                    });
                                    // If we hit a piece
                                    if(result) {
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // If it's a rook or queen
                    if(piece.type === "rook" || piece.type === "queen") {
                        const directions = [
                            rookUpOffsets,
                            rookDownOffsets,
                            rookLeftOffets,
                            rookRightOffsets
                        ];
                        // For each rook direction
                        for (let i = 0; i < directions.length; i++) {
                            // For each square in this direction
                            for (let j = 0; j < directions[i].length; j++) {
                                const rowOffset = directions[i][j].row;
                                const colOffset = directions[i][j].col;
                                const result = this.getPieceWithCoords(row + rowOffset, col + colOffset);
                                // If we reached the end of the board
                                if(result === undefined) {
                                    break;
                                }
                                // If we are still on the board
                                else {
                                    attacks.push({
                                        fromRow: row,
                                        fromCol: col,
                                        toRow: row + rowOffset,
                                        toCol: col + colOffset
                                    });
                                    // If we hit a piece
                                    if(result) {
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // If it's the king
                    if(piece.type === "king") {
                        for (let i = 0; i < kingOffsets.length; i++) {
                            const rowOffset = kingOffsets[i].row;
                            const colOffset = kingOffsets[i].col;
                            if(this.isValidCoords(row + rowOffset, col + colOffset)) {
                                attacks.push({
                                    fromRow: row,
                                    fromCol: col,
                                    toRow: row + rowOffset,
                                    toCol: col + colOffset
                                });
                            }
                        }
                    }
                }
            }
        }
        return attacks;
    }

    // Determine if the king of 'color' is check
    isInCheck = (color) => {
        const attackerColor = this.getOppositeColor(color);

        // Go through all squares that are under attack. Is any of them
        // the king?
        const kingPosition = this.getKingPosition(color);
        // If king is captured (theoretically)
        if(!kingPosition) {
            return true;
        }
        const attacks = this.getAttackingSquares(attackerColor);
        for (let i = 0; i < attacks.length; i++) {
            if(kingPosition.row === attacks[i].toRow &&
                kingPosition.col === attacks[i].toCol) {
                return true;
            }
        }
        return false;
    }

    // Get the valid MOVES
    getValidMoves = (color = this.turn) => {
        const validMoves = this.getAttackingSquares(color);

        // If the new location is the same color piece, make it invalid
        for (let i = validMoves.length - 1; i >= 0; i--) {
            const piece = this.board[validMoves[i].toRow][validMoves[i].toCol];
            if(piece && piece.color === color) {
                validMoves.splice(i, 1);
            }
        }

        // Try each move. If it puts own king in check, make it invalid
        for (let i = validMoves.length - 1; i >= 0; i--) {
            // Record the board
            const move = new ChessMove();
            move.record(validMoves[i].fromRow, validMoves[i].fromCol,
                this.board[validMoves[i].fromRow][validMoves[i].fromCol]
            );
            move.record(validMoves[i].toRow, validMoves[i].toCol,
                this.board[validMoves[i].toRow][validMoves[i].toCol]
            );
            // Make the move
            this.board[validMoves[i].toRow][validMoves[i].toCol] =
                this.board[validMoves[i].fromRow][validMoves[i].fromCol];
            this.board[validMoves[i].fromRow][validMoves[i].fromCol] = null;
            // If check detected, remove valid move
            if(this.isInCheck(color)) {
                validMoves.splice(i, 1);
            }
            // Undo move
            for(let i = 0; i < move.changes.length; i++) {
                this.board[move.changes[i].row][move.changes[i].col] = move.changes[i].piece;
            }
        }

        return validMoves;
    }
}
