const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Serve the static web app from the `static` folder
app.use(express.static(path.join(__dirname, 'static')));

// Serve sounds from static/sounds
app.use('/sounds', express.static(path.join(__dirname, 'static', 'sounds')));

app.get('/api/sounds', (req, res) => {
    const soundsDir = path.join(__dirname, 'static', 'sounds');
    fs.readdir(soundsDir, (err, files) => {
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