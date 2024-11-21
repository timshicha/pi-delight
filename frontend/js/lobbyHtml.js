
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