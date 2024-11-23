import PiDelightSocket from "./PiDelightSocket.js";
import { generateNoUsersHtml, generateUserHtml } from "./homePageHtml.js";
import { matchImagePaths } from "/js/imports/matchImports.js";
import { modifyLobby, generateInvitePlayerHtml } from "./lobbyHtml.js";

const HOST = '192.168.0.23';
const PORT = 80;

var currentPage = 'register';
// Possible states:
// - home
// - register

// On page load, they're not logged in.
localStorage.setItem("loggedIn", false);

var ws = new PiDelightSocket(HOST, PORT);
ws.connect(() => {});
ws.ws.onmessage = (event) => wsOnMessage(event);

var username;
var token;
// Server Update ID's.
// When a list of something periodically requested (like users online list)
// changes, the server will change the ID of the list. If the client requests
// for the same list with the same ID, the server won't send a response since
// the ID did not change and the list is still the same.
var lastUserListId = -1;
var usersOnline = [];

// This is what needs to be done when there's a message from the server
const wsOnMessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    if(data.messageType === "logout") {
        localStorage.clear();
        username = null;
        token = null;
        lastUserListId = -1;
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
            console.log("User created");
            currentPage = 'home';
            updatePage();
        }
    }

    else if(data.messageType === "validateUser") {
        if(data.error) {
            console.log(data.error);
        }
        else {
            console.log("Logged in.");
            username = localStorage.getItem("username");
            token = localStorage.getItem("token");
            localStorage.setItem("loggedIn", true);
            // currentPage = 'home';
            currentPage = 'match';
            updatePage();
        }
    }

    else if(data.messageType === "usersOnline") {
        let usersOnlineTemp = JSON.parse(data.users);
        lastUserListId = data.lastUserListId;
        // Remove yourself from the list
        const index = usersOnlineTemp.indexOf(username);
        if(index > -1) {
            usersOnlineTemp.splice(index, 1);
        }
        usersOnline = usersOnlineTemp;
        let usersOnlineHtml = "";

        // If on home screen, generate HTML for users online.
        if(currentPage === 'home') {
            for (let i = 0; i < usersOnline.length; i++) {
                usersOnlineHtml += generateUserHtml(usersOnline[i]);
            }
            if(usersOnline.length === 0) {
                usersOnlineHtml = generateNoUsersHtml();
            }
            document.getElementById("usersOnlineContainer").innerHTML = usersOnlineHtml;
        }
        // Otherwise generate HTML for lobby invites
        let invitePlayersHTML = "";
        for (let i = 0; i < usersOnline.length; i++) {
            invitePlayersHTML += generateInvitePlayerHtml(usersOnline[i], false);
        }
        document.getElementById("lobbyInvitePlayersDiv").innerHTML = invitePlayersHTML;
        // For each player, attach a function that sends a request
        for (let i = 0; i < usersOnline.length; i++) {
            document.getElementById(`invitePlayerButton${usersOnline[i]}`).addEventListener('click', () => {
                // Send request
                ws.send(JSON.stringify({
                    messageType: 'invite',
                    username: username,
                    token: token,
                    game: 'Match',
                    to: usersOnline[i]
                }));
            });
        }
    }

    else if(data.messageType === 'invite') {
        showInvite(data.from, data.game);
    }

    else if(data.messageType === 'gameUpdate') {
        let gameState = data.gameState;
        modifyLobby(gameState.players, 4, username, gameState.admin, kickFunction);
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
const showInvite = (from, game) => {
    clearShowInviteIntervals();
    console.log("here");
    let inviteBox = document.getElementById("inviteBox");
    document.getElementById("invitePrompt").innerText = `${from} invited you to play ${game}!`;
    document.getElementById("acceptInviteBtn").addEventListener('click', () => {
        acceptInvite(from, game);
    });
    document.getElementById("declineInviteBtn").addEventListener('click', declineInvite);
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

const kickFunction = (usernameToKick) => {
    console.log('kick');
    ws.send(JSON.stringify({
        messageType: 'kick',
        username: username,
        token: token,
        usernameToKick: usernameToKick
    }));
}

const acceptInvite = (from, game) => {
    console.log("accepted");
    ws.send(JSON.stringify({
        messageType: 'join',
        username: username,
        token: token,
        // game: game,
        player: from
    }));
}

const declineInvite = () => {
    console.log("declined");
    clearShowInviteIntervals();
    document.getElementById("inviteBox").style.display = 'none';
}

const clearPages = () => {
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("homePage").style.display = "none";
    document.getElementById("matchPage").style.display = "none";
    lastUserListId = -1;
}
const updatePage = () => {
    clearPages();
    if(currentPage === 'register') {
        document.getElementById("registerPage").style.display = "block";
    }
    else if(currentPage === 'match') {
        document.getElementById("matchPage").style.display = "block";
    }
    else {
        document.getElementById("homePage").style.display = "block";
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
        ws.send(JSON.stringify({
            messageType: 'refresh',
            username: username,
            token: token
        }));
    }
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
        currentPage = 'home';
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

document.getElementById("matchCard").addEventListener('click', () => {
    currentPage = 'match';
    console.log("match");
    history.pushState(null, null);
    updatePage();
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