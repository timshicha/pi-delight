import { showLobby } from "./lobby.js";
import { modifyMatchGame } from "./match.js";
import { modifyShooterGame } from "./shooterGame.js";
import { requestRefresh } from "./script.js";

// Modify match game page
export const modifyGame = (inGame, gameType, state, ws, username, token) => {
    const gamePageDiv = document.getElementById("gamePage");
    // If not in game
    if(!inGame) {
        gamePageDiv.style.display = 'none';
        return;
    }
    gamePageDiv.style.display = 'block';
    if(gameType === 'Match') {
        modifyMatchGame(state, ws, username, token);
    }
    else if(gameType === 'Shooter Game') {
        modifyShooterGame(state, ws, username, token);
    }
}

// Clear game: removes the game screen
export const clearGame = () => {
    // Remove all games
    document.getElementById("matchContainer").style.display = 'none';

    // Remove game div
    document.getElementById("gamePage").style.display = 'none';
}

const createPlayerResultDiv = (number, username, score) => {
    const playerResultDiv = document.createElement("div");
    const playerResultNumber = document.createElement("div");
    const playerResultUsername = document.createElement("div");
    const playerResultScore = document.createElement("div");
    playerResultDiv.classList.add("playerResultDiv");
    playerResultNumber.classList.add("playerResultNumber");
    playerResultUsername.classList.add("playerResultUsername");
    playerResultScore.classList.add("playerResultScore");
    playerResultNumber.innerText = number + ".";
    playerResultUsername.innerText = username;
    playerResultScore.innerText = score;
    playerResultDiv.replaceChildren(playerResultNumber, playerResultUsername, playerResultScore);
    return playerResultDiv;
}

// Show the screen with results (scored, rankings, etc)
// sort: auto-sort the players by score
export const showResults = (username, data, sort = true) => {
    console.log("show results");
    const gameResultsDiv = document.getElementById("gameResultsDiv");
    // If no data, just make results div visible (old data)
    if(!data) {
        gameResultsDiv.style.display = 'block';
    }

    if(sort) {
        data.sort((a, b) => (b.score - a.score));
    }

    // Clear children
    const playerResultContainer = document.getElementById("playerResultContainer");
    playerResultContainer.replaceChildren();
    // For each player, show their score
    for (let i = 0; i < data.length; i++) {
        const playerResultDiv = createPlayerResultDiv(i + 1, data[i].username, data[i].score);
        if(username === data[i].username) {
            playerResultDiv.classList.add("yellowBg");
        }
        playerResultContainer.appendChild(playerResultDiv);
    }

    gameResultsDiv.style.display = 'block';

    // Hide the leave game button
    document.getElementById("leaveGameBtn").style.display = 'none';
}

// Close the results window and send user back to lobby
export const closeResults = () => {
    console.log("close results");
    document.getElementById("gameResultsDiv").style.display = 'none';
}
document.getElementById("closeResultsBtn").onclick = () => {
    closeResults();
    showLobby();
    requestRefresh();
}

var timerIntervalID = null;
const timerUpdateInterval = 50; // Update timer bar every 50 ms
// playerInFocus: if true, it is this player's turn. Make the bar
// colorful instead of gray
export const startTimer = (currentTime, totalTime, playerInFocus=false) => {
    const timerBar = document.getElementById("timerBar");
    if(playerInFocus) {
        timerBar.style.backgroundColor = 'rgb(0, 220, 0)';
    }
    else {
        timerBar.style.backgroundColor = 'gray';
    }
    let width = (currentTime / totalTime) * 100;
    const duration = currentTime * 1000
    const step = (100 / duration) * timerUpdateInterval
    clearInterval(timerIntervalID);

    // Reset the width of the timer bar without effect
    timerBar.style.transition = '';
    timerBar.style.width = width + '%';
    timerBar.style.transition =
        'width ' + parseInt(timerUpdateInterval / 1000)+ 's linear';
    
    timerIntervalID = setInterval(() => {
        if(width <= 0) {
            clearInterval(timerIntervalID);
        }
        else {
            width -= step;
            timerBar.style.width = width + '%';
        }
    }, timerUpdateInterval);
}

export const endTimer = () => {
    clearInterval(timerIntervalID);
    const timerBar = document.getElementById("timerBar");
    timerBar.style.transition = '';
    timerBar.style.width = '0%';
    timerBar.style.transition =
        'width ' + parseInt(timerUpdateInterval / 1000)+ 's linear';
}

export const leaveGame = (ws, username, token) => {
    ws.send(JSON.stringify({
        messageType: 'leaveGame',
        username: username,
        token: token
    }));
}