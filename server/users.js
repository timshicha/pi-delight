import { v4 as uuidv4 } from 'uuid';

export class User {

    constructor () {
        this.username = null;
        this.password = null;
        this.data = null;
        this.currentTokenID = null;
    }

    // Create user by providing user details
    setUser = (username, password, data, currentTokenID) => {
        this.username = username;
        this.password = password;
        this.data = data;
        this.currentTokenID = currentTokenID;
        return true;
    }

    // Create user from a json string with user details
    setUserFromJSON = (userJSON) => {
        // Try parsing the user
        try {
            let user = JSON.parse(userJSON);
            this.setUser(
                user.username, user.password, user.data, user.currentTokenID
            );
        }
        catch {
            console.log(`Error parsing user: ${userJSON}`);
            return false;
        }
        return true;
    }
}

export class Users {
    constructor () {
        this.users = {};
    }

    // Add user by providing user details
    addUser = (username, password, data = {}, currentTokenID = null) => {
        // If user already exists with this username, don't allow
        if(username in this.users) {
            return false;
        }
        let user = new User();
        user.setUser(username, password, data, currentTokenID);
        this.users[username] = user;
        return user;
    }

    // Add user by providing a json string with user details
    addUserFromJSON = (userJSON) => {
        let user = new User();
        // If can't read user from JSON, return error (false)
        if(!user.setUser(userJSON)) {
            return false;
        }
        // If user already exists with this username, don't allow
        if(user.username in this.users) {
            return false;
        }
        this.users[user.username] = user;
        return user;
    }

    validateUser = (username, password) => {
        let user = this.users[username];
        // If user doesn't exist
        if(!user) {
            return false;
        }
        // If incorrect passowrd
        if(password != user.password) {
            return false;
        }
        // If password matches, generate a token and return it
        let tokenID = uuidv4();
        user.currentTokenID = tokenID;
        return tokenID;
    }
}