import PiDelightSocket from "./PiDelightSocket.js";
import { generateNoUsersHtml, generateUserHtml } from "./homePageHtml.js";

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

// This is what needs to be done when there's a message from the server
const wsOnMessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    if(data.messageType === "createUser") {
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
            currentPage = 'home';
            updatePage();
        }
    }

    else if(data.messageType === "usersOnline") {
        let usersOnline = JSON.parse(data.users);
        // Remove yourself from the list
        const index = usersOnline.indexOf(username);
        if(index > -1) {
            usersOnline.splice(index, 1);
        }
        let usersOnlineHtml = "";
        console.log(usersOnline);
        for (let i = 0; i < usersOnline.length; i++) {
            console.log(usersOnline[i]);
            usersOnlineHtml += generateUserHtml(usersOnline[i]);
        }
        if(usersOnline.length === 0) {
            usersOnlineHtml = generateNoUsersHtml();
        }
        document.getElementById("usersOnlineContainer").innerHTML = usersOnlineHtml;
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
    if(username && token) {
        ws.send(JSON.stringify({
            messageType: "validateUser",
            username: username,
            token: token
        }));
    }
}

const clearPages = () => {
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("homePage").style.display = "none";
}
const updatePage = () => {
    clearPages();
    if(currentPage === 'register') {
        document.getElementById("registerPage").style.display = "block";
    }
    else {
        document.getElementById("homePage").style.display = "block";
    }
}

// Every second (or so), send update requests to the server based on what
// page the user in on.
const requestUpdates = () => {
    if(currentPage === 'home') {
        ws.send(JSON.stringify({
            messageType: "usersOnline",
            username: username,
            token: token
        }));
    }
}
const requestUpdatesIntervalId = setInterval(requestUpdates, 1000);

window.addEventListener('beforeunload', () => {
    clearInterval(requestUpdatesIntervalId);
})

document.getElementById("registerForm").addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById("usernameInput").value;
    ws.send(JSON.stringify({
        messageType: "createUser",
        username: username
    }));
});