import React, { useEffect, useRef, useState } from 'react';
import { processFrame } from '@/lib/api';
import { ExerciseType } from '@/lib/types';

interface WorkoutCameraProps {
  currentExercise: string;
  onRepCount: (count: number) => void;
}

const POSE_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5],
  [5, 6], [6, 8], [9, 10], 
  // Arms
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Legs
  [23, 25], [25, 27], [27, 29], [27, 31],
  [24, 26], [26, 28], [28, 30], [28, 32]
];

const WorkoutCamera: React.FC<WorkoutCameraProps> = ({ currentExercise, onRepCount }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [totalRepCount, setTotalRepCount] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [landmarks, setLandmarks] = useState<any[] | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastExerciseRef = useRef<string>('');
  const repCountsRef = useRef<{ [key: string]: number }>({});
  const debugCounterRef = useRef<number>(0);

  // Request camera permissions and set up video
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setPermissionGranted(true);
          setStatus('Camera ready');
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setStatus('Camera access denied');
      }
    };
    
    setupCamera();
    
    return () => {
      // Clean up video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      // Clean up animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Process video frames and send to backend
  useEffect(() => {
    if (!permissionGranted || !videoRef.current) return;
    
    // Skip processing for workout_end marker
    if (currentExercise === 'workout_end') {
      console.log('Skipping camera processing for workout_end marker');
      return;
    }
    
    // Force reset when exercise changes
    if (lastExerciseRef.current !== currentExercise) {
      console.log(`Exercise changed from ${lastExerciseRef.current} to ${currentExercise} - resetting`);
      setTotalRepCount(0);
      onRepCount(0);
      setLandmarks(null);
      
      // Reset the processing flag to ensure we start fresh
      setProcessing(false);
      
      // Important: cancel any existing animation frame to prevent race conditions
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    // Track when the component was mounted for this exercise
    const mountTime = Date.now();
    console.log(`Camera mounted/updated for exercise: ${currentExercise} at ${mountTime}`);
    
    // Update the last exercise ref
    lastExerciseRef.current = currentExercise;
    
    let frameCount = 0;
    let lastRepUpdateTime = Date.now();
    let isComponentMounted = true;
    
    const processVideoFrame = async () => {
      // Exit early if component unmounted or permissions revoked
      if (!isComponentMounted || !permissionGranted || !videoRef.current || processing) {
        if (isComponentMounted) {
          animationRef.current = requestAnimationFrame(processVideoFrame);
        }
        return;
      }
      
      // Process fewer frames to reduce load (1 out of 5 frames)
      frameCount = (frameCount + 1) % 5;
      if (frameCount !== 0) {
        animationRef.current = requestAnimationFrame(processVideoFrame);
        return;
      }
      
      try {
        setProcessing(true);
        
        // Verify exercise hasn't changed during processing
        if (lastExerciseRef.current !== currentExercise) {
          console.log('Exercise changed during frame processing, skipping');
          setProcessing(false);
          if (isComponentMounted) {
            animationRef.current = requestAnimationFrame(processVideoFrame);
          }
          return;
        }
        
        // Log for debugging exercise switching issues
        if (debugCounterRef.current % 50 === 0) {
          console.log(`Processing frame for ${currentExercise}, processing=${processing}`);
        }
        
        // Process the frame
        const result = await processFrame(
          videoRef.current,
          currentExercise as ExerciseType
        );
        
        // Update landmarks for drawing
        if (isComponentMounted) {
          setLandmarks(result.landmarks || null);
        }
        
        // Update rep count if it increased, with time-based throttling
        // Only count reps if it's been at least 1.5 seconds since the last update
        // AND at least 3 seconds since component mounted (to avoid initial false detections)
        const now = Date.now();
        if (isComponentMounted && 
            result.repCount > 0 && 
            now - lastRepUpdateTime > 1500 && 
            now - mountTime > 3000) {
          // Log for debugging - increment counter to avoid flooding console
          debugCounterRef.current += 1;
          if (debugCounterRef.current % 3 === 0) { // More frequent logging
            console.log(`Rep count from backend: ${result.repCount}, Current exercise: ${currentExercise}, Current total: ${totalRepCount}`);
          }
          
          // Update the total rep count
          setTotalRepCount(prev => {
            const newCount = prev + result.repCount;
            console.log(`Updating rep count: ${prev} + ${result.repCount} = ${newCount} for ${currentExercise}`);
            onRepCount(newCount);
            lastRepUpdateTime = now;
            return newCount;
          });
        }
        
        // Update status with feedback
        if (isComponentMounted && result.feedback) {
          setStatus(result.feedback);
        }
      } catch (error) {
        console.error(`Error processing video frame for ${currentExercise}:`, error);
        if (isComponentMounted) {
          setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        if (isComponentMounted) {
          setProcessing(false);
          animationRef.current = requestAnimationFrame(processVideoFrame);
        }
      }
    };
    
    // Start processing frames with a small delay to allow for state to settle
    setTimeout(() => {
      if (isComponentMounted) {
        console.log(`Starting frame processing for ${currentExercise}`);
        animationRef.current = requestAnimationFrame(processVideoFrame);
      }
    }, 500);
    
    return () => {
      // Mark component as unmounted to prevent state updates
      isComponentMounted = false;
      
      // Clean up animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      console.log(`Cleaning up camera for exercise: ${currentExercise}`);
    };
  }, [currentExercise, permissionGranted, onRepCount]);

  // Draw landmarks on canvas
  useEffect(() => {
    if (!canvasRef.current || !landmarks || currentExercise === 'workout_end') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match video
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }
    
    // Draw the landmarks
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];
      if (landmark.visibility < 0.1) continue; // Skip low visibility points
      
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      
      // Draw circles for landmarks
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(0, 255, 0, ${landmark.visibility})`;
      ctx.fill();
    }
    
    // Draw connections between landmarks
    ctx.strokeStyle = 'rgb(0, 255, 0)';
    ctx.lineWidth = 2;
    
    for (const [start, end] of POSE_CONNECTIONS) {
      if (!landmarks[start] || !landmarks[end]) continue;
      if (landmarks[start].visibility < 0.1 || landmarks[end].visibility < 0.1) continue;
      
      ctx.beginPath();
      ctx.moveTo(
        landmarks[start].x * canvas.width,
        landmarks[start].y * canvas.height
      );
      ctx.lineTo(
        landmarks[end].x * canvas.width,
        landmarks[end].y * canvas.height
      );
      ctx.stroke();
    }
    
    // Add exercise name
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText(currentExercise.replace('_', ' ').toUpperCase(), 20, 30);
    
    // Add rep count
    ctx.fillText(`Reps: ${totalRepCount}`, canvas.width - 120, 30);
  }, [landmarks, totalRepCount, currentExercise]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <p className="font-semibold text-lg">
                {currentExercise === 'workout_end' 
                  ? 'Ending Workout...' 
                  : currentExercise.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
              <p>{status}</p>
            </div>
            <div className="bg-blue-600 text-white text-2xl font-bold rounded-full w-12 h-12 flex items-center justify-center">
              {totalRepCount}
            </div>
          </div>
        </div>
      </div>
      
      {!permissionGranted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-lg">
          <div className="text-center p-6">
            <p className="mb-4">Camera access is required for exercise tracking</p>
            <button 
              className="btn"
              onClick={() => {
                navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                  .then(stream => {
                    if (videoRef.current) {
                      videoRef.current.srcObject = stream;
                      setPermissionGranted(true);
                      setStatus('Camera ready');
                    }
                  })
                  .catch(err => {
                    console.error('Error accessing camera:', err);
                    setStatus('Camera access denied');
                  });
              }}
            >
              Allow Camera Access
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutCamera; 