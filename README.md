# Gestural Font Editor ✨

A revolutionary font editor that uses computer vision and hand gestures to create and modify typography in real-time. Control font characteristics with intuitive hand movements - pinch to scale, point to select, make a fist to distort, and more!

![Gestural Font Editor Demo](demo-image.png)

## Features

🖐️ **Hand Tracking**: Real-time hand detection and gesture recognition using MediaPipe  
✍️ **Font Editing**: Edit character outlines with control points and bezier curves  
🎨 **Gesture Controls**: Intuitive gesture mapping for different editing operations  
🎬 **Live Preview**: See changes in real-time as you gesture  
📤 **Export**: Save your custom font characters as JSON files  
💻 **Cross-Platform**: Works in any modern web browser  

## Gesture Controls

| Gesture | Action | Description |
|---------|--------|-------------|
| 👉 **Point** (Index finger) | Select & Move | Select and move control points on the character outline |
| 🤏 **Pinch** (Thumb + Index) | Scale | Pinch closer to shrink, spread apart to enlarge the character |
| ✌️ **Two Fingers** (Index + Middle) | Rotate | Rotate the character by changing the angle between your fingers |
| ✊ **Fist** (Closed hand) | Distort | Apply dynamic distortion effects to the character |
| ✋ **Open Hand** (All fingers extended) | Reset | Gradually reset all transformations to default |

## Getting Started

### Quick Start

1. **Open the Application**
   ```bash
   # Simply open index.html in a modern web browser
   # Or serve it with a local server:
   python -m http.server 8000
   # Then visit: http://localhost:8000
   ```

2. **Grant Camera Permission**
   - Allow camera access when prompted
   - Position yourself in good lighting
   - Keep your hand visible in the camera frame

3. **Start Editing**
   - Select a character from the dropdown (A-Z)
   - Use gestures to modify the character
   - Watch the real-time updates on the font canvas

### System Requirements

- **Browser**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Camera**: Any webcam (built-in or external)
- **Hardware**: Modern computer with hardware acceleration
- **Lighting**: Good lighting conditions for hand tracking

## How It Works

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Camera Feed   │───▶│  MediaPipe       │───▶│ Gesture Engine  │
│   (WebCam)      │    │  Hand Tracking   │    │ (Recognition)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Font Canvas   │◀───│  Font Editor     │◀───│ Gesture Handler │
│   (Rendering)   │    │  (Core Logic)    │    │ (Mapping)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

1. **MediaPipe Hands**: Google's ML solution for hand tracking
2. **Font Editor**: Custom canvas-based font manipulation engine
3. **Gesture Recognition**: Pattern matching for hand gestures
4. **Real-time Rendering**: Smooth updates at 30+ FPS

## Advanced Usage

### Keyboard Shortcuts

- `Ctrl/Cmd + R` - Reset current character
- `Ctrl/Cmd + E` - Export current character
- `←/→` Arrow keys - Switch between characters
- `Mouse` - Fallback control for direct point manipulation

### Customization

You can customize gesture sensitivity by modifying the parameters in `gestureRecognition.js`:

```javascript
// Gesture detection thresholds
this.pinchThreshold = 0.05;     // Pinch sensitivity
this.pointThreshold = 0.08;     // Point detection
this.fistThreshold = 0.6;       // Fist detection
```

### Export Format

Exported fonts are saved as JSON files containing:

```json
{
  "characters": {
    "A": {
      "controlPoints": [...],
      "transformations": {
        "scale": 1.0,
        "rotation": 0,
        "distortion": 0,
        "smoothness": 0.8
      }
    }
  },
  "metadata": {
    "name": "Custom Gestural Font",
    "version": "1.0",
    "created": "2024-01-01T00:00:00.000Z"
  }
}
```

## Troubleshooting

### Common Issues

**Hand not detected?**
- Ensure good lighting
- Keep hand within camera frame
- Try adjusting camera angle
- Check browser permissions

**Gestures not working?**
- Make clear, distinct gestures
- Hold gestures for 1-2 seconds
- Ensure fingers are clearly visible
- Try recalibrating by refreshing

**Performance issues?**
- Close other browser tabs
- Enable hardware acceleration
- Use Chrome for best performance
- Lower video resolution if needed

### Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Excellent | Best performance, full feature support |
| Firefox | ✅ Good | Solid performance, all features work |
| Safari | ⚠️ Limited | MacOS only, some performance limitations |
| Edge | ✅ Good | Similar to Chrome performance |

## Development

### Project Structure

```
cv-font-editor/
├── index.html          # Main application HTML
├── styles.css          # UI styling and animations
├── fontEditor.js       # Font manipulation engine
├── gestureRecognition.js # Hand tracking and gesture logic
├── app.js             # Main application controller
└── README.md          # This file
```

### Key Classes

- `FontEditor`: Manages character rendering and manipulation
- `GestureRecognition`: Handles MediaPipe integration and gesture detection
- `GesturalFontApp`: Main application controller and UI manager

### Extending the Editor

Add new gestures by:

1. Implementing detection logic in `gestureRecognition.js`
2. Adding gesture handlers in `app.js`
3. Updating UI elements as needed

Add new characters by extending the `generateBasicCharacterPaths()` method in `fontEditor.js`.

## Technical Details

### Dependencies

- **MediaPipe Hands**: ML-powered hand tracking
- **HTML5 Canvas**: 2D rendering and graphics
- **OpenType.js**: Font file format support (future enhancement)

### Performance Optimizations

- Gesture smoothing and debouncing
- Efficient canvas rendering
- Optimized hand landmark processing
- Adaptive frame rate based on performance

## Future Enhancements

🚀 **Planned Features**:
- [ ] Multi-hand support for complex gestures
- [ ] Voice commands for character switching
- [ ] Real font file export (.ttf/.otf)
- [ ] Collaborative editing
- [ ] AI-assisted character generation
- [ ] Mobile device support
- [ ] Advanced typography controls
- [ ] Gesture training mode

## Credits

Created with ❤️ using:
- [MediaPipe](https://mediapipe.dev/) by Google
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- Modern web technologies

## License

MIT License - feel free to use, modify, and distribute!

---

**Ready to create the future of typography?** 🎨✨ Start gesturing and watch your fonts come to life! 