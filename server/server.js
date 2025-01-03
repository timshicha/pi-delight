import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Lobby } from './Lobby.js';

dotenv.config();
const TEST_USERNAMES = ['Tim', 'Frank', 'Joe', 'Bob', 'Luke'];
const HOST = process.env.VITE_DEV_SERVER_HOST
const PORT = process.env.VITE_DEV_SERVER_PORT || 80;
const INVITE_TIMEOUT = process.env.INVITE_TIMEOUT || 20000; // Allow invite to same player every 20 seconds
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wss = new WebSocketServer({
    port: PORT,
});
console.log(`Server running on http://${HOST}:${PORT}`);

// Keep track of users.
// username: { token, socket, lobby, icon, invited (who this person invited) }
const users = {};

/*
Keep track of lobbies
admin: { Obj[Lobby] }

Lobby has the following:
    players: [admin, user1, ...],
    gameSelected: 'Match',
    game: null or Obj[Match],
    chat: null
*/
const lobbies = {};

// Server Update ID's.
// When a list of something periodically requested (like users online list)
// changes, the server will change the ID of the list. If the client requests
// for the same list with the same ID, the server won't send a response since
// the ID did not change and the list is still the same.
var lastUserListId = 0;

// Commonly requested data from clients
// username: {status: "In a lobby",}
var usersOnline = {};
var usersOnlineJson = JSON.stringify(usersOnline);

const addUserOnline = (username) => {
    modifyUserStatus(username);
}

const removeUserOnline = (username => {
    delete usersOnline[username];
    usersOnlineJson = JSON.stringify(usersOnline);
    lastUserListId++;
    console.log("remove user online");
})

const modifyUserStatus = (username) => {
    let status;
    if(!users[username].lobby) {
        status = "";
    }
    else if(!users[username].lobby.game) {
        status = "in lobby";
    }
    else {
        status = "playing";
    }
    usersOnline[username] = {
        status: status
    };
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
            return;
        }

        // FOR TESTING PURPOSES ONLY (allow 'Tim' and 'Joe')
        if(process.env.ISTESTING && TEST_USERNAMES.includes(res.username)) {
            // If not yet added
            if(!users[res.username]) {
                users[res.username] = {
                    token: '',
                    socket: ws,
                    lobby: null,
                    icon: 'boy0',
                    invited: []
                };
                addUserOnline(res.username);
                ws.username = res.username;
            }
            else if(!users[res.username].socket) {
                users[res.username].socket = ws;
                // if(users[res.username].lobby) {
                //     users[res.username].lobby.sendRefresh();
                // }
                addUserOnline(res.username);
                ws.username = res.username;
            }
        }

        // If requested to log out
        if(res.messageType === 'logout') {
            if(ws.username && ws.username in users) {
                users[ws.username].socket = null;
            }
            console.log(`${ws.username} logged out`);
            removeUserOnline(ws.username);
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
                lobby: null,
                icon: 'boy0',
                invited: []
            };
            ws.send(JSON.stringify({
                messageType: 'createUser',
                username: res.username,
                token: userUUID
            }));
            addUserOnline(res.username);
            ws.username = res.username;
            return;
        }

        // If requested to validate a user (and we're not testing with a test user)
        else if(res.messageType === 'validateUser') {
            // If we're just testing with a test username
            if(process.env.ISTESTING && TEST_USERNAMES.includes(res.username)) {
                ws.send(JSON.stringify({
                    messageType: 'validateUser',
                    username: res.username
                }));
                addUserOnline(res.username);
                return;
            }
            // Make sure the username exists and the tokens match
            if(res.username && res.username in users &&
                users[res.username].token === res.token) {
                ws.username = res.username;
                users[res.username].socket = ws;
                ws.send(JSON.stringify({
                    messageType: 'validateUser',
                    username: res.username
                }));
                addUserOnline(res.username);
                // If in a lobby, send refresh
                if(users[res.username].lobby) {
                    users[res.username].lobby.sendRefresh();
                }
                return;
            }
            ws.send(JSON.stringify({
                messageType: 'validateUser',
                error: 'Could not validate user.'
            }));
            return;
        }

        // If testing with test user, skip validation
        if(process.env.ISTESTING && TEST_USERNAMES.includes(res.username)) {
            // Skip other if statement
        }
        // For anything else, a user must validate themselves first
        else if(!res.username || !(res.username in users) ||
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
            ws.send(JSON.stringify({
                messageType: 'usersOnline',
                users: usersOnlineJson,
                lastUserListId: lastUserListId
            }));
            return;
        }

        console.log(res);

        // If the user wants to refresh the current lobby state
        if(res.messageType === 'refresh') {
            sendRefresh(ws, res);
        }

        // If sent a game invite
        if(res.messageType === 'invite') {
            // If this player isn't in a lobby
            if(!users[res.username].lobby) {
                return;
            }
            // If the other player isn't online, skip
            if(!users[res.to] || !users[res.to].socket) {
                return;
            }
            // If already invited
            if(users[res.username].invited.includes(res.to)) {
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
                from: res.username
            }));
            users[res.username].invited.push(res.to);
            // Allow invite again after 5 seconds
            setTimeout(() => {
                users[res.username].invited.splice(users[res.username].invited.indexOf(res.to), 1);
                // Make sure the user is still connected and in the lobby
                if(users[res.username].socket && users[res.username].lobby) {
                    users[res.username].lobby.sendRefreshTo(res.username);
                }
            }, INVITE_TIMEOUT);
            return;
        }

        // If joining a game
        if(res.messageType === 'join') {
            // Make sure invitee isn't already in a lobby
            if(users[res.username].lobby) {
                ws.send(JSON.stringify({
                    messageType: 'join',
                    error: 'You are already in a lobby.'
                }));
                return;
            }
            // Make sure the inviter is valid
            if(!res.player || !users[res.player]) {
                ws.send(JSON.stringify({
                    messageType: 'join',
                    error: 'This player does not exist.'
                }));
                return;
            }
            // Make sure the inviter is in a lobby
            if(!users[res.player].lobby) {
                ws.send(JSON.stringify({
                    messageType: 'join',
                    error: 'This player is not in a lobby.'
                }));
                return;
            }
            // Otherwise try to join the player
            
            let lobby = users[res.player].lobby;
            let errorMessage = lobby.addPlayer(res.username);

            // If error happened
            if(errorMessage) {
                ws.send(JSON.stringify({
                    messageType: 'join',
                    error: errorMessage
                }));
                return;
            }
            users[res.username].lobby = lobby;
            users[res.username].invited = []; // Reset invited list to allow invites to this lobby
            ws.send(JSON.stringify({
                messageType: 'join',
                message: `You joined ${res.player}.`
            }));
            modifyUserStatus(res.username);
            // Send message of updated game to all players in the lobby
            lobby.sendRefresh(false);
            return;
        }

        if(res.messageType === 'kick') {
            let lobby = users[res.username].lobby;;
            // Make sure the kicker is in a lobby, they are the
            // admin, and the other player is in the lobby
            if(lobby && res.username === lobby.getAdmin() &&
                lobby.hasPlayer(res.usernameToKick)) {
                // Remove player
                lobby.removePlayer(res.usernameToKick);
                users[res.usernameToKick].lobby = null;
                // Send left lobby
                users[res.usernameToKick].socket.send(JSON.stringify({
                    messageType: 'leaveGame',
                    kicked: true,
                    message: 'You have been kicked from the lobby.'
                }));
                modifyUserStatus(res.usernameToKick);
                // Send message of updated game to all players in the lobby
                lobby.sendRefresh(false);
            }
            return;
        }

        if(res.messageType === 'leaveGame') {
            let lobby = users[res.username].lobby;
            // Make sure this player is in a lobby
            if(lobby) {
                lobby.removePlayer(res.username);
                users[res.username].socket.send(JSON.stringify({
                    messageType: 'leaveGame',
                    kicked: false,
                    message: 'You left the lobby.'
                }));
                modifyUserStatus(res.username);
                // Send message of updated lobby to all players in the lobby
                lobby.sendRefresh(false);
                // Send refresh to player that left
                sendRefresh(ws, res);
            }
            return;
        }

        // If creating a game
        if(res.messageType === 'createGame') {
            // Make sure player isn't already in a lobby
            if(users[res.username].lobby) {
                ws.send(JSON.stringify({
                    messageType: 'createGame',
                    error: 'You are already in a lobby.'
                }));
                return;
            }
            let lobby = new Lobby(users);
            users[res.username].invited = []; // Reset invited list to allow invites to this lobby
            lobby.addPlayer(res.username);
            modifyUserStatus(res.username);
            lobby.sendRefresh(ws,res);
            return;
        }

        // If starting a game
        if(res.messageType === 'startGame') {
            const lobby = users[res.username].lobby;
            // Make sure player is in a lobby and is admin
            if(!lobby || res.username !== lobby.getAdmin()) {
                return;
            }
            // If there's an active game
            if(lobby.game && lobby.game.isActive()) {
                return;
            }
            lobby.startGame(res.game);
        }

        // If a move in a game
        if(res.messageType === 'gameMove') {
            // Make sure the player is in a lobby and game
            if(!users[res.username].lobby || !users[res.username].lobby.game) {
                return;
            }
            // Make sure moveInfo was supplied
            if(!res.moveInfo) {
                return;
            }
            // Otherwise, make the move
            users[res.username].lobby.makeMove(res.username, res.moveInfo);
            // Let others know the move result
        }

        // If updating player icon
        if(res.messageType === 'updateIcon') {
            // Make sure it's a valid icon first
            //
            //
            users[res.username].icon = res.icon;
            // If they are in a lobby, send refresh to lobby
            if(users[res.username].lobby) {
                users[res.username].lobby.updatePlayerIcons();
                users[res.username].lobby.sendRefresh();
            }
            // If not in lobby, just send refresh to them
            else {
                sendRefresh(ws, res);
            }
        }
    });

    ws.on('close', () => {
        // Record the user as offline (if they are registered)
        if(ws.username && ws.username in users) {
            users[ws.username].socket = null;
        }
        console.log(`${ws.username} disconnected`);
        removeUserOnline(ws.username);
    });
});

const sendRefresh = (ws, res) => {
    // If not in a lobby, return
    if(!users[res.username].lobby) {
        ws.send(JSON.stringify({
            messageType: 'refresh',
            inLobby: false,
            playerIcon: users[res.username].icon
        }));
        return;
    }
    // Otherwise, send lobby state
    users[res.username].lobby.sendRefreshTo(res.username);
    return;
}