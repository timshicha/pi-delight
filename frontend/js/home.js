import { iconToPath, playerIcons } from "./imports/matchImports";

export const generateNoUsersHtml = () => {
    const element = document.createElement("p");
    element.classList.add("errorMessage");
    element.innerText = "There are no players online."
    return element;
}

export const generateUserHtml = (username, status) => {
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
    return element;
};

export const generateNavbarIcons = (ws, username, token, closeNavbarFunction) => {
    const element = document.createElement("div");
    // For each player icon
    // Go backwards since it's float right (order backwards)
    for (let i = playerIcons.length - 1; i >= 0; i--) {
        let iconElement = document.createElement("input");
        iconElement.type = "image";
        iconElement.classList.add("navbarPlayerIcon");
        iconElement.src = iconToPath(playerIcons[i]);
        iconElement.onclick = () => {
            ws.send(JSON.stringify({
                messageType: "updateIcon",
                username: username,
                token: token,
                icon: playerIcons[i]
            }));
            closeNavbarFunction();
        }
        element.appendChild(iconElement);
    }
    return element;
}