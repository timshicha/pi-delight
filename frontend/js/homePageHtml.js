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