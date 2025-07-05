class GestureRecognition {
    constructor(videoElement, overlayCanvas) {
        this.videoElement = videoElement;
        this.overlayCanvas = overlayCanvas;
        this.overlayCtx = overlayCanvas.getContext('2d');
        this.hands = null;
        this.camera = null;
        this.isInitialized = false;
        this.currentGesture = 'none';
        this.handLandmarks = null;
        this.gestureHistory = [];
        this.gestureThreshold = 0.7;

        // Gesture detection parameters
        this.pinchThreshold = 0.05;
        this.pointThreshold = 0.08;
        this.fistThreshold = 0.6;

        // Gesture callbacks
        this.onGestureChange = null;
        this.onHandDetected = null;
        this.onHandLost = null;

        this.initializeMediaPipe();
    }

    async initializeMediaPipe() {
        try {
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults(this.onResults.bind(this));

            // Initialize camera
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.hands.send({ image: this.videoElement });
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
            this.isInitialized = true;
            console.log('MediaPipe Hands initialized successfully');

        } catch (error) {
            console.error('Failed to initialize MediaPipe:', error);
            this.initializeFallback();
        }
    }

    initializeFallback() {
        // Fallback: Just initialize camera without hand tracking
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                this.videoElement.srcObject = stream;
                console.log('Camera initialized (without hand tracking)');
            })
            .catch(error => {
                console.error('Failed to initialize camera:', error);
            });
    }

    onResults(results) {
        // Clear overlay canvas
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            this.handLandmarks = results.multiHandLandmarks[0];
            this.drawHandLandmarks();
            this.detectGesture();

            if (this.onHandDetected) {
                this.onHandDetected(this.handLandmarks);
            }
        } else {
            this.handLandmarks = null;
            this.currentGesture = 'none';

            if (this.onHandLost) {
                this.onHandLost();
            }
        }
    }

    drawHandLandmarks() {
        if (!this.handLandmarks) return;

        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;

        // Draw connections
        this.overlayCtx.strokeStyle = '#ffffff';
        this.overlayCtx.lineWidth = 2;

        const connections = [
            // Thumb
            [0, 1], [1, 2], [2, 3], [3, 4],
            // Index finger
            [0, 5], [5, 6], [6, 7], [7, 8],
            // Middle finger
            [0, 9], [9, 10], [10, 11], [11, 12],
            // Ring finger
            [0, 13], [13, 14], [14, 15], [15, 16],
            // Pinky
            [0, 17], [17, 18], [18, 19], [19, 20]
        ];

        connections.forEach(([start, end]) => {
            const startPoint = this.handLandmarks[start];
            const endPoint = this.handLandmarks[end];

            this.overlayCtx.beginPath();
            this.overlayCtx.moveTo(startPoint.x * width, startPoint.y * height);
            this.overlayCtx.lineTo(endPoint.x * width, endPoint.y * height);
            this.overlayCtx.stroke();
        });

        // Draw landmarks
        this.handLandmarks.forEach((landmark, index) => {
            const x = landmark.x * width;
            const y = landmark.y * height;

            this.overlayCtx.beginPath();
            this.overlayCtx.arc(x, y, 5, 0, Math.PI * 2);

            // All landmarks white
            this.overlayCtx.fillStyle = '#ffffff';

            this.overlayCtx.fill();
            this.overlayCtx.strokeStyle = '#000';
            this.overlayCtx.lineWidth = 1;
            this.overlayCtx.stroke();
        });

        // Draw gesture indicator
        this.drawGestureIndicator();
    }

    drawGestureIndicator() {
        if (this.currentGesture === 'none') return;

        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;

        // Draw gesture name
        this.overlayCtx.fillStyle = '#ffffff';
        this.overlayCtx.font = '20px Arial';
        this.overlayCtx.textAlign = 'center';
        this.overlayCtx.fillText(this.currentGesture.toUpperCase(), width / 2, 30);

        // Draw gesture-specific indicators
        switch (this.currentGesture) {
            case 'point':
                this.drawPointIndicator();
                break;
            case 'pinch':
                this.drawPinchIndicator();
                break;
            case 'fist':
                this.drawFistIndicator();
                break;
            case 'open':
                this.drawOpenHandIndicator();
                break;
        }
    }

    drawPointIndicator() {
        if (!this.handLandmarks) return;

        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;
        const indexTip = this.handLandmarks[8];

        // Draw pointing circle
        this.overlayCtx.beginPath();
        this.overlayCtx.arc(indexTip.x * width, indexTip.y * height, 15, 0, Math.PI * 2);
        this.overlayCtx.strokeStyle = '#ffffff';
        this.overlayCtx.lineWidth = 3;
        this.overlayCtx.stroke();
    }

    drawPinchIndicator() {
        if (!this.handLandmarks) return;

        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;
        const thumbTip = this.handLandmarks[4];
        const indexTip = this.handLandmarks[8];

        // Draw line between thumb and index
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(thumbTip.x * width, thumbTip.y * height);
        this.overlayCtx.lineTo(indexTip.x * width, indexTip.y * height);
        this.overlayCtx.strokeStyle = '#ffffff';
        this.overlayCtx.lineWidth = 4;
        this.overlayCtx.stroke();
    }

    drawFistIndicator() {
        if (!this.handLandmarks) return;

        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;
        const wrist = this.handLandmarks[0];

        // Draw fist circle
        this.overlayCtx.beginPath();
        this.overlayCtx.arc(wrist.x * width, wrist.y * height, 30, 0, Math.PI * 2);
        this.overlayCtx.strokeStyle = '#ffffff';
        this.overlayCtx.lineWidth = 4;
        this.overlayCtx.stroke();
    }

    drawOpenHandIndicator() {
        if (!this.handLandmarks) return;

        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;
        const palmCenter = this.calculatePalmCenter();

        // Draw open hand circle
        this.overlayCtx.beginPath();
        this.overlayCtx.arc(palmCenter.x * width, palmCenter.y * height, 40, 0, Math.PI * 2);
        this.overlayCtx.strokeStyle = '#ffffff';
        this.overlayCtx.lineWidth = 3;
        this.overlayCtx.setLineDash([5, 5]);
        this.overlayCtx.stroke();
        this.overlayCtx.setLineDash([]);
    }

    detectGesture() {
        if (!this.handLandmarks) {
            this.currentGesture = 'none';
            return;
        }

        const gestures = {
            point: this.detectPointGesture(),
            pinch: this.detectPinchGesture(),
            fist: this.detectFistGesture(),
            open: this.detectOpenHandGesture(),
            two_fingers: this.detectTwoFingerGesture()
        };

        // Find the gesture with highest confidence
        let bestGesture = 'none';
        let maxConfidence = this.gestureThreshold;

        for (const [gesture, confidence] of Object.entries(gestures)) {
            if (confidence > maxConfidence) {
                maxConfidence = confidence;
                bestGesture = gesture;
            }
        }

        // Update gesture with smoothing
        this.gestureHistory.push(bestGesture);
        if (this.gestureHistory.length > 5) {
            this.gestureHistory.shift();
        }

        // Use most common gesture in recent history
        const gestureCount = {};
        this.gestureHistory.forEach(g => {
            gestureCount[g] = (gestureCount[g] || 0) + 1;
        });

        const smoothedGesture = Object.keys(gestureCount).reduce((a, b) =>
            gestureCount[a] > gestureCount[b] ? a : b
        );

        if (this.currentGesture !== smoothedGesture) {
            this.currentGesture = smoothedGesture;
            if (this.onGestureChange) {
                this.onGestureChange(this.currentGesture, this.getGestureData());
            }
        }
    }

    detectPointGesture() {
        const indexTip = this.handLandmarks[8];
        const indexPip = this.handLandmarks[6];
        const middleTip = this.handLandmarks[12];
        const ringTip = this.handLandmarks[16];
        const pinkyTip = this.handLandmarks[20];

        // Check if index finger is extended and others are folded
        const indexExtended = indexTip.y < indexPip.y;
        const middleFolded = middleTip.y > this.handLandmarks[10].y;
        const ringFolded = ringTip.y > this.handLandmarks[14].y;
        const pinkyFolded = pinkyTip.y > this.handLandmarks[18].y;

        if (indexExtended && middleFolded && ringFolded && pinkyFolded) {
            return 0.9;
        }
        return 0;
    }

    detectPinchGesture() {
        const thumbTip = this.handLandmarks[4];
        const indexTip = this.handLandmarks[8];

        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );

        if (distance < this.pinchThreshold) {
            return 0.9;
        }
        return 0;
    }

    detectFistGesture() {
        const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
        const fingerPips = [6, 10, 14, 18]; // Corresponding PIP joints

        let foldedCount = 0;
        fingerTips.forEach((tipIndex, i) => {
            const tip = this.handLandmarks[tipIndex];
            const pip = this.handLandmarks[fingerPips[i]];

            if (tip.y > pip.y) { // Finger is folded
                foldedCount++;
            }
        });

        return foldedCount >= 3 ? 0.9 : 0;
    }

    detectOpenHandGesture() {
        const fingerTips = [4, 8, 12, 16, 20]; // All finger tips
        const fingerMcps = [2, 5, 9, 13, 17]; // Corresponding MCP joints

        let extendedCount = 0;
        fingerTips.forEach((tipIndex, i) => {
            const tip = this.handLandmarks[tipIndex];
            const mcp = this.handLandmarks[fingerMcps[i]];

            if (tip.y < mcp.y) { // Finger is extended
                extendedCount++;
            }
        });

        return extendedCount >= 4 ? 0.8 : 0;
    }

    detectTwoFingerGesture() {
        const indexTip = this.handLandmarks[8];
        const indexPip = this.handLandmarks[6];
        const middleTip = this.handLandmarks[12];
        const middlePip = this.handLandmarks[10];
        const ringTip = this.handLandmarks[16];
        const pinkyTip = this.handLandmarks[20];

        const indexExtended = indexTip.y < indexPip.y;
        const middleExtended = middleTip.y < middlePip.y;
        const ringFolded = ringTip.y > this.handLandmarks[14].y;
        const pinkyFolded = pinkyTip.y > this.handLandmarks[18].y;

        if (indexExtended && middleExtended && ringFolded && pinkyFolded) {
            return 0.8;
        }
        return 0;
    }

    getGestureData() {
        if (!this.handLandmarks) return null;

        const data = {
            gesture: this.currentGesture,
            landmarks: this.handLandmarks,
            indexTip: this.handLandmarks[8],
            thumbTip: this.handLandmarks[4],
            palmCenter: this.calculatePalmCenter(),
            handSize: this.calculateHandSize(),
            confidence: 0.9
        };

        // Add gesture-specific data
        switch (this.currentGesture) {
            case 'pinch':
                data.pinchDistance = this.calculatePinchDistance();
                break;
            case 'two_fingers':
                data.fingerSpread = this.calculateFingerSpread();
                data.rotation = this.calculateTwoFingerRotation();
                break;
        }

        return data;
    }

    calculatePalmCenter() {
        if (!this.handLandmarks) return { x: 0, y: 0 };

        const palmPoints = [0, 5, 9, 13, 17]; // Wrist and MCP joints
        let avgX = 0, avgY = 0;

        palmPoints.forEach(index => {
            avgX += this.handLandmarks[index].x;
            avgY += this.handLandmarks[index].y;
        });

        return {
            x: avgX / palmPoints.length,
            y: avgY / palmPoints.length
        };
    }

    calculateHandSize() {
        if (!this.handLandmarks) return 0;

        const wrist = this.handLandmarks[0];
        const middleTip = this.handLandmarks[12];

        return Math.sqrt(
            Math.pow(wrist.x - middleTip.x, 2) +
            Math.pow(wrist.y - middleTip.y, 2)
        );
    }

    calculatePinchDistance() {
        if (!this.handLandmarks) return 0;

        const thumbTip = this.handLandmarks[4];
        const indexTip = this.handLandmarks[8];

        return Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );
    }

    calculateFingerSpread() {
        if (!this.handLandmarks) return 0;

        const indexTip = this.handLandmarks[8];
        const middleTip = this.handLandmarks[12];

        return Math.sqrt(
            Math.pow(indexTip.x - middleTip.x, 2) +
            Math.pow(indexTip.y - middleTip.y, 2)
        );
    }

    calculateTwoFingerRotation() {
        if (!this.handLandmarks) return 0;

        const indexTip = this.handLandmarks[8];
        const middleTip = this.handLandmarks[12];

        return Math.atan2(middleTip.y - indexTip.y, middleTip.x - indexTip.x);
    }

    // Convert normalized coordinates to canvas coordinates
    normalizedToCanvas(point, canvas) {
        return {
            x: point.x * canvas.width,
            y: point.y * canvas.height
        };
    }

    // Convert canvas coordinates to normalized coordinates
    canvasToNormalized(point, canvas) {
        return {
            x: point.x / canvas.width,
            y: point.y / canvas.height
        };
    }

    destroy() {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.hands) {
            this.hands.close();
        }
    }
} 