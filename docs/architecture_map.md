# Architecture Map

**Master Blueprint for Gesture & Eye-Tracking Browser Extension**
This document maps how files in the `/src` folders connect. It must be updated immediately upon any file creation, modification, deletion, or dependency change.

## Current State

### Project Roots
- `vite.config.ts`: Configures Vite for Extension build.
- `public/manifest.json`: Manifest V3 configuration.

### Extension Logic Connections
- `src/background/index.ts`: Background service worker (Manifest V3). Handles installation events.
- `src/content/index.tsx`: Entry point. Injects `CameraManager` into the web page DOM.
- `src/content/index.css`: CSS file for the injected content UI.
- `src/content/CameraManager.tsx`: React component wrapping the webcam `<video>` PIP HUD. It calls `initializeAIModels` and feeds the video stream directly into the MediaPipe instances.
- `src/core/models.ts`: Core AI logic. Initializes and exports `@tensorflow-models/knn-classifier`, `@mediapipe/hands`, and `@mediapipe/face_mesh` instances.
- `src/commands/domActions.ts`: Exported mapping functions that translate recognized gestures (e.g. Scroll Down, Next Chapter) into JS `window.scrollBy` or `element.click()` actions.
