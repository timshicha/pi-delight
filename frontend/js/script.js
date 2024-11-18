import { validate } from "uuid";
import PiDelightSocket from "./PiDelightSocket";

const HOST = '192.168.0.23';
const PORT = 80;

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
        }
        else {
            localStorage.setItem("username", data.username);
            localStorage.setItem("token", data.token);
            localStorage.setItem("loggedIn", true);
            console.log("User created");
        }
    }

    else if(data.messageType === "validateUser") {
        if(data.error) {
            console.log(data.error);
        }
        else {
            console.log("Logged in.");
            localStorage.setItem("loggedIn", true);
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

document.getElementById("createUserBtn").addEventListener('click', () => {
    let username = document.getElementById("createUserInput").value;
    ws.send(JSON.stringify({
        messageType: "createUser",
        username: username
    }));
});