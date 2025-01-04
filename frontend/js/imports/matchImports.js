const pathToMatchImages = '/assets/match/';
const pathToPlayerIcons = '/assets/playerIcons/';

export const matchImagePaths = [
    'camel.svg',
    'deer.svg',
    'dog.svg',
    'fox.svg',
    'frog.svg',
    'giraffe.svg',
    'gorilla.svg',
    'lion.svg',
    'monkey.svg',
    'owl.svg',
    'parrot.svg',
    'penguin.svg',
    'polarBear.svg',
    'racoon.svg',
    'seal.svg',
    'shark.svg',
    'squirrel.svg',
    'tiger.svg',
    'wolf.svg',
    'zebra.svg'
];

// Add path to each image
for (let i = 0; i < matchImagePaths.length; i++) {
    matchImagePaths[i] = pathToMatchImages + matchImagePaths[i];
}

export const playerIcons = [
    'boy0',
    'boy1',
    'girl0',
    'girl1'
];

export const iconToPath = (playerIcon) => {
    return pathToPlayerIcons + playerIcon + ".png";
}

// Add path to each image
// for (let i = 0; i < playerIconPaths.length; i++) {
//     playerIconPaths[i] = pathToPlayerIcons + playerIconPaths[i];
// }