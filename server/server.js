import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { Users } from './users.js';
import path, { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();
const HOST = process.env.VITE_DEV_SERVER_HOST
const PORT = process.env.VITE_DEV_SERVER_PORT || 80;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wss = new WebSocketServer({
    port: PORT,
});
console.log(`Server running on http://${HOST}:${PORT}`);
const users = new Users();
setInterval(() => { console.log(users)}, 3000);

wss.on('connection', (ws, req) => {
    console.log(`${req.socket.remoteAddress} connected`);

    ws.on('message', (data) => {
        let res = JSON.parse(data);

        // Create account
        if(res.messageType === "createAccount") {
            let user = users.addUser(res.username, res.password);
            if(user) {
                let token = users.validateUser(res.username, res.password);
                let ret = JSON.stringify({
                    messageType: 'createAccount',
                    status: 200,
                    username: res.username,
                    token: token
                });
                ws.send(ret);
            }
            else {
                let ret = JSON.stringify({
                    messageType: 'createAccount',
                    status: 401,
                    username: res.username,
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