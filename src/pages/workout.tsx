import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import WorkoutForm from '@/components/WorkoutForm';
import WorkoutCamera from '@/components/WorkoutCamera';
import WorkoutTimer from '@/components/WorkoutTimer';
import { WorkoutData, WorkoutResults, FlattenedExercise } from '@/lib/types';
import { useAuthContext } from '@/lib/AuthContext';
import { getUserProfile, calculateCaloriesBurned } from '@/lib/firebase';
import { useRouter } from 'next/router';

const WorkoutPage: React.FC = () => {
  const router = useRouter();
  
  // Workout setup state
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState<boolean>(false);
  
  // Flattened list of exercises with their set numbers (for internal tracking)
  const [flattenedExercises, setFlattenedExercises] = useState<FlattenedExercise[]>([]);
  
  // Active workout state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<'prepare' | 'workout' | 'rest'>('prepare');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [repCount, setRepCount] = useState<number>(0);
  const [results, setResults] = useState<WorkoutResults[]>([]);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState<boolean>(false);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState<number>(0);
  
  // Track workout duration
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [totalWorkoutDuration, setTotalWorkoutDuration] = useState<number>(0);
  
  // Flag to prevent repetition detection after workout completion
  const workoutEndingRef = useRef<boolean>(false);
  
  // User context for auth
  const { user } = useAuthContext();
  const [userWeight, setUserWeight] = useState<number>(70); // Default weight if not available
  
  // Confirmation modal state
  const [showEndConfirmation, setShowEndConfirmation] = useState<boolean>(false);
  
  // Loading state for saving workout
  const [isSavingWorkout, setIsSavingWorkout] = useState<boolean>(false);
  
  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const result = await getUserProfile(user.uid);
          if (result.success && result.profile) {
            setUserWeight(result.profile.weight);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  // Create a flattened list of exercises with their set numbers
  const flattenExerciseList = (data: WorkoutData): FlattenedExercise[] => {
    let flattened: FlattenedExercise[] = [];
    
    data.sets.forEach((set, setIndex) => {
      set.cycles.forEach((exerciseName, cycleIndex) => {
        flattened.push({
          name: exerciseName,
          setNumber: set.setNum,
          originalSetIndex: setIndex,
          originalCycleIndex: cycleIndex
        });
      });
    });
    
    return flattened;
  };
  
  // Get the current exercise details
  const getCurrentExercise = (): FlattenedExercise | null => {
    if (!flattenedExercises.length || currentExerciseIndex >= flattenedExercises.length) {
      return null;
    }
    
    return flattenedExercises[currentExerciseIndex];
  };
  
  // Handle form submission to start workout
  const handleStartWorkout = (data: WorkoutData) => {
    console.log('Starting new workout with data:', data);
    
    // Flatten the exercise list into a sequence with set numbers
    const exerciseSequence = flattenExerciseList(data);
    console.log('Flattened exercise sequence:', exerciseSequence);
    
    setWorkoutData(data);
    setFlattenedExercises(exerciseSequence);
    setWorkoutStarted(true);
    setIsWorkoutComplete(false);
    workoutEndingRef.current = false;
    
    // Reset to the first exercise
    setCurrentExerciseIndex(0);
    
    // Check if the very first exercise is workout_end (empty workout)
    if (exerciseSequence.length > 0 && exerciseSequence[0].name === 'workout_end') {
      console.log('First exercise is workout_end. Starting cool down immediately.');
      setTimeout(() => {
        startCoolDown();
      }, 300);
      return;
    }
    
    // Important: Stop any running timer first
    setIsTimerRunning(false);
    
    // Set up preparation phase with its timer
    console.log(`Setting up preparation phase with ${data.preparationTime} seconds`);
    setCurrentPhase('prepare');
    setCurrentTime(data.preparationTime);
    
    // Clear previous results
    setResults([]);
    setTotalCaloriesBurned(0);
    
    // Record start time for duration calculation
    setWorkoutStartTime(Date.now());
    
    // Start the timer with a slight delay to ensure state is settled
    setTimeout(() => {
      console.log('Starting initial timer');
      setIsTimerRunning(true);
    }, 200);
  };
  
  // Simplified approach to handle phase transitions
  const handlePhaseTransition = (newPhase: 'prepare' | 'workout' | 'rest', timeValue: number) => {
    console.log(`Transitioning to phase: ${newPhase} with time: ${timeValue}`);
    
    // Stop current timer and wait for it to fully stop
    setIsTimerRunning(false);
    
    // Use React's batched updates to our advantage
    setTimeout(() => {
      // First update the phase and time
      setCurrentPhase(newPhase);
      setCurrentTime(timeValue);
      
      // Allow time for React to process these updates
      setTimeout(() => {
        if (workoutEndingRef.current) {
          console.log('Workout ending, not starting timer');
          return;
        }
        
        // Finally start the timer
        console.log(`Starting timer for ${newPhase} phase with ${timeValue} seconds`);
        setIsTimerRunning(true);
      }, 150);
    }, 100);
  };
  
  // When workout is complete, calculate total duration
  useEffect(() => {
    if (isWorkoutComplete && workoutStartTime) {
      const endTime = Date.now();
      const durationMs = endTime - workoutStartTime;
      const durationSeconds = Math.floor(durationMs / 1000);
      setTotalWorkoutDuration(durationSeconds);
    }
  }, [isWorkoutComplete, workoutStartTime]);
  
  // When workout is complete, display results
  useEffect(() => {
    if (isWorkoutComplete && user && workoutStartTime) {
      console.log('Workout complete, final results:', results);
      
      // Show saving indicator
      setIsSavingWorkout(true);
      
      // Calculate final duration in seconds
      const endTime = Date.now();
      const durationMs = endTime - workoutStartTime;
      const durationSeconds = Math.floor(durationMs / 1000);
      
      // Save workout results to Firebase
      const saveWorkoutResults = async () => {
        try {
          console.log('Completed workout: Saving final results to Firebase');
          console.log('User ID:', user.uid);
          console.log('Results count:', results.length);
          console.log('Total calories:', totalCaloriesBurned);
          console.log('Duration:', durationSeconds);
          
          // Filter out results with 0 reps (no actual work done)
          const validResults = results.filter(result => result.reps > 0);
          
          // If no valid results, don't save
          if (validResults.length === 0) {
            console.log('No valid workout results to save (all 0 reps)');
            alert('No valid workout data to save. At least one exercise with reps is required.');
            setIsSavingWorkout(false);
            return;
          }
          
          // Import dynamically to avoid circular dependencies
          const { saveWorkoutToFirestore } = await import('@/lib/firebase');
          
          // Get current date for workout record
          const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          
          // Save to Firestore with calorie information and duration
          const saveResult = await saveWorkoutToFirestore(
            user.uid, 
            currentDate, 
            validResults, 
            {
              totalCaloriesBurned,
              durationSeconds
            }
          );
          
          if (!saveResult.success) {
            console.error('Error saving completed workout:', saveResult.error);
            alert(`Error saving workout: ${saveResult.error}`);
          } else {
            console.log('Completed workout saved successfully');
          }
        } catch (error) {
          console.error('Error saving workout results:', error);
          alert(`Failed to save workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          // Always hide the saving indicator
          setIsSavingWorkout(false);
        }
      };
      
      saveWorkoutResults();
    }
  }, [isWorkoutComplete, results, user, workoutStartTime, totalCaloriesBurned]);
  
  // Handle navigation to dashboard
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };
  
  // Function to safely complete workout
  const completeWorkout = () => {
    console.log('Workout complete! Ending workout...');
    // Set the workout ending flag first to stop exercise detection
    workoutEndingRef.current = true;
    // Stop the timer
    setIsTimerRunning(false);
    // Mark workout as complete 
    setIsWorkoutComplete(true);
    // Use the resetWorkoutState for consistent behavior
    setWorkoutStarted(false);
  };
  
  // Function to start the cool down period
  const startCoolDown = () => {
    console.log('Starting cool down period');
    workoutEndingRef.current = true; // Prevent further exercise detection
    
    // Set cool down phase
    setCurrentPhase('rest');
    setCurrentTime(30); // 30 seconds cool down
    
    // Update UI to show cool down message
    setCurrentExerciseIndex(-1); // Special index for cool down
    
    // Start the timer
    setTimeout(() => {
      setIsTimerRunning(true);
    }, 100);
  };
  
  // Handle phase transitions based on timer completion
  const handleTimerComplete = () => {
    if (!workoutData || workoutEndingRef.current) return;
    
    const currentExercise = getCurrentExercise();
    if (!currentExercise) {
      console.log('No current exercise, ending workout');
      completeWorkout();
      return;
    }
    
    console.log(`Timer complete: Phase=${currentPhase}, Exercise=${currentExercise.name}, Set=${currentExercise.setNumber}`);
    
    // Stop the timer to prevent multiple calls
    setIsTimerRunning(false);
    
    if (currentPhase === 'prepare') {
      // Move from preparation to workout
      console.log('Moving from preparation to workout phase');
      handlePhaseTransition('workout', workoutData.workoutTime);
      
    } else if (currentPhase === 'workout') {
      // Check if this is a workout_end marker
      if (currentExercise.name === 'workout_end') {
        console.log('Workout end marker detected. Starting cool down.');
        startCoolDown();
        return;
      }
      
      // Calculate calories burned for this exercise
      const calories = calculateCaloriesBurned(currentExercise.name, repCount, userWeight);
      
      console.log(`Workout phase complete: ${repCount} reps, ${calories} calories burned`);
      
      // Save results for current exercise with calories
      const newResult: WorkoutResults = {
        setNumber: currentExercise.setNumber,
        exercise: currentExercise.name,
        reps: repCount,
        caloriesBurned: calories
      };
      
      setResults(prev => [...prev, newResult]);
      setTotalCaloriesBurned(prevTotal => prevTotal + calories);
      setRepCount(0);
      
      // Enter rest phase
      // Determine if this is rest between sets or exercises within a set
      let restTime = workoutData.restTime;
      
      // Check if next exercise is in a different set
      const nextIndex = currentExerciseIndex + 1;
      if (nextIndex < flattenedExercises.length) {
        const nextExercise = flattenedExercises[nextIndex];
        if (nextExercise.setNumber !== currentExercise.setNumber) {
          // This is rest between sets, make it longer
          restTime = workoutData.restTime * 2;
        }
      }
      
      handlePhaseTransition('rest', restTime);
      
    } else if (currentPhase === 'rest') {
      // Check if this is a cool down period
      if (currentExerciseIndex === -1) {
        // Cool down complete, finish the workout
        completeWorkout();
        return;
      }
      
      // Move to the next exercise
      const nextExerciseIndex = currentExerciseIndex + 1;
      
      // Check if we've reached the end
      if (nextExerciseIndex >= flattenedExercises.length) {
        console.log('No more exercises, starting cool down');
        startCoolDown();
        return;
      }
      
      const nextExercise = flattenedExercises[nextExerciseIndex];
      console.log(`Moving to next exercise: ${nextExercise.name}, Set ${nextExercise.setNumber}`);
      
      // Check if the next exercise is workout_end
      if (nextExercise.name === 'workout_end') {
        console.log('Next exercise is workout_end. Starting cool down immediately.');
        startCoolDown();
        return;
      }
      
      // Set the next exercise
      setCurrentExerciseIndex(nextExerciseIndex);
      
      // Start the workout phase for the new exercise
      handlePhaseTransition('workout', workoutData.workoutTime);
    }
  };
  
  // Handle rep count updates from camera
  const handleRepCount = (count: number) => {
    // Only update rep count if workout is not ending
    if (!workoutEndingRef.current) {
      setRepCount(count);
    }
  };
  
  // Reset workout
  const handleReset = () => {
    // If workout is in progress and we have results, save them before resetting
    if (workoutStarted && results.length > 0 && user) {
      // Show saving indicator
      setIsSavingWorkout(true);
      
      // Calculate workout duration
      let duration = 0;
      if (workoutStartTime) {
        const endTime = Date.now();
        duration = Math.floor((endTime - workoutStartTime) / 1000);
      }
      
      // Save the current results to Firebase
      const saveResults = async () => {
        try {
          console.log('Starting to save workout results...');
          console.log('User ID:', user.uid);
          console.log('Results to save:', results);
          console.log('Total calories:', totalCaloriesBurned);
          console.log('Duration:', duration);
          
          // Filter out results with 0 reps (no actual work done)
          const validResults = results.filter(result => result.reps > 0);
          
          // If no valid results, don't save
          if (validResults.length === 0) {
            console.log('No valid workout results to save (all 0 reps)');
            alert('No valid workout data to save. At least one exercise with reps is required.');
            setIsSavingWorkout(false);
            return;
          }
          
          console.log('Valid results to save:', validResults.length);
          
          // Import directly to ensure we have access to the most current version
          // Use the named import for better error tracking
          const { saveWorkoutToFirestore, db } = await import('@/lib/firebase');
          
          // First, verify the database connection
          if (!db) {
            throw new Error('Firebase database not initialized');
          }
          
          console.log('Firebase DB initialized:', !!db);
          
          // Get current date for workout record
          const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log('Current date:', currentDate);
          
          // Add a unique ID to the workout to ensure it's distinct
          const workoutId = `${currentDate}-${Date.now()}`;
          console.log('Workout ID:', workoutId);
          
          // Save to Firestore with calorie information and duration
          console.log('Calling saveWorkoutToFirestore...');
          const saveResult = await saveWorkoutToFirestore(
            user.uid, 
            currentDate, 
            validResults, 
            {
              totalCaloriesBurned,
              durationSeconds: duration,
              workoutId
            }
          );
          
          console.log('Save result:', saveResult);
          
          if (!saveResult.success) {
            console.error('Error saving workout:', saveResult.error);
            // Show alert before redirecting
            alert(`Error saving workout: ${saveResult.error}`);
            setIsSavingWorkout(false);
          } else {
            console.log('Workout saved successfully, redirecting to dashboard...');
            
            // Try to save a backup to localStorage as well
            try {
              const workoutData = {
                date: currentDate,
                results: validResults,
                summary: {
                  totalCaloriesBurned,
                  durationSeconds: duration
                },
                timestamp: new Date().toISOString()
              };
              
              // Store in localStorage as backup
              const existingBackups = localStorage.getItem('workoutBackups') || '[]';
              const backups = JSON.parse(existingBackups);
              backups.push(workoutData);
              localStorage.setItem('workoutBackups', JSON.stringify(backups));
              console.log('Backup saved to localStorage');
            } catch (backupError) {
              console.warn('Failed to save backup to localStorage:', backupError);
            }
            
            // Redirect to dashboard after a short delay to show saved message
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
          }
        } catch (error) {
          console.error('Error saving workout results:', error);
          // Show the error in an alert
          alert(`Failed to save workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsSavingWorkout(false);
        }
      };
      
      saveResults();
    } else {
      // Just reset without saving
      resetWorkoutState();
    }
  };
  
  // Function to reset all workout state variables
  const resetWorkoutState = () => {
    setWorkoutStarted(false);
    setWorkoutData(null);
    setFlattenedExercises([]);
    setCurrentExerciseIndex(0);
    setResults([]);
    setIsWorkoutComplete(false);
    setTotalCaloriesBurned(0);
    workoutEndingRef.current = false;
  };
  
  // Handle showing the confirmation modal for ending workout
  const handleShowEndConfirmation = () => {
    // Pause the timer while confirmation is shown
    setIsTimerRunning(false);
    setShowEndConfirmation(true);
  };
  
  // Handle canceling the end workout confirmation
  const handleCancelEndWorkout = () => {
    // Resume the timer if we were in an active phase
    if (currentPhase === 'workout' || currentPhase === 'rest') {
      setIsTimerRunning(true);
    }
    setShowEndConfirmation(false);
  };

  // Helper to get the current exercise name (or cool_down if in cool down phase)
  const getCurrentExerciseName = (): string => {
    if (currentExerciseIndex === -1) return 'cool_down';
    const exercise = getCurrentExercise();
    return exercise ? exercise.name : '';
  };

  // Display the set number in the UI format users expect
  const getUISetNumber = (): number | string => {
    if (currentExerciseIndex === -1) return 'Complete!';
    
    const exercise = getCurrentExercise();
    if (!exercise || !workoutData) return 1;
    
    return exercise.setNumber;
  };

  // Get the total number of sets from the original data structure
  const getTotalSets = (): number => {
    return workoutData?.sets.length || 0;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Saving workout overlay */}
        {isSavingWorkout && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center max-w-sm">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-xl font-bold">Saving Your Workout</h3>
              <p className="mt-2">Please wait while we save your progress...</p>
            </div>
          </div>
        )}
        
        {!workoutStarted ? (
          <div>
            {isWorkoutComplete && results.length > 0 ? (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold mb-6">Workout Complete!</h1>
                <div className="card">
                  <h2 className="text-xl font-bold mb-4">Workout Results</h2>
                  <div className="mb-4 p-3 bg-green-100 rounded-lg">
                    <p className="text-lg font-semibold text-green-800">
                      Total Calories Burned: {totalCaloriesBurned} kcal
                    </p>
                    <p className="text-lg font-semibold text-green-800 mt-2">
                      Workout Duration: {Math.floor(totalWorkoutDuration / 60)}:{(totalWorkoutDuration % 60).toString().padStart(2, '0')} minutes
                    </p>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Set</th>
                        <th className="px-4 py-2 text-left">Exercise</th>
                        <th className="px-4 py-2 text-right">Reps</th>
                        <th className="px-4 py-2 text-right">Calories</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">{result.setNumber}</td>
                          <td className="px-4 py-2">
                            {result.exercise.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                          <td className="px-4 py-2 text-right">{result.reps}</td>
                          <td className="px-4 py-2 text-right">{result.caloriesBurned} kcal</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-6 flex space-x-4">
                    <button 
                      onClick={handleReset}
                      className="btn bg-blue-600 hover:bg-blue-700"
                    >
                      Start New Workout
                    </button>
                    <button 
                      onClick={handleGoToDashboard}
                      className="btn bg-green-600 hover:bg-green-700"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-6">Create Your Workout</h1>
                <WorkoutForm onSubmit={handleStartWorkout} />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">
                Set {currentExerciseIndex === -1 ? 'Complete!' : `${getUISetNumber()} of ${getTotalSets()}`}
              </h1>
              <button 
                onClick={handleShowEndConfirmation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                End & Save Workout
              </button>
            </div>
            
            {/* End Workout Confirmation Modal */}
            {showEndConfirmation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">End Workout?</h3>
                  <p className="mb-6">
                    Are you sure you want to end your workout now? Your progress will be saved
                    and you'll be redirected to the dashboard.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handleCancelEndWorkout}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      End Workout
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <WorkoutTimer 
              initialTime={currentTime} 
              isRunning={isTimerRunning} 
              onComplete={handleTimerComplete}
              status={currentPhase}
            />
            
            {currentPhase === 'workout' && currentExerciseIndex !== -1 && getCurrentExerciseName() !== 'workout_end' && (
              <WorkoutCamera 
                currentExercise={getCurrentExerciseName()}
                onRepCount={handleRepCount}
              />
            )}
            
            {getCurrentExerciseName() === 'workout_end' && (
              <div className="card p-6 text-center">
                <h2 className="text-xl font-bold mb-2">Ending Workout...</h2>
                <p>Please wait while we complete your workout.</p>
              </div>
            )}
            
            {(currentPhase !== 'workout' || currentExerciseIndex === -1) && (
              <div className="card text-center py-12">
                <h2 className="text-3xl font-bold mb-6">
                  {currentExerciseIndex === -1 
                    ? 'Cool Down' 
                    : currentPhase === 'prepare' ? 'Get Ready!' : 'Rest Time'}
                </h2>
                <p className="text-xl">
                  {currentExerciseIndex === -1
                    ? 'Great job! Take some deep breaths and stretch gently.'
                    : currentPhase === 'prepare' 
                      ? `Prepare for ${getCurrentExerciseName().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}` 
                      : 'Take a break and get ready for the next exercise'}
                </p>
              </div>
            )}
            
            {results.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Results So Far</h2>
                <div className="mb-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-lg font-semibold text-green-800">
                    Calories Burned So Far: {totalCaloriesBurned} kcal
                  </p>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Set</th>
                      <th className="px-4 py-2 text-left">Exercise</th>
                      <th className="px-4 py-2 text-right">Reps</th>
                      <th className="px-4 py-2 text-right">Calories</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.map((result, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{result.setNumber}</td>
                        <td className="px-4 py-2">
                          {result.exercise.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className="px-4 py-2 text-right">{result.reps}</td>
                        <td className="px-4 py-2 text-right">{result.caloriesBurned} kcal</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WorkoutPage; 