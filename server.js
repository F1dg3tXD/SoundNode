const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Get user data path from Electron
let userDataPath;
try {
    userDataPath = require('electron').app.getPath('userData');
} catch {
    // Fallback for dev mode (not running in Electron)
    userDataPath = path.join(__dirname, 'userData');
}
const userSoundsDir = path.join(userDataPath, 'sounds');
const defaultSoundsDir = path.join(__dirname, 'static', 'sounds');

// Ensure user sounds folder exists and copy defaults if needed
if (!fs.existsSync(userSoundsDir)) {
    fs.mkdirSync(userSoundsDir, { recursive: true });
    // Copy default sounds
    if (fs.existsSync(defaultSoundsDir)) {
        fs.readdirSync(defaultSoundsDir).forEach(file => {
            const src = path.join(defaultSoundsDir, file);
            const dest = path.join(userSoundsDir, file);
            if (fs.statSync(src).isFile()) {
                fs.copyFileSync(src, dest);
            }
        });
    }
}

// Serve the static web app from the `static` folder
app.use(express.static(path.join(__dirname, 'static')));

// Serve sounds from user data folder
app.use('/sounds', express.static(userSoundsDir));

app.get('/api/sounds', (req, res) => {
    fs.readdir(userSoundsDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read sounds folder' });
        const soundFiles = files.filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f));
        res.json(soundFiles);
    });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});