import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const HOST = process.env.VITE_DEV_SERVER_HOST
const PORT = process.env.VITE_DEV_SERVER_PORT || 80;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wss = new WebSocketServer({
    port: PORT,
});
console.log(`Server running on http://${HOST}:${PORT}`);

// Keep track of users.
// key = username
// value = {userId, userSocket}
const users = {};

wss.on('connection', (ws, req) => {
    console.log(`${req.socket.remoteAddress} connected`);

    ws.on('message', (data) => {
        let res;
        try {
            res = JSON.parse(data);
        }
        catch {
            ws.send(JSON.stringify({
                messageType: 'createUser',
                error: 'The data was sent in a bad format. (Probably not your fault).'
            }));
        }

        // If requested to create a user
        if(res.messageType === 'createUser') {
            // If username not provided
            if(!res.username) {
                ws.send(JSON.stringify({
                    messageType: 'createUser',
                    error: 'Username cannot be blank.'
                }));
                return;
            }
            // If username is too long
            if(res.username.length > 20) {
                ws.send(JSON.stringify({
                    messageType: 'createUser',
                    error: 'Username cannot be more than 20 characters long.'
                }));
                return;
            }
            // If username already exists
            if(res.username in users) {
                ws.send(JSON.stringify({
                    messageType: 'createUser',
                    error: 'Username is already in use.'
                }));
                return;
            }
            
            // Otherwise create user
            const usedUUID = uuidv4();
            users[res.username] = {
                userId: usedUUID,
                userSocket: ws
            };
            ws.send(JSON.stringify({
                messageType: 'createUser',
                username: res.username,
                token: usedUUID
            }));
            return;
        }

    });

    ws.on('close', (ws) => {
        console.log(`${ws} disconnected`);    
    });
});