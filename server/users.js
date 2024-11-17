import { v4 as uuidv4 } from 'uuid';



export class User {

    constructor () {
        this.username = null;
        this.password = null;
        this.data = {
            friends: [],
            incomingFriendRequests: [],
            outgoingFriendRequests: []
        };
        this.currentTokenID = null;
        // Keep track of whether the user was changed to know if data
        // in the file needs to be updated.
        this.updated = false;
    }

    // Create user by providing user details
    setUser = (username, password, data, currentTokenID) => {
        this.username = username;
        this.password = password;
        if(data) {
            this.data = data;
        }
        else {
            this.data = {
                friends: [],
                incomingFriendRequests: [],
                outgoingFriendRequests: []
            };
        }
        this.currentTokenID = currentTokenID;
        this.updated = true;
        return true;
    }

    // Create user from data file
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

    toJSON = () => {
        return JSON.stringify({
            username: this.username,
            password: this.password,
            data: this.data,
            currentTokenID: this.currentTokenID
        });
    }

    // Get the list of friends
    getFriends = () => {
        return this.data.friends;
    }

    // Get the list of incoming friend requests
    getIncomingFriendRequests = () => {
        return this.data.incomingFriendRequests;
    }

    // Get the list of outgoing friend requests
    getOutgoingFriendRequests = () => {
        return this.data.outgoingFriendRequests;
    }

    // See if another user is a friend
    isFriend = (friendUsername) => {
        if (friendUsername in this.data.friends) {
            return true;
        };
        return false;
    }

    // See if there is an incoming friend request from a user
    hasIncomingFriendRequest = (friendUsername) => {
        if(friendUsername in this.data.incomingFriendRequests) {
            return true;      
        }
        return false;
    }

    // Add a friend request coming from someone else
    addIncomingFriendRequest = (friendUsername) => {
        // Make sure they're not already friends
        if(this.isFriend(friendUsername)) {
            return false;
        }
        // Make sure they don't already have an incoming request
        // from this person.
        if(this.hasIncomingFriendRequest(friendUsername)) {
            return false;
        }
        this.data.incomingFriendRequests.push(friendUsername);
        return true;
    }

    // See if there is an outgoing friend request from a user
    hasOutgoingFriendRequest = (friendUsername) => {
        if(friendUsername in this.data.outgoingFriendRequests) {
            return true;
        }
        return false;
    }

    // Add a friend request going to someone else
    addOutgoingFriendRequest = (friendUsername) => {
        // Make sure they're not already friends
        if(this.isFriend(friendUsername)) {
            return false;
        }
        // Make sure they don't already have an outgoing request
        // to this person.
        if(this.hasOutgoingFriendRequest(friendUsername)) {
            return false;
        }
        this.data.outgoingFriendRequests.push(friendUsername);
        return true;
    }
}

export class Users {
    constructor () {
        this.users = {};
    }

    // Add user by providing user details
    addUser = (username, password, data, currentTokenID) => {
        // If user already exists with this username, don't allow
        if(username in this.users) {
            return false;
        }
        let user = new User();
        user.setUser(username, password, data, currentTokenID);
        this.users[username] = user;
        return user;
    }

    // Add user from data file
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
        user.updated = true;
        return tokenID;
    }
}