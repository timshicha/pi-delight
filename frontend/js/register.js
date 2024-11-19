
export const registerPage = () => {
    return `
        <form id="registerForm">
            <h3 class="formTitle">Register to play. It's easy!</h3>
            <label for="usernameInput" class="prompt">Create username:</label>
            <input type="text" name="usernameInput" id="usernameInput" class="promptInput usernameInput" placeholder="Username">
            <button type="submit" class="promptBtn">Continue</button>
            <p id="usernameInputError" class="inputError"></p>
        </form>
    `;
}