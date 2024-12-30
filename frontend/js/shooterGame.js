import Matter from 'matter-js';
import NippleJS from 'nipplejs'; // used for joysticks
import boyAsset from '/assets/shooterGame/boy0.png';

const WIDTH = window.innerWidth < 450 ? window.innerWidth : 450;
const HEIGHT = window.innerHeight < 800 ? window.innerHeight : 800;

var joystickMoveVector = { x: 0, y: 0 };
var cameraPosition = { x: 0, y: 0};

var engine = null;
var render = null;
var ball = null;

const updateCamera = () => {
    Matter.Composite.translate(engine.world, {x: -cameraPosition.x + WIDTH / 2, y: -cameraPosition.y + HEIGHT / 2});
}

const matterUpdateTick = () => {
    ball.position.x += joystickMoveVector.x * 5;
    ball.position.y -= joystickMoveVector.y * 5;
    cameraPosition = ball.position;
    updateCamera();
}

export const modifyShooterGame = (state, ws, username, token) => {

    // check if a canvas exists inside the shooter game div or if we should create one
    if(!document.getElementById("shooterGameCanvas").hasChildNodes()) {

        // disable scrolling to reload
        document.getElementById("shooterGameDiv").addEventListener('touchmove', (event) => {
            event.preventDefault();
        }, {
            passive: false
        });

    

        // create an engine
        engine = Matter.Engine.create();
        

        // create a renderer
        render = Matter.Render.create({
            element: document.getElementById("shooterGameCanvas"),
            engine: engine,
            options: {
                width: WIDTH,
                height: HEIGHT,
                background: "#737d6d",
                wireframes: false
            }
        });

        // create a ball body
        ball = Matter.Bodies.circle(WIDTH / 2, 365, 45, {
            isStatic: true,
            render: {
                sprite: {
                    texture: boyAsset,
                    xScale: 90 / 720,
                    yScale: 90 / 720
                },
                fillStyle: "#32a852"
            }
        });

        var leftBorderWall = Matter.Bodies.rectangle(-500, 0, 30, 1000, { isStatic: true });
        var rightBorderWall = Matter.Bodies.rectangle(500, 0, 30, 1000, { isStatic: true });
        var topBorderWall = Matter.Bodies.rectangle(0, -500, 1000, 30, { isStatic: true });
        var bottomBorderWall = Matter.Bodies.rectangle(0, 500, 1000, 30, { isStatic: true });

        // add all of the bodies to the world
        Matter.Composite.add(engine.world, [ball, leftBorderWall, rightBorderWall, topBorderWall, bottomBorderWall]);

        // run the renderer
        Matter.Render.run(render);

        // create runner
        var runner = Matter.Runner.create();

        // run the engine
        Matter.Runner.run(runner, engine);

        Matter.Events.on(engine, "beforeUpdate", matterUpdateTick);
        setInterval(updateCamera, 1);

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

        joystick.on("move", (event, data) => {

            joystickMoveVector = data.vector;
        });

        joystick.on("end", (event, data) => {
            joystickMoveVector = { x: 0, y: 0 };
        })
    }
}