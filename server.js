const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.static(__dirname)); // <-- Add this line

app.use('/sounds', express.static(path.join(__dirname, 'sounds')));

app.get('/api/sounds', (req, res) => {
    const soundsDir = path.join(__dirname, 'sounds');
    fs.readdir(soundsDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read sounds folder' });
        // Filter for common audio file extensions
        const soundFiles = files.filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f));
        res.json(soundFiles);
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});