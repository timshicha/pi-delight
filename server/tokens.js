import { v4 as uuidv4 } from 'uuid';

export class Token {
    constructor (username) {
        this.username = username;
    }
}

export class Tokens {
    constructor () {
        this.tokens = {};
        setInterval(() => console.log(this.tokens), 10000);
    };

    createToken = (username, password) => {
        // Make sure the password is correct
        // ...

        let uuid = uuidv4();
        this.tokens[uuid] = new Token(username);
        return uuid;
    };

    destroyToken = (uuid) => {
        delete this.tokens[uuid];
    };
};