import { useState, useEffect } from 'react';
import { GestureAction } from '../commands/domActions';
import { GestureClassifier } from '../core/classifier';

interface TrainingUIProps {
    classifier: GestureClassifier | null;
    onClose: () => void;
}

export const TrainingUI = ({ classifier, onClose }: TrainingUIProps) => {
    const [selectedAction, setSelectedAction] = useState<GestureAction>(GestureAction.SCROLL_DOWN);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    
    const actions = Object.values(GestureAction).filter(a => a !== GestureAction.NONE);

    // Run the countdown
    useEffect(() => {
        if (countdown === null) return;
        
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            // Countdown finished, start capturing examples
            startCaptureSession();
        }
    }, [countdown]);

    const handleStartTraining = () => {
        setCountdown(3); // 3 second delay to free hands
    };

    const startCaptureSession = () => {
        if (!classifier) return;
        
        // Map action enum string back to a numeric ClassID for KNN
        const classId = actions.indexOf(selectedAction as any);
        
        setIsTraining(true);
        classifier.startTrainingSession(classId);

        // Record for 2 seconds (assuming 30fps = ~60 examples)
        setTimeout(() => {
            classifier.stopTrainingSession();
            setIsTraining(false);
            setCountdown(null);
            classifier.saveModelToStorage();
            
            // Show brief success flash then close, or stay open for next
            alert(`Successfully trained gesture for: ${selectedAction}`);
            
        }, 2000);
    };

    return (
        <div className="gesture-hud-interactive fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm shadow-2xl z-50 p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 md:p-8 max-w-md w-full text-slate-100 relative overflow-hidden">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Gesture Training</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Select an action, press Train, and hold your hand in position to teach the local AI a new gesture.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Target Browser Action</label>
                        <select 
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value as any as GestureAction)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                            disabled={countdown !== null || isTraining}
                        >
                            {actions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 flex flex-col items-center">
                        {countdown !== null && countdown > 0 ? (
                            <div className="text-6xl font-black text-blue-400 animate-pulse my-4">
                                {countdown}
                            </div>
                        ) : isTraining ? (
                            <div className="w-full">
                                <p className="text-center font-bold text-green-400 mb-2 animate-bounce">HOLD GESTURE NOW</p>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 animate-[progress_2s_linear]"></div>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={handleStartTraining}
                                disabled={!classifier}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Train Selected Gesture
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
