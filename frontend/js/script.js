import PiDelightSocket from "./PiDelightSocket.js";
import { generateNavbarIcons, generateNoUsersHtml, generateUserHtml } from "./home.js";
import { modifyLobby, modifyInvitePlayersList, modifyLobbyButtons, showLobby, hideLobby } from "./lobby.js";
import { clearGame, closeResults, modifyGame, leaveGame } from "./game.js";
import { ChessBoard } from "./chess.js";

const HOST = import.meta.env.VITE_DEV_SERVER_HOST;
const PORT = import.meta.env.VITE_DEV_SERVER_PORT;

var currentPage = 'register';
// Possible states:
// - register
// - lobby
// - game

// On page load, they're not logged in.
localStorage.setItem("loggedIn", false);

var ws = new PiDelightSocket(HOST, PORT);
ws.connect(() => {});
ws.ws.onmessage = (event) => wsOnMessage(event);

var username;
var token;
var playerIcon = "grayPlayer";

// Who the most recent invite is from
var mostRecentInviteFrom = null;

// Server Update ID's.
// When a list of something periodically requested (like users online list)
// changes, the server will change the ID of the list. If the client requests
// for the same list with the same ID, the server won't send a response since
// the ID did not change and the list is still the same.
var lastUserListId = -1;
var usersOnline = [];
var invited = [];
var inGame = false;
var playersInLobby = [];
var currentGameType = null;
var navbarExtended = false;

// This is what needs to be done when there's a message from the server
const wsOnMessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    if(data.messageType === "logout") {
        localStorage.clear();
        username = null;
        token = null;
        lastUserListId = -1;
        inGame = false;
        modifyLobbyButtons(false);
    }

    else if(data.messageType === "createUser") {
        if(data.error) {
            console.log(data.error);
            document.getElementById("usernameInputError").innerText = data.error;
        }
        else {
            username = data.username;
            token = data.token;
            localStorage.setItem("username", data.username);
            localStorage.setItem("token", data.token);
            localStorage.setItem("loggedIn", true);
            currentPage = 'home';
            modifyLobby();
            updatePage();
            requestRefresh();
            updateNavbarExtension();
        }
    }

    else if(data.messageType === "validateUser") {
        if(data.error) {
            console.log(data.error);
            currentPage = 'register';
            updatePage();
        }
        else {
            console.log("Logged in.");
            username = data.username;
            token = localStorage.getItem("token");
            localStorage.setItem("loggedIn", true);
            currentPage = 'home';
            // After user has been validated, request a refresh of data
            updatePage();
            requestRefresh();
            updateNavbarExtension();
        }
    }

    else if(data.messageType === "usersOnline") {
        usersOnline = JSON.parse(data.users);
        lastUserListId = data.lastUserListId;
        // Remove yourself from the list
        delete usersOnline[username]; 
        const usernames = Object.keys(usersOnline);
        let usersOnlineList = document.getElementById("usersOnlineList");
        usersOnlineList.replaceChildren();

        if(currentPage === 'home') {
            for (let i = 0; i < usernames.length; i++) {
                usersOnlineList.appendChild(generateUserHtml(usernames[i], usersOnline[usernames[i]].status));
            }
            if(usernames.length === 0) {
                usersOnlineList.appendChild(generateNoUsersHtml());
            }
        }
        // Otherwise generate HTML for lobby invites
        modifyInvitePlayersList(usersOnline, invited, playersInLobby, ws, username, token);
    }
    else if(data.messageType === 'invite') {
        mostRecentInviteFrom = data.from;
        showInvite();
    }

    else if(data.messageType === 'refresh') {
        // Update icon
        playerIcon = data.playerIcon;
        // If not in lobby
        if(!data.inLobby) {
            currentPage = 'home';
            modifyLobby();
            updatePage();
        }
        // If in lobby but not in game
        else if(!data.inGame) {
            currentPage = 'lobby';
            invited = data.invited;
            playersInLobby = data.state.players || [];
            modifyLobby(playersInLobby, data.state.icons, 4, username, kickFunction);
            modifyInvitePlayersList(usersOnline, invited, playersInLobby, ws, username, token);
            updatePage();
        }
        // If in game
        else {
            currentPage = 'game';
            currentGameType = data.gameType;
            hideLobby();
            modifyGame(true, data.gameType, data.state, ws, username, token);
            updatePage();
        }

        // If sending player back to lobby
        if(data.backToLobby == true) {
            closeResults();
            if(data.inLobby && !data.inGame) {
                showLobby();
            }
            updatePage();
        }
    }

    else if(data.messageType === 'join') {
        if(data.error) {
            showError(data.error);
        }
    }

    else if(data.messageType === 'leaveGame') {
        if(data.kicked) {
            showError(data.message);
        }
        requestRefresh();
        clearGame();
    }

    else if(data.messageType === "loggedOut") {
        localStorage.setItem("loggedIn", false);
        currentPage = 'register';
        updatePage();
    }
}

// When websocket connects, attempt to log in
ws.ws.onopen = () => {
    // If user already made a username, they should have a username and
    // token stored in their local storage.
    // Attempt to validate user
    let username = localStorage.getItem("username");
    let token = localStorage.getItem("token");
    console.log(username);
    if(username) {
        ws.send(JSON.stringify({
            messageType: "validateUser",
            username: username,
            token: token
        }));
    }
}

// Keep track of what intervals were set.
// If another invite comes in, clear the previous invite's intervals
// so they don't interfere with each other and glitch.
var inviteBoxIntervalIds = [null, null, null];
const clearShowInviteIntervals = () => {
    for (let i = 0; i < inviteBoxIntervalIds.length; i++) {
        clearInterval(inviteBoxIntervalIds[i]);
    }
}
// Add event listeners for the invite pop-up.
document.getElementById("acceptInviteBtn").addEventListener('click', () => {
    acceptInvite();
    inviteBox.style.display = 'none';
    inviteBox.style.opacity = 0;
});
document.getElementById("declineInviteBtn").addEventListener('click', () => {
    declineInvite();
    inviteBox.style.display = 'none';
    inviteBox.style.opacity = 0;
});
const showInvite = (from) => {
    clearShowInviteIntervals();
    let inviteBox = document.getElementById("inviteBox");
    document.getElementById("invitePrompt").innerText = `${mostRecentInviteFrom} invited you.`;

    // Start fading in
    inviteBox.style.opacity = 0;
    inviteBox.style.display = 'block';
    let opacity = 0;
    inviteBoxIntervalIds[0] = setInterval(() => {
        if(opacity >= 1) {
            clearInterval(inviteBoxIntervalIds[0]);
            inviteBoxIntervalIds[1] = setTimeout(fadeOut, 5000);
        }
        else {
            opacity += 0.1;
            inviteBox.style.opacity = opacity;
        }
    }, 50);

    const fadeOut = () => {
        let opacity = 1;
        inviteBoxIntervalIds[2] = setInterval(() => {
            if(opacity <= 0) {
                clearInterval(inviteBoxIntervalIds[2]);
                inviteBox.style.display = 'none';
            }
            else {
                opacity -= 0.1;
                inviteBox.style.opacity = opacity;
            }
        }, 50);
    }
}
var errorBoxIntervalIds = [null, null, null];
const clearShowErrorIntervals = () => {
    for (let i = 0; i < errorBoxIntervalIds.length; i++) {
        clearInterval(errorBoxIntervalIds[i]);
    }
}
const showError = (errorMessage) => {
    clearShowErrorIntervals();
    let inviteBox = document.getElementById("errorBox");
    document.getElementById("errorPrompt").innerText = errorMessage;
    // Start fading in
    errorBox.style.opacity = 0;
    errorBox.style.display = 'block';
    let opacity = 0;
    errorBoxIntervalIds[0] = setInterval(() => {
        if(opacity >= 1) {
            clearInterval(errorBoxIntervalIds[0]);
            errorBoxIntervalIds[1] = setTimeout(fadeOut, 2000);
        }
        else {
            opacity += 0.1;
            errorBox.style.opacity = opacity;
        }
    }, 50);

    const fadeOut = () => {
        let opacity = 1;
        errorBoxIntervalIds[2] = setInterval(() => {
            if(opacity <= 0) {
                clearInterval(errorBoxIntervalIds[2]);
                errorBox.style.display = 'none';
            }
            else {
                opacity -= 0.1;
                errorBox.style.opacity = opacity;
            }
        }, 50);
    }
}

const kickFunction = (usernameToKick) => {
    ws.send(JSON.stringify({
        messageType: 'kick',
        username: username,
        token: token,
        usernameToKick: usernameToKick
    }));
}

const acceptInvite = () => {
    ws.send(JSON.stringify({
        messageType: 'join',
        username: username,
        token: token,
        player: mostRecentInviteFrom
    }));
}

const declineInvite = () => {
    clearShowInviteIntervals();
    document.getElementById("inviteBox").style.display = 'none';
}

const updatePlayerIcon = () => {
    document.getElementById("navbarPlayerIcon").src =
        `/assets/playerIcons/${playerIcon}.png`;
}

const clearPages = () => {
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("homePage").style.display = "none";
    document.getElementById("lobbyPage").style.display = "none";
    document.getElementById("gamePage").style.display = "none";
    document.getElementById("navbar").style.display = "none";
    lastUserListId = -1;
}

const clearGames = () => {
    document.getElementById("matchDiv").style.display = "none";
    document.getElementById("shooterGameDiv").style.display = "none";
    document.getElementById("chessDiv").style.display = "none";
}

export const updatePage = (newPage = null) => {
    if(newPage) {
        currentPage = newPage;
    }
    clearPages();
    if(currentPage === 'register') {
        document.getElementById("registerPage").style.display = "block";
    }
    else if(currentPage === 'game') {
        document.getElementById("gamePage").style.display = "block";
        clearGames();
        if(currentGameType === "Match") {
            document.getElementById("matchDiv").style.display = "block";
            document.getElementById("leaveGameBtn").style.display = "block";
        }
        else if(currentGameType === "Shooter Game") {
            document.getElementById("shooterGameDiv").style.display = "block";
            document.getElementById("leaveGameBtn").style.display = "none";
        }
        else if(currentGameType === "Chess") {
            document.getElementById("chessDiv").style.display = "block";
            document.getElementById("leaveGameBtn").style.display = "block";
        }
    }
    // If home or lobby
    else {
        // Show lobby element even if the user is at home because the lobby
        // element is what allows users to join a lobby.
        document.getElementById("lobbyPage").style.display = "block";
        document.getElementById("navbar").style.display = "block";
        document.getElementById("navbarUsername").innerText = username;
        updatePlayerIcon();
        // If home, also show home stuff
        if(currentPage === 'home') {
            document.getElementById("homePage").style.display = "block";
        }
        // If lobby
        else {
            document.getElementById("homePage").style.display = "none";
        }
    }
}

// Every second (or so), send update requests to the server based on what
// page the user in on.
const requestUpdates = () => {
    if(currentPage !== 'register') {
        ws.send(JSON.stringify({
            messageType: "usersOnline",
            username: username,
            token: token,
            lastUserListId: lastUserListId
        }));
    }
}

export const requestRefresh = () => {
    ws.send(JSON.stringify({
        messageType: 'refresh',
        username: username,
        token: token
    }));
}

const logout = () => {
    ws.send(JSON.stringify({
        messageType: 'logout'
    }));
}

const requestUpdatesIntervalId = setInterval(requestUpdates, 1000);

window.addEventListener('beforeunload', () => {
    clearInterval(requestUpdatesIntervalId);
});

// Since this is one page, rewrite the back button to go back in the game
// rather than back to previous url.
window.onpopstate = (event) => {
    if(currentPage === 'match') {
        currentPage = 'lobby';
        updatePage();
        event.preventDefault();
    }
}

document.getElementById("registerForm").addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById("usernameInput").value;
    ws.send(JSON.stringify({
        messageType: "createUser",
        username: username
    }));
});

document.getElementById("createMatchGameBtn").addEventListener('click', () => {
    ws.send(JSON.stringify({
        messageType: 'createGame',
        username: username,
        token: token,
        game: 'Match'
    }));
});

document.getElementById("leaveMatchGameBtn").addEventListener('click', () => {
    ws.send(JSON.stringify({
        messageType: 'leaveGame',
        username: username,
        token: token
    }));
});

document.getElementById("startGameBtn").addEventListener('click', () => {
    const game = document.getElementById("gameSelectDropdown").value;
    ws.send(JSON.stringify({
        messageType: 'startGame',
        username: username,
        token: token,
        game: game
    }));
});

document.getElementById("leaveGameBtn").onclick = () => {
    leaveGame(ws, username, token);
}

// Show or hide the extended navbar based on current navbar state
const updateNavbar = () => {
    if(navbarExtended) {
        document.getElementById("navbarExtension").style.display = 'block';
    }
    else {
        document.getElementById("navbarExtension").style.display = 'none';
    }
}

const closeNavbar = () => {
    navbarExtended = false;
    updateNavbar();
}

// When the user clicks their player icon in the navbar, extend the
// navbar down to allow them to change their icon. If the navbar is
// already extended, collapse the extended navbar and keep the previous
// icon.
document.getElementById("navbarPlayerIcon").onclick = () => {
    navbarExtended = !navbarExtended;
    updateNavbar();
};

// Call this when the username and token are changed
const updateNavbarExtension = () => {
    // Generate icon buttons in the extended navbar
    document.getElementById("navbarExtension").replaceChildren(generateNavbarIcons(ws, username, token, closeNavbar));
}
updateNavbarExtension(username, token);

let chess = new ChessBoard();
chess.drawBoard();