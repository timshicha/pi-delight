import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { MatchGame } from './Games.js';

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
// value = {userId, userSocket, online, currentGame}
const users = {};

// Keep track of games.
const games = {
    match: []
};

// Server Update ID's.
// When a list of something periodically requested (like users online list)
// changes, the server will change the ID of the list. If the client requests
// for the same list with the same ID, the server won't send a response since
// the ID did not change and the list is still the same.
var lastUserListId = 0;

// Commonly requested data from clients
var usersOnline = [];
var usersOnlineJson = JSON.stringify(usersOnline);

// Update the list of users online
const updateUsersOnlineList = () => {
    usersOnline = Object.keys(users).filter(key => users[key].online == true);
    usersOnlineJson = JSON.stringify(usersOnline);
    lastUserListId++;
}

wss.on('connection', (ws, req) => {
    console.log(`${req.socket.remoteAddress} connected`);
    ws.userData = {
        username: ""
    };

    ws.on('message', (data) => {
        // console.log("Message from " + ws.username);
        let res;
        try {
            res = JSON.parse(data);
        }
        catch {
            ws.send(JSON.stringify({
                messageType: 'createUser',
                error: 'The data was sent in a bad format. (Probably not your fault).'
            }));
            return;
        }

        // If requested to log out
        if(res.messageType === 'logout') {
            if(ws.username && ws.username in users) {
                users[ws.username].online = false;
            }
            console.log(`${ws.username} logged out`);
            updateUsersOnlineList();
            ws.send(JSON.stringify({
                messageType: 'logout'
            }));
        }

        // If requested to create a user
        else if(res.messageType === 'createUser') {
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
            const userUUID = uuidv4();
            users[res.username] = {
                token: userUUID,
                socket: ws,
                online: true,
                currentGame: null
            };
            ws.send(JSON.stringify({
                messageType: 'createUser',
                username: res.username,
                token: userUUID
            }));
            updateUsersOnlineList();
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
                users[res.username].socket = ws;
                ws.send(JSON.stringify({
                    messageType: 'validateUser',
                    username: res.username
                }));
                updateUsersOnlineList();
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
            // If the list of users hasn't changed.
            if(res.lastUserListId == lastUserListId) {
                return;
            }
            const keys = Object.keys(users).filter(key => users[key].online == true);
            const keysAsJson = JSON.stringify(keys);
            ws.send(JSON.stringify({
                messageType: 'usersOnline',
                users: keysAsJson,
                lastUserListId: lastUserListId
            }));
            return;
        }

        // If sent a game invite
        if(res.messageType === 'invite') {
            // If the other player isn't online, skip
            if(!users[res.to] || !users[res.to].online || !users[res.to].socket) {
                return;
            }
            // Make sure this player is in a match game that wasn't started
            // and that the game isn't full.
            //
            // ............
            //
            // Otherwise send the request
            users[res.to].socket.send(JSON.stringify({
                messageType: 'invite',
                game: 'Match',
                from: res.username
            }));
            return;
        }

        // If joining a game
        if(res.messageType === 'join') {
            if(res.game === 'Match') {
                console.log("accepted Match invite");
            }
            return;
        }

        // If creating a game
        if(res.messageType === 'createGame') {
            // Make sure player isn't already in a game
            if(users[res.username].currentGame) {
                ws.send(JSON.stringify({
                    messageType: 'createGame',
                    error: 'You are already in a game.'
                }));
                return;
            }
            // If creating a match game
            if(res.game === 'Match') {
                console.log("created Match game");
                let game = new MatchGame();
                users[res.username].currentGame = game;
                games.match.push(game);
                ws.send(JSON.stringify({
                    messageType: 'createGame',
                    game: 'Match'
                }));
                return;
            }
        }

    });

    ws.on('close', () => {
        // Record the user as offline (if they are registered)
        if(ws.username && ws.username in users) {
            users[ws.username].online = false;
            users[ws.username].socket = null;
        }
        console.log(`${ws.username} disconnected`);
        updateUsersOnlineList();
    });
});