
const createInvitePlayer = (username, usersInvited, ws, myUsername, token) => {
    const element = document.createElement("div");
    element.classList.add("userOnline");
    element.classList.add("invitePlayerDiv");
    const name = document.createElement("p");
    name.classList.add("userOnlineUsername");
    name.classList.add("invitePlayerText");
    name.innerText = username;
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
    element.appendChild(name);
    element.appendChild(invitedImg);
    element.appendChild(inviteBtn);
    return element;
};

const modifyInvitePlayer = (playerElement, setInvited) => {
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
}

export const modifyInvitePlayersList = (playersOnline, usersInvited, ws, username, token) => {
    const invitePlayersDiv = document.getElementById("lobbyInvitePlayersDiv");
    const invitePlayer = invitePlayersDiv.children;

    let usersOnline = structuredClone(playersOnline);

    // Go through existing list
    for (let i = 0; i < invitePlayer.length; i++) {
        const playerName = invitePlayer[i].querySelector("p").innerText;
        // If player disconnected
        if(!usersOnline.includes(playerName)) {
            invitePlayersDiv.removeChild(invitePlayer[i]);
        }
        else {
            // Modify invite button / invited checkmark
            modifyInvitePlayer(invitePlayer[i], usersInvited.includes(playerName));
            usersOnline.splice(usersOnline.indexOf(playerName), 1);
        }
    }
    // For the remaining users online (ones that aren't in the DOM)
    for (let i = 0; i < usersOnline.length; i++) {
        let user = createInvitePlayer(usersOnline[i], usersInvited, ws, username, token);
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
        return;
    }
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