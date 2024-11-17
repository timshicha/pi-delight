// The server stores data (like users) into json files.
// When the server is booted up, the data is loaded from the
// files and into memory. The json files are occasionally
// updated.
import fs from 'fs';

const USERS_PATH = './filesystem/users/'

export class Save_Load {
    static save_user = (user) => {
        const jsonString = user.toJSON();
        let success = false;
        fs.writeFile(`${USERS_PATH}${user.username}.json`, jsonString, (err) => {
            if(err) {
                console.log('Could not write to file:', err);
            }
            else {
                success = true;
            }
        });
        return success;
    }

    static save_users = (users) => {
        for (const key in users.users) {
            // If an update was made to the user, store the update in the
            // file system.
            const user = users.users[key];
            if(user.updated) {
                this.save_user(user);
                user.updated = false;
            }
        }
    }
}