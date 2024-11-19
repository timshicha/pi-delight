import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();
const HOST = process.env.VITE_DEV_CLIENT_HOST
const PORT = process.env.VITE_DEV_CLIENT_PORT || 3000;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log(process.env);

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Catch-all route to serve index.html for any request
app.get('*', (req, res) => {
    if(req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
