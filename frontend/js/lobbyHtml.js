// If invited is false, an invite button appears.
// If invited is true, an invited gray checkmark appears.
export const generateInvitePlayerHtml = (username, invited) => {
    if(invited) {
        return `
        <div class="userOnline invitePlayerDiv">
            <p class="userOnlineUsername invitePlayerText">${username}</p>
            <img src="/assets/checkmarkIcon.png" alt="Invited" class="invitedIcon" />
        </div>
        `;
    }
    return `
    <div class="userOnline invitePlayerDiv">
        <p class="userOnlineUsername invitePlayerText">${username}</p>
        <input id="invitePlayerButton${username}" type="image" src="/assets/plusIcon.png" alt="Invite" class="inviteBtn" />
    </div>
    `;
};

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