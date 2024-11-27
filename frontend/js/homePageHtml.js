
export const generateUserHtml = (username, status) => {
    return `
        <div class="userOnline invitePlayerDiv">
            <div class="inlineBlock">
            <p class="invitePlayerText userOnlineUsername">${username}</p>
            <p class="userStatus">${status}</p>
            </div>
            <img src="/assets/checkmarkIcon.png" alt="Invited" class="invitedIcon invisible">
            <input id="invitePlayerButtonOk" type="image" src="/assets/plusIcon.png" alt="Invite" class="inviteBtn">
        </div>
    `;
}

export const generateNoUsersHtml = () => {
    return `<p class="errorMessage">There are no players online.</p>`;
}