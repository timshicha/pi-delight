import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { Tokens } from './tokens.js';
import path, { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();
const HOST = process.env.VITE_DEV_SERVER_HOST
const PORT = process.env.VITE_DEV_SERVER_PORT || 80;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tokens = new Tokens();
const wss = new WebSocketServer({
    port: PORT,
});
console.log(`Server running on http://${HOST}:${PORT}`);

wss.on('connection', (ws, req) => {
    console.log(`${req.socket.remoteAddress} connected`);

    ws.on('message', (data) => {
        let res = JSON.parse(data);

        // Create account
        if(res.messageType === "createAccount") {
            let token = tokens.createToken(res.username, res.password);
            if(token) {
                let ret = JSON.stringify({
                    messageType: 'createAccount',
                    status: 200,
                    token: token
                });
                ws.send(ret);
            }
            else {
                let ret = JSON.stringify({
                    messageType: 'createAccount',
                    status: 401,
                    token: ""
                });
                ws.send(ret);
            }
        }
    });

    ws.on('close', (ws) => {
        console.log(`${ws} disconnected`);    
    });
});