export interface WorkoutCycle {
  exercise: string;
  reps: number;
}

export interface WorkoutSet {
  setNum: number;
  cycles: string[];
}

// New simplified workout structure
export interface WorkoutExercise {
  name: string;    // Exercise type
  setsCount: number;  // Number of sets to perform
}

// Keep the original structure for UI
export interface WorkoutData {
  preparationTime: number;
  workoutTime: number;
  restTime: number;
  sets: WorkoutSet[];  // Original structure for UI
}

// Internal tracking structure
export interface FlattenedExercise {
  name: string;      // Exercise name
  setNumber: number; // Set number
  originalSetIndex: number; // Index in the original set array
  originalCycleIndex: number; // Index in the original set's cycles array
}

export interface WorkoutResults {
  setNumber: number;
  exercise: string;
  reps: number;
  caloriesBurned?: number;
}

export type ExerciseType = 'burpees' | 'squats' | 'high_knees' | 'mountain_climbers' | 'jumping_jacks' | 'workout_end';

export const EXERCISE_TYPES: ExerciseType[] = [
  'burpees',
  'squats',
  'high_knees',
  'mountain_climbers',
  'jumping_jacks',
  'workout_end'
]; 