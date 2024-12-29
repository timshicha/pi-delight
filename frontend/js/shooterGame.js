import Matter from 'matter-js';
import NippleJS from 'nipplejs'; // used for joysticks

export const modifyShooterGame = (state, ws, username, token) => {

    // check if a canvas exists inside the shooter game div or if we should create one
    if(!document.getElementById("shooterGameCanvas").hasChildNodes()) {

        // disable scrolling to reload
        document.getElementById("shooterGameDiv").addEventListener('touchmove', (event) => {
            event.preventDefault();
        }, {
            passive: false
        });

        const WIDTH = window.innerWidth < 450 ? window.innerWidth : 450;
        const HEIGHT = window.innerHeight < 800 ? window.innerHeight : 800;

        // create an engine
        var engine = Matter.Engine.create();

        // create a renderer
        var render = Matter.Render.create({
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
        var ball = Matter.Bodies.circle(WIDTH / 2, 365, 45, {
            isStatic: false,
            render: {
                fillStyle: "#32a852"
            }
        });
        var box = Matter.Bodies.rectangle(400, 200, 80, 80);
        var ground = Matter.Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

        // add all of the bodies to the world
        Matter.Composite.add(engine.world, [ball, box, ground]);

        // run the renderer
        Matter.Render.run(render);

        // create runner
        var runner = Matter.Runner.create();

        // run the engine
        Matter.Runner.run(runner, engine);

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
    }
}