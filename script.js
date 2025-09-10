class Soundboard {
    constructor() {
        this.sounds = [];
        this.audioElements = {};
        this.themeToggle = document.getElementById('theme-toggle');
        this.soundboard = document.getElementById('soundboard');
        this.init();
    }

    async init() {
        this.setupTheme();
        await this.loadSounds();
        this.renderButtons();
        this.setupEventListeners();
        // Remove setupDragAndDrop for now (not supported in web version)
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
}

document.addEventListener('DOMContentLoaded', () => {
    new Soundboard();
});