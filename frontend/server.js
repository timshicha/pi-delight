import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const PORT = process.env.PORT || 3000;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Catch-all route to serve index.html for any request
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
