const HOST = '192.168.0.23';
const PORT = 80;

var socket = new WebSocket(
    `ws://${HOST}:${PORT}`
);

const buttonPressed = () => {
    console.log("Button pressed");
};