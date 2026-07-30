/**
 * Mobile-First Parametric Canvas Engine
 */
class ParametricCanvasApp {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.controlPanel = document.getElementById('controlPanel');
        this.sheetHandleBar = document.getElementById('sheetHandleBar');
        this.textInput = document.getElementById('textInput');
        this.shapeSelect = document.getElementById('shapeSelect');
        this.themeSelect = document.getElementById('themeSelect');
        this.speedSlider = document.getElementById('speedSlider');
        this.scaleSlider = document.getElementById('scaleSlider');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.exportPngBtn = document.getElementById('exportPngBtn');
        this.recordWebmBtn = document.getElementById('recordWebmBtn');
        this.zenBtn = document.getElementById('zenBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.statusMessage = document.getElementById('statusMessage');

        // Theme Palette Configurations
        this.themes = {
            neonPink: {
                textColor: '#ffb6c1',
                shadowColor: '#ff1493',
                bgGradientStart: '#18000a',
                bgGradientEnd: '#000000',
                dustColor: 'rgba(255, 182, 193, 0.35)'
            },
            cyberGold: {
                textColor: '#ffd700',
                shadowColor: '#ff8c00',
                bgGradientStart: '#1a1200',
                bgGradientEnd: '#000000',
                dustColor: 'rgba(255, 215, 0, 0.35)'
            },
            deepSea: {
                textColor: '#00f0ff',
                shadowColor: '#0077ff',
                bgGradientStart: '#001220',
                bgGradientEnd: '#000000',
                dustColor: 'rgba(0, 240, 255, 0.35)'
            }
        };

        // App State
        this.dpr = window.devicePixelRatio || 1;
        this.points = [];
        this.dustParticles = [];
        this.drawnCount = 0;
        this.isPlaying = true;
        this.isComplete = false;
        this.pulseAngle = 0;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];

        // Dynamic Settings
        this.customText = 'I love you';
        this.currentShape = 'heart';
        this.currentTheme = 'neonPink';
        this.speed = 1;
        this.scaleMultiplier = 10;

        this.init();
    }

    init() {
        this.parseUrlParameters();
        this.setupHighDpiCanvas();
        this.generateAdaptiveDustParticles();
        this.generateParametricPoints();
        this.bindEvents();
        this.syncUrlState();
        this.render();
    }

    /**
     * Retina High-DPI Resolution Setup with Dynamic Viewports
     */
    setupHighDpiCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.canvas.width = width * this.dpr;
        this.canvas.height = height * this.dpr;

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.ctx.resetTransform();
        this.ctx.scale(this.dpr, this.dpr);
    }

    /**
     * Adaptive Dust Particles based on Mobile GPU capability
     */
    generateAdaptiveDustParticles() {
        this.dustParticles = [];
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Adaptive performance scaling: 20 particles on mobile, 45 on desktop
        const isMobile = width < 600;
        const count = isMobile ? 20 : 45;

        for (let i = 0; i < count; i++) {
            this.dustParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 0.5,
                speedY: Math.random() * 0.4 + 0.1,
                driftX: (Math.random() - 0.5) * 0.2,
                opacity: Math.random() * 0.7 + 0.2
            });
        }
    }

    /**
     * Mathematical Curve Generators with Adaptive Point Densities
     */
    generateParametricPoints() {
        this.points = [];
        const isMobile = window.innerWidth < 600;
        
        const layersStart = 11;
        const layersEnd = 16;
        // Reduce sample points per layer on small mobile displays for battery efficiency
        const pointsPerLayer = isMobile ? 90 : 120;

        for (let layer = layersStart; layer <= layersEnd; layer++) {
            for (let i = 0; i < pointsPerLayer; i++) {
                const angle = (i * Math.PI * 2) / pointsPerLayer;
                let rawX = 0;
                let rawY = 0;

                if (this.currentShape === 'heart') {
                    rawX = 16 * Math.pow(Math.sin(angle), 3);
                    rawY = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
                } else if (this.currentShape === 'infinity') {
                    rawX = 18 * Math.sin(angle);
                    rawY = -(10 * Math.sin(2 * angle));
                } else if (this.currentShape === 'astroid') {
                    rawX = 16 * Math.pow(Math.cos(angle), 3);
                    rawY = -(16 * Math.pow(Math.sin(angle), 3));
                }

                const homeX = rawX * layer;
                const homeY = rawY * layer;

                this.points.push({
                    homeX: homeX,
                    homeY: homeY,
                    currX: homeX,
                    currY: homeY,
                    vx: 0,
                    vy: 0
                });
            }
        }

        this.drawnCount = 0;
        this.isComplete = false;
        this.pulseAngle = 0;
    }

    /**
     * Radial Spring Physics with Native Haptics
     */
    applyRepulsionForce(clickX, clickY) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const radius = 160;
        const forceStrength = 22;

        let triggered = false;

        for (let i = 0; i < this.points.length; i++) {
            const pt = this.points[i];
            const px = centerX + pt.currX * (this.scaleMultiplier / 10);
            const py = centerY + pt.currY * (this.scaleMultiplier / 10);

            const dx = px - clickX;
            const dy = py - clickY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius && dist > 0) {
                const force = (1 - dist / radius) * forceStrength;
                pt.vx += (dx / dist) * force;
                pt.vy += (dy / dist) * force;
                triggered = true;
            }
        }

        // Haptic Feedback API Call
        if (triggered && navigator.vibrate) {
            navigator.vibrate(12);
        }
    }

    /**
     * Unified Touch & Event Handling
     */
    bindEvents() {
        const handleResize = () => {
            this.setupHighDpiCanvas();
            this.generateAdaptiveDustParticles();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Control Inputs
        this.textInput.addEventListener('input', (e) => {
            this.customText = e.target.value || 'I love you';
            this.syncUrlState();
        });

        this.shapeSelect.addEventListener('change', (e) => {
            this.currentShape = e.target.value;
            this.generateParametricPoints();
            this.syncUrlState();
        });

        this.themeSelect.addEventListener('change', (e) => {
            this.currentTheme = e.target.value;
            this.syncUrlState();
        });

        this.speedSlider.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value, 10);
            this.syncUrlState();
        });

        this.scaleSlider.addEventListener('input', (e) => {
            this.scaleMultiplier = parseFloat(e.target.value);
            this.syncUrlState();
        });

        this.playPauseBtn.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            this.playPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
        });

        this.resetBtn.addEventListener('click', () => {
            this.generateParametricPoints();
            if (!this.isPlaying) {
                this.isPlaying = true;
                this.playPauseBtn.textContent = 'Pause';
            }
        });

        // Bottom Sheet Toggles with Dynamic Eye / Eye-Slash Icon Swap
        const togglePanel = () => {
            const isCollapsed = this.controlPanel?.classList.toggle('collapsed');
            const iconEl = this.zenBtn?.querySelector('i') || this.zenBtn;
            if (iconEl) {
                iconEl.classList.add('fa-solid');
                iconEl.classList.toggle('fa-eye-slash', isCollapsed);
                iconEl.classList.toggle('fa-eye', !isCollapsed);
            }
        };
        this.zenBtn?.addEventListener('click', togglePanel);
        this.sheetHandleBar?.addEventListener('click', togglePanel);

        // Keyboard Shortcut: 'H'
        window.addEventListener('keydown', (e) => {
            if ((e.key === 'h' || e.key === 'H') && document.activeElement !== this.textInput) {
                togglePanel();
            }
        });

        // Unified Pointer Events (Touch, Pen, Mouse)
        const handlePointer = (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.applyRepulsionForce(e.clientX - rect.left, e.clientY - rect.top);
        };

        this.canvas.addEventListener('pointerdown', handlePointer);
        this.canvas.addEventListener('pointermove', (e) => {
            if (e.buttons > 0 || e.pointerType === 'touch') {
                handlePointer(e);
            }
        });

        // Export Actions
        this.exportPngBtn.addEventListener('click', () => this.exportPNG());
        this.recordWebmBtn.addEventListener('click', () => this.recordWebM());
        this.shareBtn.addEventListener('click', () => this.shareUrl());
    }

    /**
     * Native Web Share API Integration
     */
    async shareUrl() {
        const shareData = {
            title: 'Parametric Mathematical Canvas',
            text: `Check out this parametric heart: "${this.customText}"!`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                this.showStatus('Shared successfully!');
            } catch (err) {
                // Share sheet cancelled
            }
        } else {
            // Fallback: Copy to Clipboard
            navigator.clipboard.writeText(window.location.href);
            this.showStatus('Link copied to clipboard!');
        }
    }

    syncUrlState() {
        const params = new URLSearchParams();
        params.set('text', this.customText);
        params.set('shape', this.currentShape);
        params.set('theme', this.currentTheme);
        params.set('speed', this.speed);
        params.set('scale', this.scaleMultiplier);

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    parseUrlParameters() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('text')) {
            this.customText = params.get('text');
            this.textInput.value = this.customText;
        }
        if (params.has('shape') && ['heart', 'infinity', 'astroid'].includes(params.get('shape'))) {
            this.currentShape = params.get('shape');
            this.shapeSelect.value = this.currentShape;
        }
        if (params.has('theme') && this.themes[params.get('theme')]) {
            this.currentTheme = params.get('theme');
            this.themeSelect.value = this.currentTheme;
        }
        if (params.has('speed')) {
            this.speed = parseInt(params.get('speed'), 10) || 5;
            this.speedSlider.value = this.speed;
        }
        if (params.has('scale')) {
            this.scaleMultiplier = parseFloat(params.get('scale')) || 10;
            this.scaleSlider.value = this.scaleMultiplier;
        }
    }

    exportPNG() {
        const image = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `parametric-${this.currentShape}-${Date.now()}.png`;
        link.href = image;
        link.click();
        this.showStatus('PNG Exported!');
    }

    recordWebM() {
        if (this.isRecording) return;

        this.isRecording = true;
        this.recordedChunks = [];
        this.showStatus('Recording 10s WebM clip...');

        const stream = this.canvas.captureStream(60);
        let options = { mimeType: 'video/webm;codecs=vp9' };

        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
        }

        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            this.showStatus('WebM recording not supported');
            this.isRecording = false;
            return;
        }

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `parametric-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            this.isRecording = false;
            this.showStatus('WebM Clip Saved!');
        };

        this.mediaRecorder.start();

        setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            }
        }, 11000);
    }

    showStatus(msg) {
        this.statusMessage.textContent = msg;
        setTimeout(() => {
            if (this.statusMessage.textContent === msg) {
                this.statusMessage.textContent = '';
            }
        }, 3500);
    }

    /**
     * Render & Physics Animation Loop
     */
    render = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const theme = this.themes[this.currentTheme];

        // 1. Background Fill
        const bgGradient = this.ctx.createRadialGradient(
            width / 2, height / 2, 10,
            width / 2, height / 2, Math.max(width, height) / 1.2
        );
        bgGradient.addColorStop(0, theme.bgGradientStart);
        bgGradient.addColorStop(1, theme.bgGradientEnd);

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, width, height);

        // 2. Atmospheric Dust Render Loop
        this.ctx.fillStyle = theme.dustColor;
        for (let i = 0; i < this.dustParticles.length; i++) {
            const p = this.dustParticles[i];
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();

            if (this.isPlaying) {
                p.y -= p.speedY;
                p.x += p.driftX;
                if (p.y < 0) {
                    p.y = height;
                    p.x = Math.random() * width;
                }
            }
        }

        // 3. Progress & Breathing
        if (this.isPlaying) {
            if (!this.isComplete) {
                this.drawnCount = Math.min(this.drawnCount + this.speed, this.points.length);
                if (this.drawnCount >= this.points.length) {
                    this.isComplete = true;
                }
            } else {
                this.pulseAngle += 0.035;
            }
        }

        const breatheScale = this.isComplete ? 1 + Math.sin(this.pulseAngle) * 0.035 : 1.0;
        const currentScale = (this.scaleMultiplier / 10) * breatheScale;
        const renderLimit = this.isComplete ? this.points.length : this.drawnCount;

        const centerX = width / 2;
        const centerY = height / 2;

        this.ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = theme.textColor;
        this.ctx.shadowColor = theme.shadowColor;
        this.ctx.shadowBlur = 8;

        // 4. Physics Loop & Rendering
        const stiffness = 0.08;
        const damping = 0.85;

        for (let i = 0; i < renderLimit; i++) {
            const pt = this.points[i];

            if (this.isPlaying) {
                const targetX = pt.homeX * currentScale;
                const targetY = pt.homeY * currentScale;

                const ax = (targetX - pt.currX) * stiffness;
                const ay = (targetY - pt.currY) * stiffness;

                pt.vx = (pt.vx + ax) * damping;
                pt.vy = (pt.vy + ay) * damping;

                pt.currX += pt.vx;
                pt.currY += pt.vy;
            }

            this.ctx.fillText(this.customText, centerX + pt.currX, centerY + pt.currY);
        }

        requestAnimationFrame(this.render);
    };
}

window.addEventListener('DOMContentLoaded', () => {
    new ParametricCanvasApp();
});
