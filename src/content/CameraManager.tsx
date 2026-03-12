import { useEffect, useRef, useState } from 'react';
import { initializeAIModels } from '../core/models';
import { Camera } from '@mediapipe/camera_utils';
import type { Results as HandResults } from '@mediapipe/hands';
import { GestureClassifier } from '../core/classifier';
import { executeGestureAction, GestureAction } from '../commands/domActions';
import { TrainingUI } from './TrainingUI';

export const CameraManager = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [statusText, setStatusText] = useState("Initializing models...");
    const [showTraining, setShowTraining] = useState(false);
    const [classifier, setClassifier] = useState<GestureClassifier | null>(null);
    const [currentAction, setCurrentAction] = useState<GestureAction>(GestureAction.NONE);
    
    // We use a ref to prevent stale closures in the `onResults` callback
    const classifierRef = useRef<GestureClassifier | null>(null);
    const lastActionTimeRef = useRef<number>(0);

    useEffect(() => {
        let camera: Camera | null = null;

        const setupSystem = async () => {
            try {
                // 1. Load the AI Models (TFJS + MediaPipe)
                const models = await initializeAIModels();
                const { hands, faceMesh } = models;
                
                const newClassifier = new GestureClassifier(models.classifier);
                await newClassifier.loadModelFromStorage();
                
                setClassifier(newClassifier);
                classifierRef.current = newClassifier;
                
                setIsModelsLoaded(true);
                setStatusText("Models loaded. Requesting camera...");

                // 2. Setup Camera Stream
                if (videoRef.current) {
                    // We use native getUserMedia for complete control, or mediapipe camera utils for easy looping.
                    // For Web Comics (hands-free reading) the PIP video element needs to run continuously
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: { width: 640, height: 480, facingMode: 'user' }
                        });
                        videoRef.current.srcObject = stream;
                        await new Promise((resolve) => {
                            if (!videoRef.current) return;
                            videoRef.current.onloadedmetadata = () => resolve(true);
                        });
                        videoRef.current.play();

                        setStatusText("Camera Active. Ready.");

                        // Set up Hands callback for gesture classification
                        hands.onResults(async (results: HandResults) => {
                            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                                // Extract first hand
                                const landmarks = results.multiHandLandmarks[0];
                                const flattened = landmarks.flatMap(lm => [lm.x, lm.y, lm.z]);
                                
                                const classInst = classifierRef.current;
                                if (!classInst) return;

                                // If training, feed to dataset. Otherwise, predict.
                                if ((classInst as any).isTraining) {
                                    classInst.addExample(flattened);
                                } else {
                                    // Throttle actions to max 1 per second to avoid spam (except none)
                                    const now = Date.now();
                                    if (now - lastActionTimeRef.current > 1500) {
                                        import('@tensorflow/tfjs').then(async tf => {
                                            const tensor = tf.tensor2d([flattened]);
                                            const actionIndex = await classInst.predict(tensor);
                                            tensor.dispose();
                                            
                                            if (actionIndex !== null) {
                                                // Assuming actions array maps strictly to GestureAction enum logic
                                                const actionVals = Object.values(GestureAction).filter(a => a !== GestureAction.NONE);
                                                const action = actionVals[actionIndex];
                                                if (action) {
                                                    setCurrentAction(action);
                                                    executeGestureAction(action);
                                                    lastActionTimeRef.current = Date.now();
                                                    
                                                    // Clear UI status after 1s
                                                    setTimeout(() => setCurrentAction(GestureAction.NONE), 1000);
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        });

                        // 3. Setup prediction loop
                        // This loop will run inference on FaceMesh and Hands
                        camera = new Camera(videoRef.current, {
                            onFrame: async () => {
                                if (videoRef.current) {
                                  // Asynchronously run inference without blocking rendering too much
                                  await hands.send({ image: videoRef.current });
                                  await faceMesh.send({ image: videoRef.current });
                                }
                            },
                            width: 640,
                            height: 480
                        });
                        camera.start();

                    } catch (cameraError) {
                         console.error("Camera access denied or failed: ", cameraError);
                         setStatusText("Camera Error: Please grant permission.");
                    }
                }
            } catch (initError) {
                console.error("Failed to initialize AI ML Models.", initError);
                setStatusText("Error: Failed to load models.");
            }
        };

        setupSystem();

        return () => {
            if (camera) camera.stop();
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="gesture-hud-interactive fixed bottom-5 right-5 bg-slate-900/90 text-white p-3 rounded-2xl shadow-2xl z-[999999] flex flex-col items-center font-sans border border-slate-700/50 backdrop-blur-md transition-all hover:scale-105">
            <div className="flex justify-between items-center w-full mb-3 px-1">
                <h4 className="m-0 text-sm font-semibold tracking-wide bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Reader HUD</h4>
                <button 
                    onClick={() => setShowTraining(!showTraining)}
                    disabled={!isModelsLoaded}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-2 py-1 rounded w-fit pointer-events-auto"
                >
                    Train
                </button>
            </div>
            
            <div className="relative rounded-lg overflow-hidden border border-slate-700 w-[240px] h-[180px] bg-black">
                <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover scale-x-[-1]" 
                    autoPlay 
                    playsInline 
                    muted
                    style={{ display: isModelsLoaded ? 'block' : 'none' }} 
                />
                {!isModelsLoaded && (
                   <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   </div> 
                )}
            </div>
            
            <div className="flex justify-between items-center w-full mt-3 px-1">
                 <p className="text-[10px] text-slate-400 m-0 truncate w-[130px]">{statusText}</p>
                 {currentAction !== GestureAction.NONE && (
                     <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                         {currentAction}
                     </span>
                 )}
            </div>

            {/* Display the fullscreen Training Overlay when toggled */}
            {showTraining && (
                <TrainingUI 
                    classifier={classifier} 
                    onClose={() => setShowTraining(false)} 
                />
            )}
        </div>
    );
};
