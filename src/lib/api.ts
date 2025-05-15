import { ExerciseType } from './types';

// API base URL - change to your backend server address
const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Process a video frame with the MediaPipe backend
 * @param imageData Canvas image data 
 * @param exerciseType Type of exercise to track
 */
export async function processFrame(
  videoElement: HTMLVideoElement,
  exerciseType: ExerciseType
): Promise<{
  repCount: number;
  feedback: string;
  confidence: number;
  landmarks?: { x: number; y: number; z: number; visibility: number }[];
}> {
  try {
    // Create a canvas to capture the video frame
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Draw the current video frame to the canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Get the image data as base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Send to the backend
    const response = await fetch(`${API_BASE_URL}/api/process_frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageDataUrl,
        exercise: exerciseType,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      repCount: result.repCount || 0,
      feedback: result.feedback || 'No feedback available',
      confidence: result.confidence || 0,
      landmarks: result.landmarks,
    };
  } catch (error) {
    console.error('Error processing frame:', error);
    return {
      repCount: 0,
      feedback: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0,
    };
  }
}

/**
 * Save workout results to storage
 * In a real app, this would send the data to a server or save to local storage
 */
export function saveWorkoutResults(
  date: string,
  results: { setNumber: number; exercise: string; reps: number }[]
): Promise<boolean> {
  return new Promise(resolve => {
    // For now, we'll just save to localStorage
    try {
      // Get existing history or initialize a new array
      const historyStr = localStorage.getItem('workoutHistory') || '[]';
      const history = JSON.parse(historyStr);
      
      // Add new workout
      history.push({
        date,
        results
      });
      
      // Save back to localStorage
      localStorage.setItem('workoutHistory', JSON.stringify(history));
      console.log('Saved workout results:', { date, results });
      resolve(true);
    } catch (error) {
      console.error('Error saving workout results:', error);
      resolve(false);
    }
  });
}

/**
 * Get saved workout history
 * Retrieves workout history from localStorage
 */
export function getWorkoutHistory(): Promise<{ 
  date: string; 
  results: { setNumber: number; exercise: string; reps: number }[] 
}[]> {
  return new Promise(resolve => {
    try {
      // Get history from localStorage
      const historyStr = localStorage.getItem('workoutHistory') || '[]';
      const history = JSON.parse(historyStr);
      resolve(history);
    } catch (error) {
      console.error('Error getting workout history:', error);
      resolve([]);
    }
  });
} 