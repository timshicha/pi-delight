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
export const modifyLobby = (players, maxPlayers, username, admin, kickFunction) => {
    const lobbyContainer = document.getElementById("lobbyPlayersContainer");
    const imgs = lobbyContainer.querySelectorAll("img");
    const names = lobbyContainer.querySelectorAll("p");
    const buttons = lobbyContainer.querySelectorAll("button");
    // For all players
    for (let i = 0; i < players.length; i++) {
        // Choose correct player icon
        if(players[i].gender === 'boy' && imgs[i].src !== '/assets/playerIcons/boy.png') {
            imgs[i].src = '/assets/playerIcons/boy.png';
            imgs[i].alt = 'Boy player icon';
        }
        if(players[i].gender === 'girl' && imgs[i].src !== '/assets/playerIcons/girl.png') {
            imgs[i].src = '/assets/playerIcons/girl.png';
            imgs[i].alt = 'Girl player icon';
        }
        // Set correct name
        if(players[i].name !== names[i].innerText) {
            names[i].innerText = players[i].name;
        }
        const kickFunc = () => kickFunction(names[i].innerText);
        // If admin, show kick button
        if(username === admin) {
            buttons[i].classList.remove('invisible');
            // Looking at admin, lock button to not
            // allow admins to kick themselves
            if(names[i].innerText === admin) {
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
        if(imgs[i].src !== '/assets/playerIcons/grayPlayer.png') {
            imgs[i].src = '/assets/playerIcons/grayPlayer.png';
            imgs[i].alt = 'No player icon';
        }
        // Set blank name
        if(names[i].innerText !== ' ') {
            names[i].innerText = ' ';
        }
        if(username === admin) {
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

/*
<div class="lobbyPlayer">
    <img src="/assets/playerIcons/grayPlayer.png" alt="No player" class="lobbyPlayerIcon">
    <p class="lobbyPlayerName">player</p>
    <button class="promptBtn lobbyKickBtn lockedBtn">Kick</button>
</div>
*/