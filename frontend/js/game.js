import { modifyMatchGame } from "./matchGame";

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
}

// Clear game: removes the game screen
export const clearGame = () => {
    // Remove all games
    document.getElementById("matchContainer").style.display = 'none';

    // Remove game div
    document.getElementById("gamePage").style.display = 'none';
}