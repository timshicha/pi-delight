import Matter from 'matter-js';
import NippleJS from 'nipplejs'; // used to make UI joysticks
import boyAsset from '/assets/shooterGame/boy0.png';
import rightPistolAsset from '/assets/shooterGame/pistolRight.svg';
import leftPistolAsset from '/assets/shooterGame/pistolLeft.svg';

// size of the Matter game window
const WIDTH = window.innerWidth < 450 ? window.innerWidth : 450;
const HEIGHT = window.innerHeight < 800 ? window.innerHeight : 800;

// size of the map in pixels
const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;

var joystickMoveVector = { x: 0, y: 0 }; // stores the position the joystick is in (values are between -1 and 1)

var playerFacingAngle = 45; // the angle in which the player is facing based on the joystick

var engine = null;
var render = null;
var player = null; // the client's player body
var playerWeapon = null; // the client's weapon that follows the player body

var otherPlayers = {}; // holds all the data for the other players in the game (key is the username of that player)

// updates the camera to look at the player
const updateCamera = () => {
    // set the render bounds to match the player's position
    // creating an effect where is seems like the camera follows the player
    render.bounds.min.x = player.position.x - render.options.width / 2;
    render.bounds.max.x = player.position.x + render.options.width / 2;
    render.bounds.min.y = player.position.y - render.options.height / 2;
    render.bounds.max.y = player.position.y + render.options.height / 2;
}

// moves the player body to a given position
const movePlayerBody = (position) => {

    // check if the player is trying to move into a border
    if(position.x > MAP_WIDTH / 2) { position.x = MAP_WIDTH / 2 }
    if(position.x < -MAP_WIDTH / 2) { position.x = -MAP_WIDTH / 2 }
    if(position.y > MAP_HEIGHT / 2) { position.y = MAP_HEIGHT / 2 }
    if(position.y < -MAP_HEIGHT / 2) { position.y = -MAP_HEIGHT / 2 }

    // set the positions of the player and weapon accordingly
    Matter.Body.setPosition(player, position);
    Matter.Body.setPosition(playerWeapon, {
        x: player.position.x + (70 * Math.cos(-playerFacingAngle * Math.PI / 180)),
        y: player.position.y + (70 * Math.sin(-playerFacingAngle * Math.PI / 180))
    });
    
    // set the angle of the weapon and the proper sprite based on the direction the joystick is facing
    // the joystick is facing left
    if(playerFacingAngle > 90 && playerFacingAngle < 270) {
        Matter.Body.setAngle(playerWeapon, -(playerFacingAngle+180) * Math.PI / 180);
        playerWeapon.render.sprite.texture = leftPistolAsset;
    }
    // the joystick is facing right
    else {
        Matter.Body.setAngle(playerWeapon, -playerFacingAngle * Math.PI / 180);
        playerWeapon.render.sprite.texture = rightPistolAsset;
    }
    
    updateCamera(); // update the camera so that it remains following the player
}

// called every game tick
const matterUpdateTick = () => {
    movePlayerBody({
        x: player.position.x + joystickMoveVector.x * 5,
        y: player.position.y - joystickMoveVector.y * 5
    });
    
}

export const modifyShooterGame = (state, ws, username, token) => {

    // check if a canvas exists inside the shooter game div or if we should create one
    if(!document.getElementById("shooterGameCanvas").hasChildNodes()) {

        // disable scrolling to reload on mobile devices
        document.getElementById("shooterGameDiv").addEventListener('touchmove', (event) => {
            event.preventDefault();
        }, {
            passive: false
        });

        // called when the shoot button is clicked
        document.getElementById("shooterGameShootButton").addEventListener("click", () => {
            
        });

        engine = Matter.Engine.create();

        render = Matter.Render.create({
            element: document.getElementById("shooterGameCanvas"),
            engine: engine,
            options: {
                width: WIDTH,
                height: HEIGHT,
                background: "#737d6d",
                hasBounds: true, // tells the renderer to use the bounds that we give it. used for camera following
                wireframes: false
            }
        });

        // create a player body
        player = Matter.Bodies.circle(0, 0, 45, {
            isStatic: true,
            render: {
                sprite: {
                    texture: boyAsset,
                    xScale: 90 / 720,
                    yScale: 90 / 720
                }
            }
        });

        // create a weapon body that orbits the player
        playerWeapon = Matter.Bodies.circle(WIDTH / 2, 365, 30, {
            isStatic: true,
            render: {
                sprite: {
                    texture: rightPistolAsset,
                    xScale: 60 / 256,
                    yScale: 60 / 256
                }
            }
        });

        // these options are used for all the border wall body options
        var borderWallOptions = {
            isStatic: true,
            render: {
                fillStyle: "#212121",
                strokeStyle: "#212121"
            }
        };

        var leftBorderWall = Matter.Bodies.rectangle(-MAP_WIDTH / 2, 0, 30, MAP_HEIGHT, borderWallOptions);
        var rightBorderWall = Matter.Bodies.rectangle(MAP_WIDTH / 2, 0, 30, MAP_HEIGHT, borderWallOptions);
        var topBorderWall = Matter.Bodies.rectangle(0, -MAP_HEIGHT / 2, MAP_WIDTH + 30, 30, borderWallOptions);
        var bottomBorderWall = Matter.Bodies.rectangle(0, MAP_HEIGHT / 2, MAP_WIDTH + 30, 30, borderWallOptions);

        // add all of the bodies to the world
        Matter.Composite.add(engine.world, [
            player,
            playerWeapon,
            leftBorderWall,
            rightBorderWall,
            topBorderWall,
            bottomBorderWall
        ]);

        // run the renderer
        Matter.Render.run(render);

        var runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        Matter.Events.on(engine, "beforeUpdate", matterUpdateTick);

        // constantly send the player position to the server
        setInterval(() => {
            ws.send(JSON.stringify({
                messageType: "gameMove",
                username: username,
                token: token,
                game: "Shooter Game",
                moveInfo: {
                    moveType: "playerMove",
                    newPosition: player.position
                }
            }));
        }, 50);

        // create the joystick inside the joystick div
        const joystick = NippleJS.create({
            zone: document.getElementById("shooterGameJoystickDiv"),
            mode: "static",
            position: { 
                left: "50%",
                bottom: "15%"
            },
            color: "white"
        });

        // called when the joystick is moved
        joystick.on("move", (event, data) => {
            playerFacingAngle = data.angle.degree;
            joystickMoveVector = data.vector;
        });

        // called when the joystick move ends
        joystick.on("end", (event, data) => {
            joystickMoveVector = { x: 0, y: 0 };
        })
    }

    console.log(state);

    // loop through all the game players
    for(let currentUsername of Object.keys(state.game.players)) {
        const currentPlayer = state.game.players[currentUsername];

        // if the player username is the same as the client username, don't add it
        if(currentUsername === username) continue

        // check if the current player exists in the client players dictionary
        if(otherPlayers[currentUsername] !== undefined) {
            otherPlayers[currentUsername].playerBody.position = currentPlayer.position;
            otherPlayers[currentUsername].playerWeaponBody.position = {
                x: currentPlayer.position.x + 50,
                y: currentPlayer.position.y
            };
        }
        // if the current player doesn't exist, then create a the object and the bodies for it
        else {
            // create the player body
            let currentPlayerBody = Matter.Bodies.circle(0, 0, 45, {
                isStatic: true,
                render: {
                    sprite: {
                        texture: boyAsset,
                        xScale: 90 / 720,
                        yScale: 90 / 720
                    }
                }
            });
    
            // create the weapon body for the player
            let currentPlayerWeaponBody = Matter.Bodies.circle(0, 0, 30, {
                isStatic: true,
                render: {
                    sprite: {
                        texture: rightPistolAsset,
                        xScale: 60 / 256,
                        yScale: 60 / 256
                    }
                }
            });

            // add the newly created player to the world
            Matter.Composite.add(engine.world, [
                currentPlayerBody,
                currentPlayerWeaponBody
            ]);

            // add the current player object into the client's other players dictionary
            otherPlayers[currentUsername] = {
                playerBody: currentPlayerBody,
                playerWeaponBody: currentPlayerWeaponBody
            };
        }
    }
}