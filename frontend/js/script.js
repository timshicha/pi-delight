import PiDelightSocket from "./PiDelightSocket";

const HOST = '192.168.0.23';
const PORT = 80;

var ws = new PiDelightSocket(HOST, PORT);

// This is what needs to be done when there's a message from the server
const wsOnMessage = (event) => {
    const data = JSON.parse(event.data);

    console.log(data);
}

document.getElementById("connectBtn").addEventListener('click', () => {
    ws.connect();
    ws.ws.onmessage = (event) => wsOnMessage(event);
});

document.getElementById("disconnectBtn").addEventListener('click', () => {
    ws.disconnect();
});

document.getElementById("createUserBtn").addEventListener('click', () => {
    let username = document.getElementById("createUserInput").value;
    ws.send(JSON.stringify({
        messageType: "createUser",
        username: username
    }));
});