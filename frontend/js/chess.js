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
const validatePositionWithOffset = (pos, rowChange, colChange) => {
    const newPos = {
        row: pos.row + rowChange,
        col: pos.col + colChange
    };
    return validatePosition(newPos);
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
        
        this.kingPos = {
            "white": {row: 7, col: 4},
            "black": {row: 0, col: 4}
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

    swapTurn = () => {
        if(this.turn === "white") {
            this.turn = "black";
        }
        else {
            this.turn = "white";
        }
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
            if(validatePosition(newMove)) {
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

    getKingMoves = (pos) => {
        const moves = [
            {row: -1, col: 0},
            {row: -1, col: 1},
            {row: 0, col: 1},
            {row: 1, col: 1},
            {row: 1, col: 0},
            {row: 1, col: -1},
            {row: 0, col: -1},
            {row: -1, col: -1}
        ];
        // Add the valid moves
        const currentPiece = this.board[pos.row][pos.col];
        let validMoves = [];
        for (let i = 0; i < moves.length; i++) {
            let newMove = sumArrays(pos, moves[i]);
            // If it's a valid position on the chessboard and not
            // of the same color, add it
            if(validatePosition(newMove) &&
                (!this.board[newMove.row][newMove.col] || (this.board[newMove.row][newMove.col].color !== currentPiece.color))) {
                validMoves.push(newMove);
            }
        }

        // If the king hasn't moved, consider castle moves
        if(!this.kingMoved[currentPiece.color]) {
            // If left rook hasn't moved and there are no pieces
            // in between, allow left castle
            if(!this.leftRookMoved[currentPiece.color] &&
                !this.board[pos.row][1] &&
                !this.board[pos.row][2] &&
                !this.board[pos.row][3]) {
                validMoves.push({row: pos.row, col: 2});
            }
            // If right rook hasn't moved and there are no pieces
            // in between, allow right castle
            if(!this.rightRookMoved[currentPiece.color] &&
                !this.board[pos.row][5] &&
                !this.board[pos.row][6]) {
                validMoves.push({row: pos.row, col: 6});
            }
        }

        return validMoves;
    }

    getPawnMoves = (pos) => {
        const validMoves = [];
        // Color matters for pawn moves
        // Black pawns move toward the bottom of the board
        // White pawns move toward the top of the board
        // Color coefficient (-1 for black, 1 for white)
        const currentPiece = this.board[pos.row][pos.col];
        let ca = -1;
        if(currentPiece.color === "white") {
            ca = 1;
        }

        // If on last row, return
        if(currentPiece.color === "white" && pos.row === 0) {
            return [];
        }
        else if(currentPiece.color === "white" && pos.row === 7) {
            return [];
        }

        // If square ahead is empty
        if(!this.board[pos.row - 1 * ca][pos.col]) {
            validMoves.push({row: pos.row - 1 * ca, col: pos.col})
        }

        // If pawn hasn't been moved, allow two moves ahead
        if((currentPiece.color === "white" && pos.row === 6) ||
            (currentPiece.color === "black" && pos.row === 1)) {
            // Make sure both squares ahead are empty
            if(!this.board[pos.row - 1 * ca][pos.col] &&
                !this.board[pos.row - 2 * ca][pos.col]) {
                    validMoves.push({row: pos.row - 2 * ca, col: pos.col});
                }
        }


        // If there's an opposite color piece diagonally ahead (capture)
        let diagonalPiece;
        // Diagonal left
        diagonalPiece = this.board[pos.row - 1 * ca][pos.col - 1];
        if(diagonalPiece && diagonalPiece.color !== currentPiece.color) {
            validMoves.push({row: pos.row - 1 * ca, col: pos.col - 1})
        }
        // Diagonal right
        diagonalPiece = this.board[pos.row - 1 * ca][pos.col + 1];
        if(diagonalPiece && diagonalPiece.color !== currentPiece.color) {
            validMoves.push({row: pos.row - 1 * ca, col: pos.col + 1})
        }

        // Check special move: el passant
        // See if an opponent moved their pawn forward 2
        if(this.prevMove.pawnDouble) {
            // If this pawn is in the same row
            if(this.prevMove.pos.row === pos.row) {
                // If to the left
                if(this.prevMove.pos.col === pos.col - 1) {
                    validMoves.push({row: pos.row - 1 * ca, col: pos.col - 1});
                }
                // If to the right
                else if(this.prevMove.pos.col === pos.col + 1) {
                    validMoves.push({row: pos.row - 1 * ca, col: pos.col + 1});
                }
            }
        }
        console.log(validMoves);
        return validMoves;
    }

    // Determine if a square is under attack by player of 'color'
    isUnderAttack = (pos, color) => {
        
        let piece = null;
        // CHECK PAWN ATTACKS
        // Black pawns attack from row - 1
        // White pawns attack from row + 1
        let rowIncrease = -1;
        if(color === "white") {
            rowIncrease = 1;
        }
        // If top left is valid square
        if(validatePositionWithOffset(pos, rowIncrease, -1)) {
            piece = this.board[pos.row + rowIncrease][pos.col - 1];
            if(piece && piece.type === "pawn" && piece.color === color) {
                return true;
            }
        }
        // If top right is valid square
        if(validatePositionWithOffset(pos, rowIncrease, 1)) {
            piece = this.board[pos.row + rowIncrease][pos.col + 1];
            if(piece && piece.type === "pawn" && piece.color === color) {
                return true;
            }
        }

        // CHECK KNIGHT ATTACKS
        const knightMoves = this.getKnightMoves(pos);
        // For each of the knight moves, check is there's a knight
        for (let i = 0; i < knightMoves.length; i++) {
            piece = this.board[knightMoves[i].row][knightMoves[i].col];
            if(piece && piece.type === "knight" && piece.color === color) {
                return true;
            }
        }
    }

    // See if a king is in check
    detectCheck = (color) => {

    }

    movePiece = (pos1, pos2) => {
        // Check for turn
        let piece = this.board[pos1.row][pos1.col];
        if(!piece || piece.color !== this.turn) {
            return false;
        }
        let validMove = false;
        let kingMove = false;
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
        else if(piece.type === "king") {
            kingMove = true;
            console.log("king attempt");
            if(inArray(this.getKingMoves(pos1), pos2)) {
                // If king moved to a square that's under attack
                if(this.isUnderAttack(pos2, this.getOppositeColor(this.turn))) {
                    validMove = false;
                }
                else {
                    validMove = true;
                }
            }
        }
        else if(piece.type === "pawn") {
            console.log("pawn attempt");
            if(inArray(this.getPawnMoves(pos1), pos2)) {
                validMove = true;
            }
        }
        else {
            validMove = true;
        }
        // Make sure move is valid and there's no same color piece there
        if(validMove) {
            // Make sure own king was not put into check

            // If either pos1 or pos2 is in a corner, prevent future
            // castling with that rook
            if((pos1.row === 0 && pos1.col === 0) || (pos2.row === 0 && pos2.col === 0)) {
                this.leftRookMoved["black"] = true;
            }
            else if((pos1.row === 0 && pos1.col === 7) || (pos2.row === 0 && pos2.col === 7)) {
                this.rightRookMoved["black"] = true;
            }
            else if((pos1.row === 7 && pos1.col === 0) || (pos2.row === 7 && pos2.col === 0)) {
                this.leftRookMoved["white"] = true;
            }
            else if((pos1.row === 7 && pos1.col === 7) || (pos2.row === 7 && pos2.col === 7)) {
                this.leftRookMoved["white"] = true;
            }

            // If either pos1 or pos2 is in king's square, prevent future castling
            if((pos1.row === 0 && pos1.col === 4) || (pos2.row === 0 && pos2.col === 4)) {
                this.kingMoved["white"] = true;
            }
            else if((pos1.row === 7 && pos1.col === 4) || (pos2.row === 7 && pos2.col === 4)) {
                this.kingMoved["black"] = true;
            }

            // If pawn moved forward 2
            if(piece.type === "pawn" && Math.abs(pos2.row - pos1.row) == 2) {
                this.prevMove.pawnDouble = true;
                this.prevMove.color = piece.color;
                this.prevMove.pos = pos2;
            }
            else {
                this.prevMove.pawnDouble = false;
            }

            // If el passant move.
            // It's an el passant move if it's a pawn that changed columns and
            // jumped on a square that did not have a piece.
            if(piece.type === "pawn" && pos1.col !== pos2.col && !this.board[pos2.row][pos2.col]) {
                // Capture piece
                this.board[pos1.row][pos2.col] = null;
            }

            // If a king move, see if it's a castle move
            if(kingMove) {
                // If castle move, move rook as well
                if(Math.abs(pos1.col - pos2.col) === 2) {
                    // Black left castle
                    if(pos2.row === 0 && pos2.col === 2) {
                        this.board[0][3] = this.board[0][0];
                        this.board[0][0] = null;
                    }
                    // Black right castle
                    else if(pos2.row === 0 && pos2.col === 6) {
                        this.board[0][5] = this.board[0][7];
                        this.board[0][7] = null;
                    }
                    // White left castle
                    else if(pos2.row === 7 && pos2.col === 2) {
                        this.board[7][3] = this.board[7][0];
                        this.board[7][0] = null;
                    }
                    // White right castle
                    else if(pos2.row === 7 && pos2.col === 6) {
                        this.board[7][5] = this.board[7][7];
                        this.board[7][7] = null;
                    }
                }
            }
            this.board[pos2.row][pos2.col] = this.board[pos1.row][pos1.col];
            this.board[pos1.row][pos1.col] = null;
            this.swapTurn();
            this.drawBoard();
            console.log(this.prevMove);
            return true;
        }
        return false;
    }
}
