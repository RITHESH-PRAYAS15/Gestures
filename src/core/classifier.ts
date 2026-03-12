import { KNNClassifier } from '@tensorflow-models/knn-classifier';
import * as tf from '@tensorflow/tfjs';

// Basic state management for the KNN Classifier.
export class GestureClassifier {
    private knn: KNNClassifier | any;
    private isTraining: boolean = false;
    private currentClassId: number = -1;

    constructor(knnInstance: any) {
        this.knn = knnInstance;
    }

    /**
     * Set the system into "Training Mode" for a specific class ID
     * (e.g. 0 corresponds to Scroll Down)
     */
    startTrainingSession(classId: number) {
        this.currentClassId = classId;
        this.isTraining = true;
    }

    stopTrainingSession() {
        this.isTraining = false;
        this.currentClassId = -1;
    }

    /**
     * Should be called 30x a second during training
     */
    addExample(flattenedLandmarks: number[]) {
        if (!this.isTraining || this.currentClassId === -1) return;
        
        // Convert 1D array of landmarks into a 2D Tensor [1, num_features]
        const tensor = tf.tensor2d([flattenedLandmarks]);
        this.knn.addExample(tensor, this.currentClassId);
        
        // Clean up memory
        tensor.dispose();

        // Assuming tfjs is globally available via our imports elsewhere
        // We defer to the main inference loop to handle the actual TF conversion
    }

    /**
     * Get prediction based on trained dataset
     */
    async predict(tensorList: any) {
        if (this.knn.getNumClasses() > 0) {
            const res = await this.knn.predictClass(tensorList);
            return res.classIndex; 
        }
        return null;
    }

    /** Save model to Chrome Storage */
    async saveModelToStorage() {
        if (this.knn.getNumClasses() === 0) return;

        const dataset = this.knn.getClassifierDataset();
        // Convert TF Tensors to regular JS arrays so they can be JSON serialized
        const datasetObj: Record<string, { shape: number[], data: number[] }> = {};
        
        Object.keys(dataset).forEach((key) => {
             const tensor = dataset[key];
             datasetObj[key] = {
                 shape: tensor.shape,
                 data: Array.from(tensor.dataSync())
             };
        });
        
        await chrome.storage.local.set({ knn_model: JSON.stringify(datasetObj) });
        console.log("KNN Model saved to Chrome Storage.");
    }

    /** Load custom trained gestures from Chrome Storage */
    async loadModelFromStorage() {
        try {
            const result = await chrome.storage.local.get(['knn_model']);
            if (result.knn_model) {
                const datasetObj = JSON.parse(result.knn_model as string);
                const tensorObj: Record<string, tf.Tensor> = {};
                
                Object.keys(datasetObj).forEach((key) => {
                    const { shape, data } = datasetObj[key];
                    tensorObj[key] = tf.tensor(data, shape);
                });
                
                (this.knn as any).setClassifierDataset(tensorObj);
                console.log(`KNN Model Restored! Tracking ${Object.keys(tensorObj).length} gestures.`);
            }
        } catch (err) {
            console.error("Failed to restore KNN model from local storage", err);
        }
    }
}
