import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { logger } from './debug/logger';
import { getApps } from 'firebase/app';

// Define UserProfile interface
export interface UserProfile {
  nickname: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  updatedAt: string;
  calorieMultiplier?: number;
  fitnessLevel?: number;
  lastCalorieFactorUpdate?: string;
}

// Helper functions for calorie calculations
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  // Mifflin-St Jeor Equation
  if (gender.toLowerCase() === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
}

function getAverageBMR(gender: string): number {
  // Average BMR values based on gender
  return gender.toLowerCase() === 'male' ? 1600 : 1400;
}

function calculatePersonalizedCalorieFactor(profile: UserProfile): number {
  // Calculate BMR using Mifflin-St Jeor
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  
  // Base factor from BMR (normalized around average BMR)
  const baseBMRFactor = bmr / getAverageBMR(profile.gender);
  
  // Age factor (gradually reduces with age)
  const ageFactor = Math.max(0.85, 1 - ((profile.age - 30) * 0.003));
  
  // BMI adjustment
  const bmi = profile.weight / Math.pow(profile.height/100, 2);
  const bmiAdjustment = 1 + ((bmi - 22) * 0.01);
  
  // Fitness level factor (starts at 1.0, adjusts over time)
  const fitnessLevelFactor = 1 + (profile.fitnessLevel || 0) * 0.02;
  
  return baseBMRFactor * ageFactor * bmiAdjustment * fitnessLevelFactor;
}

// Update fitness level after completing a workout
export const updateFitnessLevel = async (userId: string, currentFitnessLevel: number = 0) => {
  try {
    const fitnessLevelIncrease = 0.1; // Small increment per workout
    await updateDoc(doc(db, 'userProfiles', userId), {
      fitnessLevel: Math.min(10, currentFitnessLevel + fitnessLevelIncrease),
      lastUpdate: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to update fitness level', error);
    return { success: false, error: error.message };
  }
};

// Your Firebase configuration
// Replace these values with your own Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDNoAH0YumicJHPKMYsMduo5ZpfUXH8Xg",
  authDomain: "webapp-1522.firebaseapp.com",
  databaseURL: "https://webapp-1522-default-rtdb.firebaseio.com",
  projectId: "webapp-1522",
  storageBucket: "webapp-1522.firebasestorage.app",
  messagingSenderId: "965223887227",
  appId: "1:965223887227:web:e0ba99340c7dcb4a724dde",
  measurementId: "G-E75YNZKC65"
};

// Initialize Firebase
logger.log('Initializing Firebase...');

// Check if Firebase app is already initialized to prevent multiple instances
// This is particularly important in Next.js which can cause multiple initializations
let app;
try {
  const apps = getApps();
  
  if (apps.length === 0) {
    logger.log('No Firebase app instance found, initializing a new one');
    app = initializeApp(firebaseConfig);
  } else {
    logger.log('Firebase app already initialized, reusing existing instance');
    app = apps[0];
  }
} catch (error) {
  logger.error('Error during Firebase initialization:', error);
  // Fall back to normal initialization
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);
logger.log('Firebase initialized', { authInitialized: !!auth, dbInitialized: !!db });

// Auth functions
export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string,
  profileData?: {
    nickname: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
  }
) => {
  try {
    logger.log(`Registering user with email: ${email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    logger.log(`User registered successfully with UID: ${user.uid}`);
    
    try {
      // Create user document
      logger.log(`Creating user document in Firestore for UID: ${user.uid}`);
      const userData = {
        email,
        displayName,
        createdAt: new Date().toISOString(),
        workouts: [],
        calorieMultiplier: 1.0,
        fitnessLevel: 0,
        lastCalorieFactorUpdate: new Date().toISOString()
      };
      
      // Create user profile with provided data or defaults
      const userProfileData = profileData ? {
        ...profileData,
        updatedAt: new Date().toISOString(),
        calorieMultiplier: 1.0,
        fitnessLevel: 0,
        lastCalorieFactorUpdate: new Date().toISOString()
      } : {
        nickname: displayName,
        age: 30, // Default age
        gender: 'prefer-not-to-say', // Default gender
        height: 170, // Default height in cm
        weight: 70, // Default weight in kg
        updatedAt: new Date().toISOString(),
        calorieMultiplier: 1.0,
        fitnessLevel: 0,
        lastCalorieFactorUpdate: new Date().toISOString()
      };
      
      // If profile data is provided, calculate personalized calorie factor
      if (profileData) {
        userProfileData.calorieMultiplier = calculatePersonalizedCalorieFactor({
          ...userProfileData,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Save both documents
      const userRef = doc(db, 'users', user.uid);
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      
      await Promise.all([
        setDoc(userRef, userData),
        setDoc(userProfileRef, userProfileData)
      ]);
      
      logger.log('User documents created successfully');
      
      return { success: true, user };
    } catch (firestoreError: any) {
      logger.error('Failed to create user documents in Firestore', firestoreError);
      
      // Still return success since the user was created in Authentication
      return { 
        success: true, 
        user,
        warning: "User registered but profile data could not be saved. Please update your profile." 
      };
    }
  } catch (error: any) {
    logger.error('Registration failed', error);
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// User profile functions
export const saveUserProfile = async (
  userId: string, 
  profileData: { 
    nickname: string; 
    age: number; 
    gender: string; 
    height: number; 
    weight: number;
  }
) => {
  try {
    logger.log(`Saving user profile for UID: ${userId}`);
    const userProfileRef = doc(db, 'userProfiles', userId);
    
    // Calculate the personalized calorie factor
    const calorieMultiplier = calculatePersonalizedCalorieFactor({
      ...profileData,
      updatedAt: new Date().toISOString(),
      fitnessLevel: 0
    });
    
    const data = {
      ...profileData,
      updatedAt: new Date().toISOString(),
      calorieMultiplier,
      fitnessLevel: 0,
      lastCalorieFactorUpdate: new Date().toISOString()
    };
    
    await setDoc(userProfileRef, data, { merge: true });
    logger.log('User profile saved successfully');
    
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to save user profile', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
    
    if (profileDoc.exists()) {
      return { success: true, profile: profileDoc.data() as UserProfile };
    } else {
      return { success: false, error: 'Profile not found', profile: null };
    }
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message, profile: null };
  }
};

export const updateUserProfile = async (
  userId: string, 
  profileUpdates: Partial<UserProfile>
) => {
  try {
    const userProfileRef = doc(db, 'userProfiles', userId);
    const userProfileDoc = await getDoc(userProfileRef);
    
    if (userProfileDoc.exists()) {
      const userProfile = userProfileDoc.data() as UserProfile;
      const updatedProfile = {
        ...userProfile,
        ...profileUpdates,
        updatedAt: new Date().toISOString()
      };
      
      // Recalculate calorie multiplier when profile changes
      updatedProfile.calorieMultiplier = calculatePersonalizedCalorieFactor(updatedProfile);
      updatedProfile.lastCalorieFactorUpdate = new Date().toISOString();
      
      await updateDoc(userProfileRef, updatedProfile);
      logger.log('User profile updated successfully');
      
      return { success: true };
    } else {
      throw new Error('User profile not found');
    }
  } catch (error: any) {
    logger.error('Failed to update user profile', error);
    return { success: false, error: error.message };
  }
};

// Custom hook for auth state
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return { user, loading };
};

// Firestore functions for workout data
export const saveWorkoutToFirestore = async (
  userId: string, 
  date: string, 
  results: any[], 
  summaryData?: {
    totalCaloriesBurned: number;
    durationSeconds: number;
    workoutId?: string;
  }
) => {
  try {
    console.log('[Firebase] Starting to save workout to Firestore for user:', userId);
    console.log('[Firebase] Workout data:', { date, resultsCount: results.length, summaryData });
    
    // Validate inputs
    if (!userId) throw new Error('User ID is required');
    if (!date) throw new Error('Date is required');
    if (!results || !Array.isArray(results)) throw new Error('Results must be an array');
    if (results.length === 0) throw new Error('Results array cannot be empty');
    
    // Check if Firebase is properly initialized
    if (!db) {
      console.error('[Firebase] Firestore not initialized!');
      throw new Error('Firebase database not initialized');
    }
    
    // Test database connectivity
    try {
      console.log('[Firebase] Testing database connectivity...');
      const testRef = doc(db, 'connectionTest', 'test');
      await setDoc(testRef, { timestamp: new Date().toISOString() }, { merge: true });
      console.log('[Firebase] Database connection successful');
    } catch (connError: any) {
      console.error('[Firebase] Database connection test failed:', connError);
      throw new Error(`Database connection failed: ${connError.message}`);
    }
    
    // Get user profile to apply calorie multiplier
    console.log('[Firebase] Fetching user profile...');
    const profileResult = await getUserProfile(userId);
    console.log('[Firebase] User profile fetch result:', profileResult.success);
    
    const calorieMultiplier = profileResult.success && profileResult.profile 
      ? profileResult.profile.calorieMultiplier || 1.0
      : 1.0;
    
    console.log('[Firebase] Using calorie multiplier:', calorieMultiplier);
    
    // Apply calorie multiplier to each exercise result
    console.log('[Firebase] Applying calorie multiplier to results');
    const resultsWithCalories = results.map(result => {
      if (result.caloriesBurned) {
        return {
          ...result,
          caloriesBurned: Math.round(result.caloriesBurned * calorieMultiplier)
        };
      }
      return result;
    });
    
    // Generate a unique workout ID if not provided
    const workoutId = summaryData?.workoutId || `${date}-${Date.now()}`;
    console.log('[Firebase] Using workout ID:', workoutId);
    
    // Prepare the workout data with optional summary
    const workoutData: any = { 
      date, 
      workoutId,
      results: resultsWithCalories,
      lastUpdated: new Date().toISOString()
    };
    
    // Add summary data if provided
    if (summaryData) {
      workoutData.summary = {
        totalCaloriesBurned: Math.round(summaryData.totalCaloriesBurned * calorieMultiplier),
        durationSeconds: summaryData.durationSeconds,
        durationFormatted: formatDuration(summaryData.durationSeconds)
      };
    }
    
    // Try a different approach - write directly to a workout collection
    try {
      console.log('[Firebase] Trying direct workout save approach...');
      
      // Create a workout document in a workouts collection
      const workoutRef = doc(db, 'workouts', workoutId);
      const fullWorkoutData = {
        ...workoutData,
        userId,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(workoutRef, fullWorkoutData);
      console.log('[Firebase] Successfully saved workout directly to workouts collection');
      
      // Also create a user-workouts reference
      const userWorkoutRef = doc(db, `users/${userId}/workouts`, workoutId);
      await setDoc(userWorkoutRef, fullWorkoutData);
      console.log('[Firebase] Successfully saved workout to user workouts subcollection');
      
      // Update the user's fitness level
      if (profileResult.success && profileResult.profile) {
        try {
          console.log('[Firebase] Updating fitness level');
          await updateFitnessLevel(userId, profileResult.profile.fitnessLevel || 0);
          console.log('[Firebase] Fitness level updated');
        } catch (fitnessError) {
          console.warn('[Firebase] Error updating fitness level (non-critical):', fitnessError);
        }
      }
      
      return { success: true, workoutId };
    } catch (directSaveError: any) {
      console.error('[Firebase] Direct save failed, falling back to user document update:', directSaveError);
      // Continue to the original approach below
    }
    
    console.log('[Firebase] Getting user document...');
    const userRef = doc(db, 'users', userId);
    
    // Retry mechanism for Firestore operations
    let retries = 0;
    const maxRetries = 3;
    let userDoc;
    
    while (retries < maxRetries) {
      try {
        userDoc = await getDoc(userRef);
        break;
      } catch (error) {
        retries++;
        console.warn(`[Firebase] Error getting user document (attempt ${retries}/${maxRetries}):`, error);
        if (retries >= maxRetries) throw error;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!userDoc || !userDoc.exists()) {
      console.error('[Firebase] User document not found for ID:', userId);
      
      // As a fallback, try to create the document if it doesn't exist
      try {
        console.log('[Firebase] Attempting to create user document as fallback');
        await setDoc(userRef, {
          workouts: [workoutData],  // Initialize with the current workout
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('[Firebase] Successfully created user document with workout data');
        return { success: true, workoutId };
      } catch (createError) {
        console.error('[Firebase] Failed to create fallback user document:', createError);
        throw new Error('User document not found and could not be created');
      }
    }
    
    console.log('[Firebase] User document exists, proceeding to update');
    const userData = userDoc.data();
    const workouts = userData.workouts || [];
    
    // Check if workout for this date exists
    const existingWorkoutIndex = workouts.findIndex((w: any) => w.workoutId === workoutId);
    
    if (existingWorkoutIndex !== -1) {
      // Update existing workout
      console.log('[Firebase] Updating existing workout with ID:', workoutId);
      workouts[existingWorkoutIndex] = workoutData;
    } else {
      // Add new workout
      console.log('[Firebase] Adding new workout with ID:', workoutId);
      workouts.push(workoutData);
    }
    
    try {
      // Update user document
      console.log('[Firebase] Updating user document with workout data...');
      
      // Use a transaction to ensure atomic updates
      retries = 0;
      while (retries < maxRetries) {
        try {
          await updateDoc(userRef, { 
            workouts,
            lastUpdated: new Date().toISOString()
          });
          console.log('[Firebase] User document updated successfully');
          break;
        } catch (updateError) {
          retries++;
          console.warn(`[Firebase] Error updating user document (attempt ${retries}/${maxRetries}):`, updateError);
          if (retries >= maxRetries) throw updateError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update user's fitness level
      if (profileResult.success && profileResult.profile) {
        console.log('[Firebase] Updating fitness level');
        try {
          await updateFitnessLevel(userId, profileResult.profile.fitnessLevel || 0);
          console.log('[Firebase] Fitness level updated');
        } catch (fitnessError) {
          console.warn('[Firebase] Error updating fitness level (non-critical):', fitnessError);
        }
      }
      
      // Verify the update was successful by reading back the data
      const verifyDoc = await getDoc(userRef);
      if (verifyDoc.exists()) {
        const verifyData = verifyDoc.data();
        if (verifyData.workouts && verifyData.workouts.length > 0) {
          console.log('[Firebase] Verified workout data was saved successfully');
          return { success: true, workoutId };
        } else {
          console.warn('[Firebase] Workout data might not have been saved correctly');
          return { success: true, warning: 'Data might not have been saved correctly', workoutId };
        }
      }
      
      return { success: true, workoutId };
    } catch (updateError: any) {
      console.error('[Firebase] Error updating user document:', updateError);
      return { success: false, error: `Failed to update user document: ${updateError.message}` };
    }
  } catch (error: any) {
    console.error('[Firebase] Error saving workout:', error);
    
    // Try to save to localStorage as fallback
    try {
      console.log('[Firebase] Attempting to save to localStorage as fallback');
      const workoutData = {
        userId,
        date,
        results,
        summaryData,
        timestamp: new Date().toISOString()
      };
      
      // Get existing backup data or initialize
      const existing = localStorage.getItem('workoutBackup') || '[]';
      const backupData = JSON.parse(existing);
      backupData.push(workoutData);
      
      // Save back to localStorage
      localStorage.setItem('workoutBackup', JSON.stringify(backupData));
      console.log('[Firebase] Workout data saved to localStorage as backup');
      
      return { 
        success: false, 
        error: `${error.message} (But data was backed up locally)`,
        fallbackUsed: true
      };
    } catch (fallbackError) {
      console.error('[Firebase] Failed to save fallback data:', fallbackError);
      return { success: false, error: error.message };
    }
  }
};

// Helper function to format duration in seconds to readable format
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export const getUserWorkouts = async (userId: string) => {
  try {
    console.log('[Firebase] Getting workouts for user:', userId);
    
    if (!userId) {
      console.error('[Firebase] getUserWorkouts called with empty userId');
      return { success: false, error: 'User ID is required', workouts: [] };
    }
    
    if (!db) {
      console.error('[Firebase] Firestore not initialized in getUserWorkouts');
      return { success: false, error: 'Firebase not initialized', workouts: [] };
    }
    
    // Try multiple approaches to get the workout data
    let allWorkouts: any[] = [];
    let errors: string[] = [];
    
    // Approach 1: Check direct workouts collection
    try {
      console.log('[Firebase] Checking workouts collection...');
      const q = query(collection(db, 'workouts'), where('userId', '==', userId));
      const workoutsSnapshot = await getDocs(q);
      
      if (!workoutsSnapshot.empty) {
        const directWorkouts = workoutsSnapshot.docs.map(doc => doc.data());
        console.log(`[Firebase] Found ${directWorkouts.length} workouts in workouts collection`);
        allWorkouts = [...allWorkouts, ...directWorkouts];
      } else {
        console.log('[Firebase] No workouts found in workouts collection');
      }
    } catch (directError: any) {
      console.error('[Firebase] Error fetching from workouts collection:', directError);
      errors.push(`Error fetching from workouts collection: ${directError.message}`);
    }
    
    // Approach 2: Check user-workouts subcollection
    try {
      console.log('[Firebase] Checking user workouts subcollection...');
      const userWorkoutsRef = collection(db, `users/${userId}/workouts`);
      const userWorkoutsSnapshot = await getDocs(userWorkoutsRef);
      
      if (!userWorkoutsSnapshot.empty) {
        const subcollectionWorkouts = userWorkoutsSnapshot.docs.map(doc => doc.data());
        console.log(`[Firebase] Found ${subcollectionWorkouts.length} workouts in user subcollection`);
        
        // Filter out any duplicates (by workoutId) that might already be in allWorkouts
        const newWorkouts = subcollectionWorkouts.filter(newWorkout => 
          !allWorkouts.some(existing => existing.workoutId === newWorkout.workoutId)
        );
        
        allWorkouts = [...allWorkouts, ...newWorkouts];
      } else {
        console.log('[Firebase] No workouts found in user subcollection');
      }
    } catch (subcollectionError: any) {
      console.error('[Firebase] Error fetching from user workouts subcollection:', subcollectionError);
      errors.push(`Error fetching from user workouts subcollection: ${subcollectionError.message}`);
    }
    
    // Approach 3: Check the original storage location (user document's workouts array)
    try {
      console.log('[Firebase] Checking user document for workouts array...');
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.workouts && Array.isArray(userData.workouts) && userData.workouts.length > 0) {
          console.log(`[Firebase] Found ${userData.workouts.length} workouts in user document`);
          
          // Filter out any duplicates by workoutId if it exists, otherwise by date
          const newWorkouts = userData.workouts.filter(newWorkout => {
            if (newWorkout.workoutId) {
              return !allWorkouts.some(existing => existing.workoutId === newWorkout.workoutId);
            } else {
              return !allWorkouts.some(existing => existing.date === newWorkout.date);
            }
          });
          
          allWorkouts = [...allWorkouts, ...newWorkouts];
        } else {
          console.log('[Firebase] No workouts found in user document');
        }
      } else {
        console.log('[Firebase] User document not found, skipping workouts array check');
      }
    } catch (userDocError: any) {
      console.error('[Firebase] Error fetching from user document:', userDocError);
      errors.push(`Error fetching from user document: ${userDocError.message}`);
    }
    
    // Return results
    console.log(`[Firebase] Total workouts found across all locations: ${allWorkouts.length}`);
    
    if (allWorkouts.length === 0 && errors.length > 0) {
      // If we found no workouts and had errors, try checking localStorage backup
      console.log('[Firebase] No workouts found in Firestore, checking backup in localStorage');
      
      try {
        const workoutBackups = localStorage.getItem('workoutBackups');
        if (workoutBackups) {
          const backupData = JSON.parse(workoutBackups);
          const userBackups = backupData.filter((workout: any) => {
            return workout.userId === userId || (
              workout.results && workout.results.length > 0
            );
          });
          
          if (userBackups.length > 0) {
            console.log(`[Firebase] Found ${userBackups.length} workouts in localStorage backup`);
            return {
              success: true,
              workouts: userBackups,
              warnings: ['Using workout data from localStorage backup', ...errors]
            };
          }
        }
      } catch (backupError) {
        console.error('[Firebase] Error checking localStorage backup:', backupError);
      }
      
      return {
        success: false,
        error: 'Failed to retrieve workouts from all sources',
        details: errors,
        workouts: []
      };
    }
    
    // Sort workouts by date (newest first)
    const sortedWorkouts = [...allWorkouts].sort((a, b) => {
      // If timestamp exists, use it for most accurate sorting
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Otherwise fall back to date
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Log the dates of the workouts to help debug
    if (sortedWorkouts.length > 0) {
      console.log('[Firebase] Workout dates:', sortedWorkouts.map(w => w.date).join(', '));
    }
    
    return {
      success: true,
      workouts: sortedWorkouts,
      warnings: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    console.error('[Firebase] Error getting workouts:', error);
    
    // Try to check for backup data in localStorage
    try {
      const backupData = localStorage.getItem('workoutBackup');
      if (backupData) {
        const parsedBackup = JSON.parse(backupData);
        const userBackups = parsedBackup.filter((item: any) => item.userId === userId);
        
        if (userBackups.length > 0) {
          console.log('[Firebase] Found backup workout data in localStorage:', userBackups.length);
          return { 
            success: true, 
            workouts: userBackups.map((item: any) => ({
              date: item.date,
              results: item.results,
              summary: item.summaryData
            })),
            usingBackup: true
          };
        }
      }
      
      // Also check the other backup format
      const workoutBackups = localStorage.getItem('workoutBackups');
      if (workoutBackups) {
        const parsedWorkoutBackups = JSON.parse(workoutBackups);
        if (parsedWorkoutBackups.length > 0) {
          console.log('[Firebase] Found backup workout data in workoutBackups:', parsedWorkoutBackups.length);
          return {
            success: true,
            workouts: parsedWorkoutBackups,
            usingBackup: true
          };
        }
      }
    } catch (backupError) {
      console.error('[Firebase] Error checking backup data:', backupError);
    }
    
    return { success: false, error: error.message, workouts: [] };
  }
};

// Function to calculate calories burned based on exercise type, rep count, and user weight
export const calculateCaloriesBurned = (exerciseType: string, reps: number, userWeight: number): number => {
  if (exerciseType === 'workout_end' || exerciseType === 'workout-end') {
    return 0; // No calories for workout end marker
  }
  
  // Base calories per rep for a person weighing 70kg
  const caloriesPerRepBase: {[key: string]: number} = {
    'burpees': 0.5,
    'squats': 0.32,
    'high_knees': 0.2,
    'mountain_climbers': 0.25,
    'jumping_jacks': 0.2
  };
  
  // Default to squats if exercise type not found
  const caloriesPerRep = caloriesPerRepBase[exerciseType] || caloriesPerRepBase['squats'];
  
  // Adjust based on weight (simplified linear adjustment)
  const weightFactor = userWeight / 70;
  
  // Calculate total calories and round to 1 decimal place
  return Math.round(caloriesPerRep * reps * weightFactor * 10) / 10;
};

export { auth, db }; 