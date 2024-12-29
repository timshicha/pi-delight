export class ShooterGame {
    constructor(players, sendRefreshFunc) {

        this.gameType = "Shooter Game";

        this.players = {}; // username: {matches: 0, gender: 'boy'}
        this.sendRefreshFunc = sendRefreshFunc;

        this.sendRefreshFunc();
    }

    getVisibleState = () => {
        return {};
    }

    removePlayer = (username) => {
        return;
    }
}