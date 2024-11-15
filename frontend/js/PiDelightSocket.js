
export default class PiDelightSocket {
    constructor (host, port) {
        this.host = host;
        this.port = port;
        this.ws = null;
        this.handlers = [];
    };

    connect = () => {
        this.disconnect();
        this.ws = new WebSocket(
            `ws://${this.host}:${this.port}`
        );
        return true;
    };

    disconnect = () => {
        if(this.ws && this.ws.close) {
            this.ws.close();
        }
        this.ws = null;
    };

    send = (message) => {
        if(this.ws && this.ws.send) {
            this.ws.send(message);
            return true;
        }
        console.log("Cannot send message; socket is not connected.");
        return false;
    };
};