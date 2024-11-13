import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import path, { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();
const HOST = process.env.VITE_DEV_SERVER_HOST
const PORT = process.env.VITE_DEV_SERVER_PORT || 80;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wss = new WebSocketServer({
    port: PORT
});
console.log(`Server running on http://${HOST}:${PORT}`);

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        console.log(`received ${data}`);
    });
    console.log('attempted to connect');
    ws.send('this is a response');
});