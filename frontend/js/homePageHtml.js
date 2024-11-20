
export const generateUserHtml = (username) => {
    return `
        <div class="userOnline">
            <p class="userOnlineUsername">${username}</p>
        </div>
    `;
}

export const generateNoUsersHtml = () => {
    return `<p class="errorMessage">There are no players online.</p>`;
}