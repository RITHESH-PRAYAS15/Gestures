import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { Hands } from '@mediapipe/hands';
import { FaceMesh } from '@mediapipe/face_mesh';

// Export the initialized models wrapper
export const initializeAIModels = async () => {
  // Ensure TF backend is ready (we'll use WebGL for perf in browser)
  await tf.setBackend('webgl');
  await tf.ready();

  const classifier = knnClassifier.create();

  // Initialize MediaPipe Hands
  const hands = new Hands({
    locateFile: (file) => {
      // Load assets from CDN to avoid huge extension bundle sizes
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // Initialize MediaPipe FaceMesh for gaze/eye tracking
  const faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true, // Needed for iris tracking
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // Pre-warm the models if needed, else just return
  return {
    classifier,
    hands,
    faceMesh
  };
};
