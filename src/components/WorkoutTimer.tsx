import React, { useEffect, useState, useRef } from 'react';

interface WorkoutTimerProps {
  initialTime: number;
  isRunning: boolean;
  onComplete: () => void;
  status: 'prepare' | 'workout' | 'rest';
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ 
  initialTime, 
  isRunning, 
  onComplete,
  status
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const isRunningRef = useRef(isRunning);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset time when initialTime or status changes
  useEffect(() => {
    console.log(`Timer props changed: initialTime=${initialTime}, status=${status}, isRunning=${isRunning}`);
    setTimeRemaining(initialTime);
  }, [initialTime, status]);
  
  // Handle isRunning changes separately
  useEffect(() => {
    // Update ref to track changes
    isRunningRef.current = isRunning;
    console.log(`isRunning changed to: ${isRunning}`);
    
    // Clear existing interval when stopping
    if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Timer stopped, interval cleared');
    }
  }, [isRunning]);
  
  // Handle the countdown
  useEffect(() => {
    // Clean up any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Only start if running and time > 0
    if (isRunning && timeRemaining > 0) {
      console.log(`Starting timer countdown from ${timeRemaining} seconds`);
      
      intervalRef.current = setInterval(() => {
        // Check if we're still supposed to be running
        if (!isRunningRef.current) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          
          // Log only occasionally to reduce console spam
          if (newTime % 5 === 0 || newTime <= 3) {
            console.log(`Time tick: ${prevTime} -> ${newTime}`);
          }
          
          // If we're at zero, clear the interval and call onComplete
          if (newTime <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            console.log('Timer reached zero, calling onComplete');
            
            // Small delay to avoid state update conflicts
            setTimeout(() => {
              if (isRunningRef.current) {
                onComplete();
              }
            }, 10);
            
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        console.log('Cleaning up timer interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, initialTime, onComplete]); 
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getStatusColor = (): string => {
    switch (status) {
      case 'prepare':
        return 'bg-yellow-500';
      case 'workout':
        return 'bg-green-500';
      case 'rest':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusText = (): string => {
    switch (status) {
      case 'prepare':
        return 'PREPARE';
      case 'workout':
        return 'WORKOUT';
      case 'rest':
        return 'REST';
      default:
        return '';
    }
  };
  
  // Calculate percentage for timer bar
  const percentRemaining = Math.max(0, Math.min(100, (timeRemaining / initialTime) * 100));
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative h-24 bg-gray-200 rounded-lg overflow-hidden">
        <div 
          className={`absolute left-0 top-0 bottom-0 ${getStatusColor()} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentRemaining}%` }}
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-3xl font-bold z-10">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm font-semibold uppercase mt-1 z-10">
            {getStatusText()}
          </div>
        </div>
      </div>
      
      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>{isRunning ? '▶️ Running' : '⏹️ Paused'}</span>
        <span>{status.toUpperCase()}</span>
        <span>{timeRemaining}s / {initialTime}s</span>
      </div>
    </div>
  );
};

export default WorkoutTimer; 