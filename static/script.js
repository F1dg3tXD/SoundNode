class Soundboard {
    constructor() {
        this.sounds = [];
        this.audioElements = {};
        this.themeToggle = document.getElementById('theme-toggle');
        this.soundboard = document.getElementById('soundboard');
        this.selectedDeviceId = null;
        this.init();
    }

    async init() {
        this.setupTheme();
        await this.loadSounds();
        this.renderButtons();
        this.setupEventListeners();
        this.populateAudioDeviceDropdown();
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
        }
    }

    async loadSounds() {
        try {
            const response = await fetch('/api/sounds');
            const files = await response.json();
            this.sounds = files.map(file => ({
                name: file.replace(/\.[^/.]+$/, ''),
                file: `sounds/${file}`
            }));

            this.sounds.forEach(sound => {
                const audio = new Audio(sound.file);
                audio.preload = 'auto';
                this.audioElements[sound.name] = audio;
            });
            // Apply selected device if available
            if (this.selectedDeviceId) {
                this.applyDeviceToAll(this.selectedDeviceId);
            }
        } catch (err) {
            console.error('Failed to load sounds:', err);
        }
    }

    renderButtons() {
        this.soundboard.innerHTML = '';
        this.sounds.forEach((sound, index) => {
            const button = document.createElement('button');
            button.className = 'sound-button';
            button.textContent = this.formatName(sound.name);
            button.dataset.sound = sound.name;
            button.style.animationDelay = `${index * 0.05}s`;
            button.addEventListener('click', () => this.playSound(sound.name, button));
            this.soundboard.appendChild(button);
        });
    }

    formatName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/[-_]/g, ' ');
    }

    async playSound(soundName, button) {
        const audio = this.audioElements[soundName];
        if (!audio) {
            console.error(`Sound ${soundName} not found`);
            return;
        }
        Object.values(this.audioElements).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        document.querySelectorAll('.sound-button').forEach(btn => {
            btn.classList.remove('playing');
        });
        try {
            await audio.play();
            button.classList.add('playing');
            audio.onended = () => {
                button.classList.remove('playing');
            };
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    setupEventListeners() {
        this.themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLightMode = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
        });
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.stopAllSounds();
            }
        });
    }

    stopAllSounds() {
        Object.values(this.audioElements).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        document.querySelectorAll('.sound-button').forEach(btn => {
            btn.classList.remove('playing');
        });
    }

    async applyDeviceToAll(deviceId) {
        for (const audio of Object.values(this.audioElements)) {
            if (typeof audio.setSinkId === 'function') {
                try {
                    await audio.setSinkId(deviceId);
                } catch (e) {
                    console.error('Failed to set sinkId:', e);
                }
            }
        }
    }

    // Device selection logic for Electron
    setupDeviceSelector() {
        if (window.electron && window.electron.ipcRenderer) {
            window.electron.ipcRenderer.on('request-device-list', async () => {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
                window.electron.ipcRenderer.send('device-list', audioOutputs);
            });
            window.electron.ipcRenderer.on('set-device', async (event, deviceId) => {
                this.selectedDeviceId = deviceId;
                this.applyDeviceToAll(deviceId);
            });
        }
    }

    async populateAudioDeviceDropdown() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        const select = document.getElementById('audio-device-select');
        if (!select) return;
        select.innerHTML = '';
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        audioOutputs.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || device.deviceId;
            select.appendChild(option);
        });
        select.onchange = async () => {
            const deviceId = select.value;
            this.selectedDeviceId = deviceId;
            await this.applyDeviceToAll(deviceId);
        };
        // If previously selected, set it
        if (this.selectedDeviceId) {
            select.value = this.selectedDeviceId;
        }
    }
}

// Electron device selection event listener
if (window.require) {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.on('request-device-list', async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        ipcRenderer.send('device-list', audioOutputs);
    });
    ipcRenderer.on('set-device', async (event, deviceId) => {
        window.selectedDeviceId = deviceId;
        if (window.soundboard && typeof window.soundboard.applyDeviceToAll === 'function') {
            window.soundboard.applyDeviceToAll(deviceId);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    window.soundboard = new Soundboard();
});
