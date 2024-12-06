
const createInvitePlayer = (username, status, usersInvited, ws, myUsername, token) => {
    const element = document.createElement("div");
    element.classList.add("invitePlayerDiv");
    const nameAndStatusDiv = document.createElement("div");
    element.appendChild(nameAndStatusDiv);
    nameAndStatusDiv.classList.add("inlineBlock");
    const nameElement = document.createElement("p");
    nameElement.classList.add("invitePlayerUsername");
    nameElement.innerText = username;
    const statusElement = document.createElement("p");
    statusElement.classList.add("invitePlayerStatus");
    statusElement.innerText = status;
    nameAndStatusDiv.appendChild(nameElement);
    nameAndStatusDiv.appendChild(statusElement);
    let invitedImg = document.createElement("img");
    invitedImg.src = "/assets/checkmarkIcon.png";
    invitedImg.alt = "Invited";
    invitedImg.classList.add("invitedIcon");
    invitedImg.classList.add("invisible");
    let inviteBtn = document.createElement("input");
    inviteBtn.id = `invitePlayerButton${username}`;
    inviteBtn.type = "image";
    inviteBtn.src = "/assets/plusIcon.png";
    inviteBtn.alt = "Invite";
    inviteBtn.classList.add("inviteBtn");
    inviteBtn.onclick = () => {
        // Send request
        ws.send(JSON.stringify({
            messageType: 'invite',
            username: myUsername,
            token: token,
            to: username
        }));
        usersInvited.push(username);
        inviteBtn.classList.add("invisible");
        invitedImg.classList.remove("invisible");
    }
    // If already invited
    if(usersInvited.includes(username)) {
        inviteBtn.classList.add("invisible");
        invitedImg.classList.remove("invisible");
    }
    // If not invited
    else {
        invitedImg.classList.add("invisible");
        inviteBtn.classList.remove("invisible");
    }
    element.appendChild(invitedImg);
    element.appendChild(inviteBtn);
    return element;
};

const modifyInvitePlayer = (playerElement, status, setInvited) => {
    const inviteBtn = playerElement.querySelector("input");
    const invitedImg = playerElement.querySelector("img");
    if(setInvited) {
        inviteBtn.classList.add("invisible");
        invitedImg.classList.remove("invisible");
    }
    else {
        invitedImg.classList.add("invisible");
        inviteBtn.classList.remove("invisible");
    }
    // Modify status text
    playerElement.getElementsByClassName("invitePlayerStatus")[0].innerText = status;
}

export const modifyInvitePlayersList = (playersOnline, usersInvited, playersInLobby, ws, username, token) => {
    const invitePlayersDiv = document.getElementById("lobbyInvitePlayersDiv");
    const invitePlayer = invitePlayersDiv.children;
    console.log("players online: " + Object.keys(playersOnline));
    console.log("users invited: " + usersInvited);

    let userKeys = Object.keys(playersOnline);
    // Remove players that are in this lobby already
    for (let i = 0; i < userKeys.length; i++) {
        const playerName = userKeys[i];
        if(playersInLobby.includes(playerName)) {
            userKeys.splice(userKeys.indexOf(playerName, 1));
        }
    }
    
    // Go through existing HTML list and remove players that are not in the new list
    for (let i = 0; i < invitePlayer.length; i++) {
        const playerName = invitePlayer[i].getElementsByClassName("invitePlayerStatus")[0].innerText;
        // If this player is not in the list, remove them
        if(!userKeys.includes(playerName)) {
            invitePlayersDiv.removeChild(invitePlayer[i]);
        }
        // Otherwise, modify the user and remove them from userKeys so we don't modify them again
        else {
            modifyInvitePlayer(invitePlayer[i], playersOnline[playerName].status, usersInvited.includes(playerName));
            userKeys.splice(userKeys.indexOf(playerName), 1);
        }
    }
    // For the remaining users online (ones that aren't in the DOM)
    for (let i = 0; i < userKeys.length; i++) {
        let user = createInvitePlayer(userKeys[i], playersOnline[userKeys[i]].status, usersInvited, ws, username, token);
        invitePlayersDiv.prepend(user);
    }
}

// players: [{name: name, gender: gender}], ...]
export const modifyLobby = (players, icons, maxPlayers=4, username, kickFunction) => {
    const lobbyContainer = document.getElementById("lobbyPlayersContainer");
    const imgs = lobbyContainer.querySelectorAll("img");
    const names = lobbyContainer.querySelectorAll("p");
    const buttons = lobbyContainer.querySelectorAll("button");
    // If not in a game, reset lobby to default
    if(!players) {
        for (let i = 0; i < maxPlayers; i++) {
            imgs[i].src = '/assets/playerIcons/grayPlayer.png';
            imgs[i].alt = 'No player icon';
            names[i].innerText = ' ';
            buttons[i].classList.add('invisible');
            buttons[i].onclick = null;
        }
        modifyLobbyButtons(false);
        return;
    }
    modifyLobbyButtons(true);
    // For all players
    for (let i = 0; i < players.length; i++) {
        // Choose correct player icon
        imgs[i].src = `/assets/playerIcons/${icons[i]}.png`;
        imgs[i].alt = `Player icon ${icons[i]}`;
        // Set correct name
        if(players[i] !== names[i].innerText) {
            names[i].innerText = players[i];
        }
        // If admin, show kick button
        console.log(username + " " + players[0]);
        if(username === players[0]) {
            buttons[i].classList.remove('invisible');
            // Looking at admin, lock button to not
            // allow admins to kick themselves
            if(names[i].innerText === players[0]) {
                buttons[i].classList.add('lockedBtn');
                buttons[i].onclick = null;
            }
            else {
                buttons[i].classList.remove('lockedBtn');
                buttons[i].onclick = () => kickFunction(names[i].innerText);
            }
        }
        else {
            buttons[i].classList.add('invisible');
            buttons[i].onclick = null;
        }
    }
    // For empty slots
    for (let i = players.length; i < maxPlayers; i++) {
        // Set blank image
        imgs[i].src = '/assets/playerIcons/grayPlayer.png';
        imgs[i].alt = 'No player icon';
        // Set blank name
        if(names[i].innerText !== ' ') {
            names[i].innerText = ' ';
        }
        if(username === players[0]) {
            buttons[i].classList.add('lockedBtn');
            buttons[i].classList.remove('invisible');
            buttons[i].onclick = () => kickFunction(names[i].innerText);
        }
        else {
            buttons[i].classList.add('invisible');
            buttons[i].onclick = null;
        }
    }
}

// Show proper buttons based on if the player is in a lobby or not
export const modifyLobbyButtons = (inLobby) => {
    const inLobbyBtns = document.getElementById("inLobbyBtns");
    const outOfLobbyBtns = document.getElementById("outOfLobbyBtns");
    if(inLobby) {
        outOfLobbyBtns.style.display = 'none';
        inLobbyBtns.style.display = 'block';
    }
    else {
        inLobbyBtns.style.display = 'none';
        outOfLobbyBtns.style.display = 'block';
    }
}