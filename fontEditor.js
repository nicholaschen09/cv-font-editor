class FontEditor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentChar = 'A';
        this.scale = 1;
        this.rotation = 0;
        this.distortion = 0;
        this.smoothness = 0.8;
        this.controlPoints = [];
        this.selectedPoint = null;
        this.font = null;
        this.glyph = null;

        // Character outline paths (simplified bezier curves for demonstration)
        this.characterPaths = this.generateBasicCharacterPaths();

        this.setupCanvas();
        this.loadDefaultFont();
        this.render();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Set up canvas styles
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    generateBasicCharacterPaths() {
        const paths = {};
        const centerX = 400;
        const centerY = 300;
        const size = 150;

        // Define basic character outlines with control points
        paths.A = {
            outline: [
                { x: centerX, y: centerY - size, type: 'moveTo' },
                { x: centerX - size * 0.7, y: centerY + size, type: 'lineTo' },
                { x: centerX - size * 0.3, y: centerY + size, type: 'lineTo' },
                { x: centerX - size * 0.2, y: centerY + size * 0.3, type: 'lineTo' },
                { x: centerX + size * 0.2, y: centerY + size * 0.3, type: 'lineTo' },
                { x: centerX + size * 0.3, y: centerY + size, type: 'lineTo' },
                { x: centerX + size * 0.7, y: centerY + size, type: 'lineTo' },
                { x: centerX, y: centerY - size, type: 'lineTo' }
            ],
            crossBar: [
                { x: centerX - size * 0.3, y: centerY + size * 0.1, type: 'moveTo' },
                { x: centerX + size * 0.3, y: centerY + size * 0.1, type: 'lineTo' }
            ]
        };

        paths.B = {
            outline: [
                { x: centerX - size * 0.5, y: centerY - size, type: 'moveTo' },
                { x: centerX - size * 0.5, y: centerY + size, type: 'lineTo' },
                { x: centerX + size * 0.3, y: centerY + size, type: 'lineTo' },
                { x: centerX + size * 0.5, y: centerY + size * 0.7, type: 'quadraticCurveTo', cp: { x: centerX + size * 0.6, y: centerY + size * 0.8 } },
                { x: centerX + size * 0.5, y: centerY + size * 0.3, type: 'quadraticCurveTo', cp: { x: centerX + size * 0.6, y: centerY + size * 0.2 } },
                { x: centerX + size * 0.2, y: centerY, type: 'lineTo' },
                { x: centerX + size * 0.4, y: centerY, type: 'lineTo' },
                { x: centerX + size * 0.5, y: centerY - size * 0.3, type: 'quadraticCurveTo', cp: { x: centerX + size * 0.6, y: centerY - size * 0.2 } },
                { x: centerX + size * 0.5, y: centerY - size * 0.7, type: 'quadraticCurveTo', cp: { x: centerX + size * 0.6, y: centerY - size * 0.8 } },
                { x: centerX + size * 0.3, y: centerY - size, type: 'lineTo' },
                { x: centerX - size * 0.5, y: centerY - size, type: 'lineTo' }
            ]
        };

        // Add more characters as needed...
        // For now, we'll generate similar patterns for other characters
        for (let i = 67; i <= 90; i++) { // C to Z
            const char = String.fromCharCode(i);
            paths[char] = this.generateGenericCharacter(centerX, centerY, size, char);
        }

        return paths;
    }

    generateGenericCharacter(centerX, centerY, size, char) {
        // Generate a simple rectangular character outline for demonstration
        return {
            outline: [
                { x: centerX - size * 0.4, y: centerY - size, type: 'moveTo' },
                { x: centerX + size * 0.4, y: centerY - size, type: 'lineTo' },
                { x: centerX + size * 0.4, y: centerY + size, type: 'lineTo' },
                { x: centerX - size * 0.4, y: centerY + size, type: 'lineTo' },
                { x: centerX - size * 0.4, y: centerY - size, type: 'lineTo' }
            ]
        };
    }

    async loadDefaultFont() {
        try {
            // For now, we'll work with our custom character paths
            // In a full implementation, you could load actual font files
            this.generateControlPoints();
        } catch (error) {
            console.warn('Could not load font, using default paths');
            this.generateControlPoints();
        }
    }

    generateControlPoints() {
        this.controlPoints = [];
        const charPath = this.characterPaths[this.currentChar];

        if (charPath && charPath.outline) {
            charPath.outline.forEach((point, index) => {
                if (point.type !== 'moveTo') {
                    this.controlPoints.push({
                        id: index,
                        x: point.x,
                        y: point.y,
                        originalX: point.x,
                        originalY: point.y,
                        selected: false,
                        type: point.type
                    });
                }
            });
        }
    }

    setCharacter(char) {
        this.currentChar = char;
        this.generateControlPoints();
        this.render();
    }

    applyTransformation(type, value) {
        switch (type) {
            case 'scale':
                this.scale = Math.max(0.1, Math.min(3, value));
                break;
            case 'rotate':
                this.rotation = value;
                break;
            case 'distort':
                this.distortion = Math.max(0, Math.min(100, value));
                break;
            case 'smooth':
                this.smoothness = Math.max(0, Math.min(1, value));
                break;
        }
        this.updateControlPointsFromTransform();
        this.render();
    }

    updateControlPointsFromTransform() {
        const centerX = this.canvas.width / (2 * window.devicePixelRatio);
        const centerY = this.canvas.height / (2 * window.devicePixelRatio);

        this.controlPoints.forEach(point => {
            // Apply scale
            let x = (point.originalX - centerX) * this.scale + centerX;
            let y = (point.originalY - centerY) * this.scale + centerY;

            // Apply rotation
            if (this.rotation !== 0) {
                const cos = Math.cos(this.rotation);
                const sin = Math.sin(this.rotation);
                const dx = x - centerX;
                const dy = y - centerY;
                x = centerX + dx * cos - dy * sin;
                y = centerY + dx * sin + dy * cos;
            }

            // Apply distortion
            if (this.distortion > 0) {
                const distortFactor = this.distortion / 100;
                x += Math.sin(y * 0.01) * distortFactor * 20;
                y += Math.cos(x * 0.01) * distortFactor * 10;
            }

            point.x = x;
            point.y = y;
        });
    }

    selectControlPoint(x, y) {
        const threshold = 15;
        this.selectedPoint = null;

        for (let point of this.controlPoints) {
            const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            if (distance < threshold) {
                this.selectedPoint = point;
                point.selected = true;
                break;
            } else {
                point.selected = false;
            }
        }

        this.render();
        return this.selectedPoint !== null;
    }

    moveSelectedPoint(x, y) {
        if (this.selectedPoint) {
            this.selectedPoint.x = x;
            this.selectedPoint.y = y;
            this.render();
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set up rendering context
        this.ctx.save();

        // Draw grid
        this.drawGrid();

        // Draw character outline
        this.drawCharacterOutline();

        // Draw control points
        this.drawControlPoints();

        // Draw character label
        this.drawCharacterLabel();

        this.ctx.restore();
    }

    drawGrid() {
        const spacing = 40;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;

        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        for (let x = 0; x <= width; x += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= height; y += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }

    drawCharacterOutline() {
        if (!this.controlPoints.length) return;

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        // Draw the character using control points
        if (this.controlPoints.length > 0) {
            this.ctx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);

            for (let i = 1; i < this.controlPoints.length; i++) {
                const point = this.controlPoints[i];
                if (point.type === 'quadraticCurveTo' && point.cp) {
                    this.ctx.quadraticCurveTo(point.cp.x, point.cp.y, point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            }

            this.ctx.closePath();
        }

        this.ctx.stroke();

        // Fill with semi-transparent color
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fill();
    }

    drawControlPoints() {
        this.controlPoints.forEach(point => {
            const size = point.selected ? 8 : 5;
            // Draw square control points like in the reference image
            this.ctx.fillStyle = point.selected ? '#ffffff' : '#ffffff';
            this.ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size);
        });
    }

    drawCharacterLabel() {
        const centerX = this.canvas.width / (2 * window.devicePixelRatio);
        const centerY = this.canvas.height / (2 * window.devicePixelRatio);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '200px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.globalAlpha = 0.1;
        this.ctx.fillText(this.currentChar, centerX, centerY);
        this.ctx.globalAlpha = 1;
    }

    reset() {
        this.scale = 1;
        this.rotation = 0;
        this.distortion = 0;
        this.smoothness = 0.8;
        this.generateControlPoints();
        this.render();
    }

    exportFont() {
        // This would implement actual font export functionality
        console.log('Exporting font data:', {
            character: this.currentChar,
            controlPoints: this.controlPoints,
            scale: this.scale,
            rotation: this.rotation,
            distortion: this.distortion,
            smoothness: this.smoothness
        });

        // Create downloadable data
        const fontData = {
            characters: {},
            metadata: {
                name: 'Custom Gestural Font',
                version: '1.0',
                created: new Date().toISOString()
            }
        };

        fontData.characters[this.currentChar] = {
            controlPoints: this.controlPoints,
            transformations: {
                scale: this.scale,
                rotation: this.rotation,
                distortion: this.distortion,
                smoothness: this.smoothness
            }
        };

        const blob = new Blob([JSON.stringify(fontData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom-font-${this.currentChar}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
} 