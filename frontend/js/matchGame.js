import { showResults } from "./game";
import { matchImagePaths } from "./imports/matchImports";

const roundUpToNearest = (number, roundTo) => {
    let add = roundTo - (number % roundTo);
    if(add === roundTo) {
        add = 0;
    }
    return number + add;
}

export const modifyMatchGame = (state, ws, username, token) => {
    console.log("modifyMatchGame:", state);
    // Make sure the right number of cards is displayed
    const matchContainer = document.getElementById("matchContainer");
    matchContainer.style.display = 'flex';
    // If we need to change the number of cards in the DOM
    const existingCardElementCount = matchContainer.children.length;
    const cardCount = state.game.visibleBoard.length;
    const expectedCardElementCount = roundUpToNearest(cardCount, 4);
    console.log(state);
    console.log("html children: ", existingCardElementCount);
    console.log("should be: ", expectedCardElementCount);

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
    
    // Tell player it's their turn
    const matchPrompt = document.getElementById("matchPrompt");
    if(state.game.currentTurn === username) {
        matchPrompt.innerText = "Your turn";
    }
    else {
        matchPrompt.innerText = "";
    }

    // If game is over
    if(state.game.gameIsOver) {
        showResults(username, state.game.players);
    }
}