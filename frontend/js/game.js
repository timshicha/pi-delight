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