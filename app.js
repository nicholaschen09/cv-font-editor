class GesturalFontApp {
    constructor() {
        this.fontEditor = null;
        this.gestureRecognition = null;
        this.isInitialized = false;
        this.gestureMode = 'character'; // character, scale, rotate, distort
        this.lastGestureData = null;
        this.smoothingFactor = 0.1;

        // UI elements
        this.elements = {
            fontCanvas: document.getElementById('fontCanvas'),
            videoElement: document.getElementById('videoElement'),
            overlayCanvas: document.getElementById('overlayCanvas'),
            exportBtn: document.getElementById('exportBtn'),
            currentChar: document.getElementById('currentChar'),
            distortionValue: document.getElementById('distortionValue'),
            distortionBar: document.getElementById('distortionBar'),
            smoothnessValue: document.getElementById('smoothnessValue'),
            smoothnessBar: document.getElementById('smoothnessBar'),
            adjustingMode: document.getElementById('adjustingMode'),
            handStatus: document.getElementById('handStatus'),
            gestureType: document.getElementById('gestureType'),
            letterWheel: document.querySelector('.letter-wheel'),
            selectedLetter: document.getElementById('selectedLetter'),
            wheelLetters: document.querySelector('.wheel-letters'),
            wheelPreviewCanvas: document.getElementById('wheelPreviewCanvas')
        };

        // Letter wheel properties
        this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        this.currentLetterIndex = 0;
        this.lastRotation = 0;

        // Preview canvas for wheel center
        this.previewCtx = null;

        this.initialize();
    }

    async initialize() {
        try {
            // Initialize font editor
            this.fontEditor = new FontEditor(this.elements.fontCanvas);

            // Setup overlay canvas
            this.setupOverlayCanvas();

            // Initialize gesture recognition
            this.gestureRecognition = new GestureRecognition(
                this.elements.videoElement,
                this.elements.overlayCanvas
            );

            // Setup gesture callbacks
            this.setupGestureCallbacks();

            // Setup UI event listeners
            this.setupUIEventListeners();

            // Create letter wheel
            this.createLetterWheel();

            // Initialize preview canvas
            this.initializePreviewCanvas();

            this.isInitialized = true;
            console.log('Gestural Font App initialized successfully');

        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    setupOverlayCanvas() {
        const overlay = this.elements.overlayCanvas;
        const workspace = document.querySelector('.ar-workspace');

        // Sync overlay canvas size with workspace
        const updateOverlaySize = () => {
            const rect = workspace.getBoundingClientRect();
            overlay.width = rect.width;
            overlay.height = rect.height;
        };

        this.elements.videoElement.addEventListener('loadedmetadata', updateOverlaySize);
        window.addEventListener('resize', updateOverlaySize);

        // Initial setup
        setTimeout(updateOverlaySize, 1000);
    }

    setupGestureCallbacks() {
        // Hand detection callbacks
        this.gestureRecognition.onHandDetected = (landmarks) => {
            this.elements.handStatus.textContent = 'YES';
            this.elements.videoElement.classList.add('hand-detected');
        };

        this.gestureRecognition.onHandLost = () => {
            this.elements.handStatus.textContent = 'NO';
            this.elements.videoElement.classList.remove('hand-detected');
            this.elements.gestureType.textContent = 'None';
        };

        // Gesture change callback
        this.gestureRecognition.onGestureChange = (gesture, data) => {
            this.elements.gestureType.textContent = gesture;
            this.lastGestureData = data;
            this.handleGesture(gesture, data);
        };
    }

    handleGesture(gesture, data) {
        if (!this.fontEditor || !data) return;

        const fontCanvas = this.elements.fontCanvas;
        const canvasRect = fontCanvas.getBoundingClientRect();

        switch (gesture) {
            case 'point':
                this.handlePointGesture(data, canvasRect);
                break;
            case 'pinch':
                // Check if we're doing letter selection or scaling
                const pinchDistance = data.pinchDistance || 0.05;
                if (pinchDistance < 0.04) {
                    this.handleLetterSelection(data);
                } else {
                    this.handlePinchGesture(data);
                }
                break;
            case 'fist':
                this.handleFistGesture(data);
                break;
            case 'open':
                this.handleOpenHandGesture(data);
                break;
            case 'two_fingers':
                this.handleTwoFingerGesture(data);
                break;
        }

        this.updateUI();
    }

    handlePointGesture(data, canvasRect) {
        // Remove letter wheel active state
        this.elements.letterWheel.classList.remove('active');

        // Map normalized finger position to canvas coordinates
        const fingerPos = this.gestureRecognition.normalizedToCanvas(
            data.indexTip,
            { width: canvasRect.width, height: canvasRect.height }
        );

        // Adjust for canvas position on page
        const fontCanvasX = fingerPos.x;
        const fontCanvasY = fingerPos.y;

        // Try to select a control point
        if (this.fontEditor.selectControlPoint(fontCanvasX, fontCanvasY)) {
            this.elements.adjustingMode.textContent = 'CONTROL POINT';
        } else {
            this.elements.adjustingMode.textContent = 'CHARACTER';
        }

        // Move selected point if any
        this.fontEditor.moveSelectedPoint(fontCanvasX, fontCanvasY);
    }

    handlePinchGesture(data) {
        this.elements.adjustingMode.textContent = 'SCALE';
        this.elements.letterWheel.classList.remove('active');

        // Use pinch distance to control scale
        const pinchDistance = data.pinchDistance || 0.05;
        const maxDistance = 0.15;
        const minDistance = 0.02;

        // Normalize pinch distance to scale factor
        const normalizedDistance = Math.max(0, Math.min(1,
            (pinchDistance - minDistance) / (maxDistance - minDistance)
        ));

        const scale = 0.5 + normalizedDistance * 2; // Scale range: 0.5 - 2.5
        this.fontEditor.applyTransformation('scale', scale);
    }

    handleFistGesture(data) {
        this.elements.adjustingMode.textContent = 'DISTORTION';
        this.elements.letterWheel.classList.remove('active');

        // Use hand movement to control distortion
        const palmCenter = data.palmCenter;
        const handSize = data.handSize;

        // Calculate distortion based on hand movement
        const distortionFactor = Math.min(100, handSize * 500);
        this.fontEditor.applyTransformation('distort', distortionFactor);
    }

    handleOpenHandGesture(data) {
        this.elements.adjustingMode.textContent = 'RESET';
        this.elements.letterWheel.classList.remove('active');

        // Gradually reset transformations
        const currentScale = this.fontEditor.scale;
        const currentRotation = this.fontEditor.rotation;
        const currentDistortion = this.fontEditor.distortion;

        // Smooth reset
        this.fontEditor.applyTransformation('scale',
            currentScale + (1 - currentScale) * this.smoothingFactor
        );
        this.fontEditor.applyTransformation('rotate',
            currentRotation * (1 - this.smoothingFactor)
        );
        this.fontEditor.applyTransformation('distort',
            currentDistortion * (1 - this.smoothingFactor)
        );
    }

    handleTwoFingerGesture(data) {
        this.elements.adjustingMode.textContent = 'ROTATION';
        this.elements.letterWheel.classList.remove('active');

        // Use finger rotation to control character rotation
        const rotation = data.rotation || 0;
        this.fontEditor.applyTransformation('rotate', rotation);
    }

    handleLetterSelection(data) {
        // Use thumb+index rotation for letter selection
        this.elements.adjustingMode.textContent = 'LETTER SELECT';
        this.elements.letterWheel.classList.add('active');

        const rotation = data.thumbIndexRotation || 0;
        this.updateLetterSelection(rotation);
    }

    updateLetterSelection(rotation) {
        // Map rotation to letter index (26 letters in circle)
        const normalizedRotation = rotation / (2 * Math.PI);
        let newLetterIndex = Math.floor(normalizedRotation * this.letters.length) % this.letters.length;

        // Ensure positive index
        if (newLetterIndex < 0) newLetterIndex += this.letters.length;

        if (newLetterIndex !== this.currentLetterIndex) {
            this.currentLetterIndex = newLetterIndex;
            const selectedLetter = this.letters[this.currentLetterIndex];

            // Update display
            this.elements.selectedLetter.textContent = selectedLetter;
            this.fontEditor.setCharacter(selectedLetter);
            this.updateLetterWheel();
            this.renderWheelPreview();
            this.updateUI();
        }
    }

    updateUI() {
        // Update property displays
        this.elements.currentChar.textContent = this.fontEditor.currentChar;

        // Update distortion display
        const distortion = Math.round(this.fontEditor.distortion);
        this.elements.distortionValue.textContent = `${distortion}%`;
        this.elements.distortionBar.style.width = `${distortion}%`;

        // Update smoothness display
        const smoothness = this.fontEditor.smoothness.toFixed(1);
        this.elements.smoothnessValue.textContent = smoothness;
        this.elements.smoothnessBar.style.width = `${smoothness * 100}%`;
    }

    createLetterWheel() {
        const wheelLetters = this.elements.wheelLetters;
        const radius = 160; // Larger radius for more spacing
        const centerX = 200; // Center of the 400px wheel
        const centerY = 200;

        // Clear existing letters
        wheelLetters.innerHTML = '';

        this.letters.forEach((letter, index) => {
            const angle = (index / this.letters.length) * 2 * Math.PI - Math.PI / 2; // Start from top
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            const letterElement = document.createElement('div');
            letterElement.className = 'wheel-letter';
            letterElement.textContent = letter;
            letterElement.style.left = `${x - 10}px`; // Center the 20px wide element
            letterElement.style.top = `${y - 10}px`; // Center the 20px tall element
            letterElement.dataset.index = index;

            wheelLetters.appendChild(letterElement);
        });

        this.updateLetterWheel();
    }

    initializePreviewCanvas() {
        const canvas = this.elements.wheelPreviewCanvas;
        this.previewCtx = canvas.getContext('2d');

        // Set up canvas for high DPI
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        this.previewCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Initial render
        this.renderWheelPreview();
    }

    renderWheelPreview() {
        if (!this.previewCtx || !this.fontEditor) return;

        const canvas = this.elements.wheelPreviewCanvas;
        const ctx = this.previewCtx;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get current character path from fontEditor
        const char = this.letters[this.currentLetterIndex];
        const charPath = this.fontEditor.characterPaths[char];

        if (charPath && charPath.outline) {
            // Scale and center the character for the preview
            const scale = 0.3; // Much smaller for the wheel center
            const centerX = 60; // Half of 120px
            const centerY = 60;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);

            // Draw character outline
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8; // Thicker for visibility
            ctx.beginPath();

            charPath.outline.forEach((point, index) => {
                if (point.type === 'moveTo' || index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else if (point.type === 'quadraticCurveTo' && point.cp) {
                    ctx.quadraticCurveTo(point.cp.x, point.cp.y, point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });

            // Add black outline for visibility
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 12;
            ctx.stroke();

            // White outline on top
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.stroke();

            ctx.restore();
        }
    }

    updateLetterWheel() {
        const letters = this.elements.wheelLetters.querySelectorAll('.wheel-letter');
        letters.forEach((letterEl, index) => {
            if (index === this.currentLetterIndex) {
                letterEl.classList.add('selected');
            } else {
                letterEl.classList.remove('selected');
            }
        });
    }

    setupUIEventListeners() {

        // Reset button

        // Export button
        this.elements.exportBtn.addEventListener('click', () => {
            this.fontEditor.exportFont();
        });

        // Canvas resize handling
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.fontEditor.setupCanvas();
                this.fontEditor.render();
                this.setupOverlayCanvas();
            }, 100);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Mouse interaction for font canvas (fallback)
        this.elements.fontCanvas.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });

        this.elements.fontCanvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        this.elements.fontCanvas.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });
    }

    handleKeyboardShortcuts(e) {
        switch (e.key) {
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.fontEditor.reset();
                    this.updateUI();
                }
                break;
            case 'e':
            case 'E':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.fontEditor.exportFont();
                }
                break;
            case 'ArrowLeft':
                this.selectPreviousCharacter();
                break;
            case 'ArrowRight':
                this.selectNextCharacter();
                break;
        }
    }

    selectPreviousCharacter() {
        this.currentLetterIndex = (this.currentLetterIndex - 1 + this.letters.length) % this.letters.length;
        const selectedLetter = this.letters[this.currentLetterIndex];
        this.elements.selectedLetter.textContent = selectedLetter;
        this.fontEditor.setCharacter(selectedLetter);
        this.updateLetterWheel();
        this.renderWheelPreview();
        this.updateUI();
    }

    selectNextCharacter() {
        this.currentLetterIndex = (this.currentLetterIndex + 1) % this.letters.length;
        const selectedLetter = this.letters[this.currentLetterIndex];
        this.elements.selectedLetter.textContent = selectedLetter;
        this.fontEditor.setCharacter(selectedLetter);
        this.updateLetterWheel();
        this.renderWheelPreview();
        this.updateUI();
    }

    handleMouseDown(e) {
        const rect = this.elements.fontCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.fontEditor.selectControlPoint(x, y);
        this.isMouseDown = true;
    }

    handleMouseMove(e) {
        if (!this.isMouseDown) return;

        const rect = this.elements.fontCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.fontEditor.moveSelectedPoint(x, y);
    }

    handleMouseUp(e) {
        this.isMouseDown = false;
    }

    // Utility methods
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    destroy() {
        if (this.gestureRecognition) {
            this.gestureRecognition.destroy();
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const app = new GesturalFontApp();

    // Global error handling
    window.addEventListener('error', (e) => {
        console.error('Application error:', e);
        app.showNotification('An error occurred. Check console for details.', 'error');
    });

    // Show initial notification
    setTimeout(() => {
        app.showNotification('Gestural Font Editor loaded! Grant camera permission to start.', 'info');
    }, 1000);
});

// Export for global access
window.GesturalFontApp = GesturalFontApp; 