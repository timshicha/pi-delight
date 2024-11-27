import PiDelightSocket from "./PiDelightSocket.js";
import { generateNoUsersHtml, generateUserHtml } from "./homePageHtml.js";
import { matchImagePaths } from "/js/imports/matchImports.js";
import { modifyLobby, modifyInvitePlayersList, modifyLobbyButtons } from "./lobbyHtml.js";

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
var invited = [];
var inGame = false;

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
            updatePage();
        }
    }

    else if(data.messageType === "validateUser") {
        if(data.error) {
            console.log(data.error);
        }
        else {
            console.log("Logged in.");
            username = data.username;
            token = localStorage.getItem("token");
            localStorage.setItem("loggedIn", true);
            // currentPage = 'home';
            currentPage = 'match';
            // After user has been validated, request a refresh of data
            requestRefresh();
            updatePage();
        }
    }

    else if(data.messageType === "usersOnline") {
        usersOnline = JSON.parse(data.users);
        lastUserListId = data.lastUserListId;
        // Remove yourself from the list
        delete usersOnline[username]; 
        const usernames = Object.keys(usersOnline);
        let usersOnlineHtml = "";
        console.log(usersOnline);

        // If on home screen, generate HTML for users online.
        if(currentPage === 'home') {
            for (let i = 0; i < usernames.length; i++) {
                usersOnlineHtml += generateUserHtml(usernames[i], usersOnline[usernames[i]].status);
            }
            if(usernames.length === 0) {
                usersOnlineHtml = generateNoUsersHtml();
            }
            document.getElementById("usersOnlineContainer").innerHTML = usersOnlineHtml;
        }
        // Otherwise generate HTML for lobby invites
        modifyInvitePlayersList(usersOnline, invited, ws, username, token);
    }
    else if(data.messageType === 'invite') {
        showInvite(data.from);
    }

    else if(data.messageType === 'refresh') {
        // If in lobby
        if(data.inLobby) {
            invited = data.invited;
            console.log(username);
            modifyLobby(data.state.players, data.state.icons, 4, username, kickFunction);
            modifyInvitePlayersList(usersOnline, invited, ws, username, token);
        }
        // If not in lobby
        else {
            modifyLobby();
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
const showInvite = (from) => {
    clearShowInviteIntervals();
    let inviteBox = document.getElementById("inviteBox");
    document.getElementById("invitePrompt").innerText = `${from} invited you.`;
    document.getElementById("acceptInviteBtn").addEventListener('click', () => {
        acceptInvite(from);
        inviteBox.style.display = 'none';
        inviteBox.style.opacity = 0;
    });
    document.getElementById("declineInviteBtn").addEventListener('click', () => {
        declineInvite
        inviteBox.style.display = 'none';
        inviteBox.style.opacity = 0;
    });
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

const acceptInvite = (from, game) => {
    ws.send(JSON.stringify({
        messageType: 'join',
        username: username,
        token: token,
        // game: game,
        player: from
    }));
}

const declineInvite = () => {
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
    }
}

const requestRefresh = () => {
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