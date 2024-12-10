const pathToImages = '/assets/match/';

export const matchImagePaths = [
'alien.png',
'apple.png',
'ark.png',
'blueRose.png',
'bowAndArrow.png',
'brocoliFace.png',
'cat.png',
'cellTower.png',
'cone.png',
'doors.png',
'dumbbell.png',
'house.png',
'jupiterRock.png',
'lock.png',
'shorts.png',
'snowboarder.png',
'soccerBall.png',
'syringe.png',
'ufo.png',
'wheelbarrow.png'
];

// Add path to each image
for (let i = 0; i < matchImagePaths.length; i++) {
    matchImagePaths[i] = pathToImages + matchImagePaths[i];
}