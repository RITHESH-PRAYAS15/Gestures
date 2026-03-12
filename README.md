# Hands-Free Comic Reader Extension

A privacy-first Chrome/Brave extension that lets you read web comics hands-free using local AI for eye and gesture tracking.

## Features
- **Local Machine Learning**: Uses MediaPipe FaceMesh & Hands running entirely in the browser.
- **Privacy First**: Zero Data Collection. No data is sent externally.
- **Custom Gestures**: Train your own custom hand gestures dynamically via an embedded KNN Classifier.
- **DOM Control**: Maps recognized gestures to DOM scrolling and navigation (e.g., Swipe to scroll, pinch to click Next).

## Development Setup
1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`
3. Load the Unpacked Extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `/dist` directory of this project.

## Architecture
See `docs/architecture_map.md` for a comprehensive map of how the files connect.
