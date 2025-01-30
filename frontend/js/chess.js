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
    constructor (jsonString, ws=undefined, username=undefined, token=undefined) {
        this.ws = ws;
        this.username = username;
        this.token = token;
        // If we have a board to copy
        if(jsonString) {
            const obj = JSON.parse(jsonString);
            for (let i in obj) {
                this[i] = obj[i];
            }
        }
        // If starting from scratch
        else {
            this.board = [
                [{color: "black", type: "rook"}, {color: "black", type: "knight"}, {color: "black", type: "bishop"}, {color: "black", type: "queen"}, {color: "black", type: "king"}, {color: "black", type: "bishop"}, {color: "black", type: "knight"}, {color: "black", type: "rook"}],
                [{color: "black", type: "pawn"}, {color: "white", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}, {color: "black", type: "pawn"}],
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

            // If a pawn dashes forward 2, record its column
            this.pawnDash = null;

            this.elPassant = false;
        }

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
                    this.clickSquare({
                        row: tr,
                        col: td
                    });
                    return;
                }
            }
        }
    }

    overWriteBoard = (state) => {
        this.board = state.board;
        this.kingMoved = state.kingMoved;
        this.leftRookMoved = state.leftRookMoved;
        this.rightRookMoved = state.rightRookMoved;
        this.turn = state.turn;
        this.pawnDash = state.pawnDash;
        this.elPassant = state.elPassant;

        this.color = state.players[this.username].color
        console.log(this.color);

        this.selectedSquare = null;
        this.currentValidMoves = this.getValidMoves();
        this.drawBoard();
    }

    updateCredentials = (ws, username, token) => {
        this.ws = ws;
        this.username = username;
        this.token = token;
    }

    toJSON = () => {
        return JSON.stringify({
            board: this.board,
            kingMoved: this.kingMoved,
            leftRookMoved: this.leftRookMoved,
            rightRookMoved: this.rightRookMoved,
            turn: this.turn,
            pawnDash: this.pawnDash,
            elPassant: this.elPassant
        });
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
        this.boardElements[pos.row][pos.col].getElementsByTagName("img")[0].classList.add("blink-image");
        this.selectedSquare = pos;
    }

    unselectSquare = (pos) => {
        this.boardElements[pos.row][pos.col].getElementsByTagName("img")[0].classList.remove("blink-image");
        this.selectedSquare = null;
    }

    clickSquare = (pos) => {
        // If not this player's turn don't allow selection
        if(this.color !== this.turn) {
            return;
        }
        console.log("click square");
        // If selected the same square, unselect
        if(this.selectedSquare && pos.row == this.selectedSquare.row && pos.col == this.selectedSquare.col) {
            this.unselectSquare(this.selectedSquare);
            return;
        }
        // If nothing was previously selected and now clicked an empty square, ignore
        else if(!this.selectedSquare && !this.board[pos.row][pos.col]) {
            return;
        }
        // If no previous selected cell, simply select this cell
        else if(!this.selectedSquare) {
            this.selectSquare(pos);
            return;
        }
        // Otherwise, a piece was selected and a new square was just clicked.
        // Validate the move.
        const previousPos = this.selectedSquare;

        // Moves only if move is valid
        this.move(previousPos, pos);
        this.unselectSquare(previousPos);
        // Re-run click square in case user clicked on their own piece
        this.clickSquare(pos);
        return;
    }

    move = (previousPos, pos) => {
        // If it's a valid move
        if(inArray4(this.currentValidMoves, {
            fromRow: previousPos.row,
            fromCol: previousPos.col,
            toRow: pos.row,
            toCol: pos.col
        })) {
            const piece = this.board[previousPos.row][previousPos.col];
            // If pawn dash, record (for en passant possibility)
            if(piece.type === "pawn" &&
                Math.abs(pos.row - previousPos.row) === 2) {
                    this.pawnDash = pos.col;
            }
            else {
                this.pawnDash = null;
            }
            // If this was an en passant move, make sure to capture the
            // opponent piece on the side.
            // We can detect that it was an en passant if:
            // 1) The move was a pawn
            // 2) The move was diagonal
            // 3) There was not an opponent's piece in the new square
            if(piece.type === "pawn" && pos.col !== previousPos.col &&
                this.board[pos.row][pos.col] === null) {
                // Capture the opponent's pawn
                this.board[previousPos.row][pos.col] = null;
            }
            let promoteTo = null;
            // If pawn reached the end, promote it
            if(piece.type === "pawn" && (pos.row === 0 || pos.row === 7)) {
                promoteTo = prompt("promote to: ");
                if(promoteTo !== "queen" && promoteTo !== "bishop" &&
                    promoteTo !== "knight" && promoteTo !== "rook") {
                    promoteTo = "queen";
                }
                piece.type = promoteTo;
            }
            // If this was a caslte move, move the rook too
            // We can detect a castle move if the king moved two columns
            if(piece.type === "king" && Math.abs(pos.col - previousPos.col) == 2) {
                // Based on king's new position, we can determine which rook to move
                // Left rook
                if(pos.col === 2) {
                    this.board[pos.row][3] = this.board[pos.row][0];
                    this.board[pos.row][0] = null;
                }
                // Right rook
                else if(pos.col === 6) {
                    this.board[pos.row][5] = this.board[pos.row][7];
                    this.board[pos.row][7] = null;
                }
            }
            // If king or rook move, record this action to prevent future
            // castling with this piece.
            if(piece.type === "king") {
                this.kingMoved[piece.color] = true;
            }
            if((previousPos.row === 0 && previousPos.col === 0) ||
                (pos.row === 0 && pos.col === 0)) {
                    this.leftRookMoved["black"] = true;
            }
            if((previousPos.row === 0 && previousPos.col === 7) ||
                (pos.row === 0 && pos.col === 7)) {
                    this.rightRookMoved["black"] = true;
            }
            if((previousPos.row === 7 && previousPos.col === 0) ||
                (pos.row === 7 && pos.col === 0)) {
                    this.leftRookMoved["white"] = true;
            }
            if((previousPos.row === 7 && previousPos.col === 7) ||
                (pos.row === 7 && pos.col === 7)) {
                    this.rightRookMoved["white"] = true;
            }

            // Send the move to the server

            if(this.ws) {
                // Send the move
                this.ws.send(JSON.stringify({
                    messageType: "gameMove",
                    username: this.username,
                    token: this.token,
                    moveInfo: {
                        fromRow: previousPos.row,
                        fromCol: previousPos.col,
                        toRow: pos.row,
                        toCol: pos.col,
                        promoteTo: promoteTo
                    }
                }));
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
    getAttackingSquares = (color, includePawnAttacks=true) => {
        const attacks = [];

        // Go through each square on the board to look for pieces
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                let piece = this.board[row][col];

                // If there's a piece and it's of this color
                if(piece && piece.color === color) {
                    // See what squares it is attacking

                    // If it's a pawn
                    if(piece.type === "pawn" && includePawnAttacks) {
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

    getValidPawnMoves = (color) => {
        const validMoves = [];
        // Depending on color, the direction of the pawns changes
        let d = -1;
        if(color === "black") {
            d = 1;
        }
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                let piece = this.board[row][col];
                if(piece && piece.type === "pawn" && piece.color === color) {
                    const oneAhead = this.getPieceWithCoords(row + d, col);
                    // Only add if there's a square ahead an it's empty
                    if(oneAhead === null) {
                        validMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: row + d,
                            toCol: col
                        });
                        const twoAhead = this.getPieceWithCoords(row + 2 * d, col);
                        // If pawn is still in original row
                        if(((color === "white" && row === 6) ||
                            (color === "black" && row === 1)) &&
                            twoAhead === null) {
                            validMoves.push({
                                fromRow: row,
                                fromCol: col,
                                toRow: row + 2 * d,
                                toCol: col
                            });
                        }
                    }

                    // Add the capture moves
                    const leftCapturePiece = this.getPieceWithCoords(row + d, col - 1);
                    const rightCapturePiece = this.getPieceWithCoords(row + d, col + 1);
                    // If there's a piece and it's of the opposite color, allow capture
                    if(leftCapturePiece) {
                        validMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: row + d,
                            toCol: col - 1
                        });
                    }
                    if(rightCapturePiece) {
                        validMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: row + d,
                            toCol: col + 1
                        });
                    }

                    // If double dash, check for en passant
                    if(this.pawnDash !== null) {
                        if(color === "white" && row === 3 && Math.abs(this.pawnDash - col) === 1) {
                            validMoves.push({
                                fromRow: row,
                                fromCol: col,
                                toRow: 2,
                                toCol: this.pawnDash
                            });
                        }
                        if(color === "black" && row === 4 && Math.abs(this.pawnDash - col) === 1) {
                            validMoves.push({
                                fromRow: row,
                                fromCol: col,
                                toRow: 5,
                                toCol: this.pawnDash
                            });
                        }
                    }
                }
            }
        }
        return validMoves;
    }

    // Get the valid MOVES
    getValidMoves = (color = this.turn) => {
        let  validMoves = this.getAttackingSquares(color, false);
        validMoves = validMoves.concat(this.getValidPawnMoves(color));

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
            // If en passant, also remove opponent piece
            let enPassant = false;
            const piece = this.board[validMoves[i].fromRow][validMoves[i].fromCol];
            if(piece.type === "pawn" && validMoves[i].fromCol !== validMoves[i].toCol &&
                this.board[validMoves[i].toRow][validMoves[i].toCol] === null) {
                enPassant = true;
                move.record(validMoves[i].fromRow, validMoves[i].toCol,
                    this.board[validMoves[i].fromRow][validMoves[i].toCol]
                );
            }

            // Make the move
            this.board[validMoves[i].toRow][validMoves[i].toCol] =
                this.board[validMoves[i].fromRow][validMoves[i].fromCol];
            this.board[validMoves[i].fromRow][validMoves[i].fromCol] = null;
            // If el passant, remove pawn
            if(enPassant) {
                this.board[validMoves[i].fromRow][validMoves[i].toCol] = null;
            }
            // If check detected, remove valid move
            if(this.isInCheck(color)) {
                validMoves.splice(i, 1);
            }
            // Undo move
            for(let i = 0; i < move.changes.length; i++) {
                this.board[move.changes[i].row][move.changes[i].col] = move.changes[i].piece;
            }
        }

        // Now check castle moves (if king hasn't moved)
        if(!this.kingMoved[color]) {
            let row = 0;
            if(color === "white") {
                row = 7;
            }
            // Check left rook castle. Conditions:
            // Left rook hasn't moved
            // There are no pieces between king and rook
            // King is not in check
            // Square king moves through is not in check
            // Square king ends in is not in check
            if(!this.leftRookMoved[color] &&
                this.board[row][1] === null &&
                this.board[row][2] === null &&
                this.board[row][3] === null) {
                // Make sure there's no checks in castle path
                let checkDetected = false;
                // Is king already in check?
                checkDetected = this.isInCheck(color);
                // Would king be in check in next square?
                if(!checkDetected) {
                    this.board[row][3] = this.board[row][4];
                    this.board[row][4] = null;
                    checkDetected = checkDetected || this.isInCheck(color);
                    this.board[row][4] = this.board[row][3];
                    this.board[row][3] = null;
                }
                // Would king be in check in final square?
                if(!checkDetected) {
                    this.board[row][2] = this.board[row][4];
                    this.board[row][4] = null;
                    checkDetected = checkDetected || this.isInCheck(color);
                    this.board[row][4] = this.board[row][2];
                    this.board[row][2] = null;
                }
                // If no check was detected, castle is a valid move
                if(!checkDetected) {
                    validMoves.push({
                        fromRow: row,
                        fromCol: 4,
                        toRow: row,
                        toCol: 2
                    });
                }
            }
            // Check right rook castle. Conditions:
            // Right rook hasn't moved
            // There are no pieces between king and rook
            // King is not in check
            // Square king moves through is not in check
            // Square king ends in is not in check
            if(!this.rightRookMoved[color] &&
                this.board[row][6] === null &&
                this.board[row][5] === null) {
                // Make sure there's no checks in castle path
                let checkDetected = false;
                // Is king already in check?
                checkDetected = this.isInCheck(color);
                // Would king be in check in next square?
                if(!checkDetected) {
                    this.board[row][5] = this.board[row][4];
                    this.board[row][4] = null;
                    checkDetected = checkDetected || this.isInCheck(color);
                    this.board[row][4] = this.board[row][5];
                    this.board[row][5] = null;
                }
                // Would king be in check in final square?
                if(!checkDetected) {
                    this.board[row][6] = this.board[row][4];
                    this.board[row][4] = null;
                    checkDetected = checkDetected || this.isInCheck(color);
                    this.board[row][4] = this.board[row][6];
                    this.board[row][6] = null;
                }
                // If no check was detected, castle is a valid move
                if(!checkDetected) {
                    validMoves.push({
                        fromRow: row,
                        fromCol: 4,
                        toRow: row,
                        toCol: 6
                    });
                }
            }
        }

        return validMoves;
    }
}
