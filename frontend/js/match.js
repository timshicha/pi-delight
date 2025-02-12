import { endTimer, showResults, startTimer } from "./game.js";
import { matchImagePaths } from "./imports/matchImports.js";

const roundUpToNearest = (number, roundTo) => {
    let add = roundTo - (number % roundTo);
    if(add === roundTo) {
        add = 0;
    }
    return number + add;
}

export const modifyMatchGame = (state, ws, username, token) => {
    // If game is over, show results
    if(state.game.gameIsOver) {
        showResults(username, state.game.players);
        document.getElementById("timerContainer").style.display = 'none';
        document.getElementById("matchPrompt").style.display = 'none';
    }
    else {
        document.getElementById("timerContainer").style.display = 'block';
        document.getElementById("matchPrompt").style.display = 'block';
    }
    console.log("modifyMatchGame:", state);
    // Make sure the right number of cards is displayed
    const matchContainer = document.getElementById("matchContainer");
    matchContainer.style.display = 'flex';
    // If we need to change the number of cards in the DOM
    const existingCardElementCount = matchContainer.children.length;
    const cardCount = state.game.visibleBoard.length;
    const expectedCardElementCount = roundUpToNearest(cardCount, 4);

    // If there are too few cards in the DOM
    if(existingCardElementCount < expectedCardElementCount) {
        // Add new cards
        for (let i = 0; i < expectedCardElementCount - existingCardElementCount; i++) {
            const newCardElement = document.createElement("div");
            newCardElement.classList.add("matchCard");
            const newCardImg = document.createElement("img");
            newCardImg.src = "/assets/questionMark.png";
            newCardImg.style.width = "100%";
            newCardImg.style.opacity = 0.2;
            newCardImg.classList.add("matchImg");
            newCardElement.appendChild(newCardImg);
            matchContainer.appendChild(newCardElement);

        }
    }
    // If there are too many cards in the DOM
    else if(existingCardElementCount > expectedCardElementCount) {
        // Remove extra cards
        for (let i = 0; i < existingCardElementCount - expectedCardElementCount; i++) {
            matchContainer.removeChild(matchContainer.lastElementChild);
        }
    }

    // Now modify each card
    for (let i = 0; i < expectedCardElementCount; i++) {
        const cardElement = matchContainer.children[i];

        // If this is a spacer or if card has been taken, make invisible
        if(i > cardCount - 1 || state.game.visibleBoard[i] === null) {
            cardElement.style.visibility = "hidden";
        }
        // Otherwise do some action
        else {
            cardElement.style.visibility = "visible";
            cardElement.onclick = () => {
                ws.send(JSON.stringify({
                    messageType: "gameMove",
                    username: username,
                    token: token,
                    game: "Match",
                    moveInfo: {
                        index: i
                    }
                }));
            };

            // If this card is covered
            if(state.game.visibleBoard[i] === -1) {
                cardElement.children[0].src = "/assets/questionMark.png";
                cardElement.children[0].style.opacity = 0.3;
            }
            // If visible
            else {
                cardElement.children[0].src = matchImagePaths[state.game.visibleBoard[i]];
                cardElement.children[0].style.opacity = 1;
            }
        }
    }
    
    const matchPrompt = document.getElementById("matchPrompt");
    // // If it's the pause in between turns, don't show turn yet
    if(state.game.turnPause) {
        endTimer();
        matchPrompt.innerText = "Starting...";
        return;
    }
    // If it's this player's turn
    if(state.game.currentTurn === username) {
        matchPrompt.innerText = "Your turn";
        if(!state.game.firstCardChosen) {
            startTimer(5, 5, true);
        }
    }
    // If it's someone else's turn
    else {
        let matchPromptMsg;
        if(state.game.currentTurn) {
            matchPromptMsg = "Current turn: " + state.game.currentTurn;
        }
        else {
            matchPromptMsg = "Starting...";
        }
        matchPrompt.innerText = matchPromptMsg;
        if(!state.game.firstCardChosen) {
            startTimer(5, 5, false);
        }
    }
}