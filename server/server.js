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
// value = {userId, userSocket, online}
const users = {};

wss.on('connection', (ws, req) => {
    console.log(`${req.socket.remoteAddress} connected`);
    ws.userData = {
        username: ""
    };

    ws.on('message', (data) => {
        console.log("Message from " + ws.username);
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
                token: usedUUID,
                socket: ws,
                online: true
            };
            ws.send(JSON.stringify({
                messageType: 'createUser',
                username: res.username,
                token: usedUUID
            }));
            ws.username = res.username;
            return;
        }

        // If requested to validate a user
        else if(res.messageType === 'validateUser') {
            // Make sure the username exists and the tokens match
            if(res.username && res.username in users &&
                users[res.username].token === res.token) {
                ws.username = res.username;
                users[res.username].online = true;
                ws.send(JSON.stringify({
                    messageType: 'validateUser',
                    username: res.username
                }));
                return;
            }
            ws.send(JSON.stringify({
                messageType: 'validateUser',
                error: 'Could not validate user.'
            }));
            return;
        }

        // For anything else, a user must validate themselves first
        if(!res.username || !(res.username in users) ||
            users[res.username].token !== res.token) {
                ws.send(JSON.stringify({
                    messageType: 'loggedOut'
                }));
                return;
        }

        // If requested for list of users online
        if(res.messageType === 'usersOnline') {
            const keys = Object.keys(users).filter(key => users[key].online == true);
            const keysAsJson = JSON.stringify(keys);
            ws.send(JSON.stringify({
                messageType: 'usersOnline',
                users: keysAsJson
            }));
            return;
        }

    });

    ws.on('close', () => {
        // Record the user as offline (if they are registered)
        if(ws.username && ws.username in users) {
            users[ws.username].online = false;
        }
        console.log(`${ws.username} disconnected`);
    });
});