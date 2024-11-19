import { validate } from "uuid";
import PiDelightSocket from "./PiDelightSocket";
import { registerPage } from "./register";

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
            localStorage.setItem("loggedIn", true);
            currentPage = 'home';
            updatePage();
        }
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

const updatePage = () => {
    let pageHTML;
    if(currentPage === 'register') {
        pageHTML = registerPage();
    }
    else {
        pageHTML = "logged in";
    }
    document.getElementById("appContainer").innerHTML = pageHTML;
}

document.getElementById("registerForm").addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById("usernameInput").value;
    ws.send(JSON.stringify({
        messageType: "createUser",
        username: username
    }));
});