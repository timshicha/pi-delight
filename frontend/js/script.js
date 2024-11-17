import PiDelightSocket from "./PiDelightSocket";

const HOST = '192.168.0.23';
const PORT = 80;

var ws = new PiDelightSocket(HOST, PORT);

// This is what needs to be done when there's a message from the server
const wsOnMessage = (event) => {
    const data = JSON.parse(event.data);

    // If create account response
    if(data.messageType === 'createAccount') {
        if(data.status == 200) {
            // Store the token in local storage (not safe, don't try at home).
            localStorage.setItem('token', data.token);
            console.log("Logged in. Token: " + data.token);
        }
        else {
            console.log("Could not log in.");
        }
    }
    // If login response
    else if(data.messageType === 'login') {
        if(data.status == 200) {
            // Store the token in local storage (not safe)
            localStorage.setItem('token', data.token);
            console.log("Loggen in. Token: " + data.token);
        }
        else {
            console.log("Could not log in.");
        }
    }
}

document.getElementById("connectBtn").addEventListener('click', () => {
    ws.connect();
    ws.ws.onmessage = (event) => wsOnMessage(event);
});

document.getElementById("disconnectBtn").addEventListener('click', () => {
    ws.disconnect();
});
document.getElementById("createAccountBtn").addEventListener('click', () => {
    let username = document.getElementById("createAccountUsernameInput").value;
    let password = document.getElementById("createAccountPasswordInput").value;
    ws.send(JSON.stringify({messageType: "createAccount", username: username, password: password}));
});
document.getElementById("loginBtn").addEventListener('click', () => {
    let username = document.getElementById("loginUsernameInput").value;
    let password = document.getElementById("loginPasswordInput").value;
    ws.send(JSON.stringify({messageType: "login", username: username, password: password}));
});