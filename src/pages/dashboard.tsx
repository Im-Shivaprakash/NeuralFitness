import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/lib/AuthContext';
import Layout from '@/components/Layout';
import { getUserProfile, getUserWorkouts } from '@/lib/firebase';
import Link from 'next/link';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';

interface UserProfile {
  nickname: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  updatedAt: string;
}

interface Workout {
  date: string;
  results: Array<{
    exercise: string;
    reps: number;
    caloriesBurned?: number;
  }>;
  summary?: {
    totalCaloriesBurned: number;
    durationSeconds: number;
    durationFormatted: string;
  };
}

const Dashboard: React.FC = () => {
  const { user, loading, logout } = useAuthContext();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // If not logged in, redirect to login page
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          setLoadingProfile(true);
          setError('');
          
          console.log('Dashboard: Fetching user data for ID:', user.uid);
          
          // Fetch user profile
          const profileResult = await getUserProfile(user.uid);
          console.log('Dashboard: Profile fetch result:', profileResult.success);
          
          if (profileResult.success && profileResult.profile) {
            setProfile(profileResult.profile as UserProfile);
          } else {
            console.warn('Dashboard: Failed to load profile:', profileResult.error);
            setError('Failed to load profile data');
          }
          
          // Fetch user workouts
          console.log('Dashboard: Fetching workout history...');
          const workoutsResult = await getUserWorkouts(user.uid);
          console.log('Dashboard: Workouts fetch result:', workoutsResult.success, 'Count:', workoutsResult.workouts?.length);
          
          if (workoutsResult.success) {
            setWorkouts(workoutsResult.workouts);
            
            if (workoutsResult.workouts.length === 0) {
              console.log('Dashboard: No workouts found for user');
            } else {
              console.log('Dashboard: Latest workout date:', workoutsResult.workouts[0]?.date);
            }
          } else {
            console.warn('Dashboard: Failed to load workouts:', workoutsResult.error);
            setError(prev => prev ? `${prev}, Failed to load workout history` : 'Failed to load workout history');
          }
        } catch (err: any) {
          console.error('Dashboard: Error fetching user data:', err);
          setError(err.message || 'Failed to load user data');
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    
    fetchUserData();
    
    // Set up a refresh interval to periodically check for new data
    // This helps if workout data was saved when the dashboard was already open
    const refreshInterval = setInterval(fetchUserData, 30000); // Check every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [user]);
  
  // Add a manual refresh function
  const refreshData = async () => {
    if (!user) return;
    
    try {
      setLoadingProfile(true);
      setError('');
      
      console.log('Dashboard: Manually refreshing data for user:', user.uid);
      
      // Fetch user workouts
      const workoutsResult = await getUserWorkouts(user.uid);
      if (workoutsResult.success) {
        setWorkouts(workoutsResult.workouts);
        console.log('Dashboard: Refreshed workout data, count:', workoutsResult.workouts.length);
      } else {
        console.warn('Dashboard: Failed to refresh workouts:', workoutsResult.error);
        setError('Failed to refresh workout data');
      }
    } catch (err: any) {
      console.error('Dashboard: Error refreshing data:', err);
      setError(err.message || 'Failed to refresh data');
    } finally {
      setLoadingProfile(false);
    }
  };
  
  // Function to test direct database connectivity
  const testDatabaseConnection = async () => {
    try {
      setError('');
      console.log('Testing direct Firestore connection...');
      
      // Get Firestore instance
      const db = getFirestore();
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      // Create a test document
      const testRef = doc(db, 'connectionTest', 'test-' + Date.now());
      const testData = {
        timestamp: new Date().toISOString(),
        userId: user?.uid || 'anonymous',
        message: 'Connection test'
      };
      
      console.log('Writing test data to Firestore:', testData);
      await setDoc(testRef, testData);
      console.log('Successfully wrote to Firestore');
      
      // Read it back to verify
      const readResult = await getDoc(testRef);
      if (readResult.exists()) {
        console.log('Successfully read data back from Firestore:', readResult.data());
        alert('Database connection test successful! Data was properly saved and retrieved.');
      } else {
        throw new Error('Test document not found after writing');
      }
    } catch (err: any) {
      console.error('Database connection test failed:', err);
      setError(`Database connection test failed: ${err.message}`);
      alert(`Database connection failed: ${err.message}`);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
  
  if (loading || loadingProfile) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading your fitness data...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Calculate some stats
  const totalWorkouts = workouts.length;
  const totalReps = workouts.reduce((sum, workout) => {
    return sum + workout.results.reduce((exerciseSum, result) => exerciseSum + result.reps, 0);
  }, 0);
  
  // Calculate total calories burned across all workouts
  const totalCaloriesBurned = workouts.reduce((sum, workout) => {
    if (workout.summary?.totalCaloriesBurned) {
      return sum + workout.summary.totalCaloriesBurned;
    }
    return sum + workout.results.reduce((exerciseSum, result) => exerciseSum + (result.caloriesBurned || 0), 0);
  }, 0);
  
  // Get recent workouts
  const recentWorkouts = [...workouts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }).slice(0, 3);
  
  // Get date of last workout
  const lastWorkoutDate = workouts.length > 0 
    ? new Date(recentWorkouts[0]?.date || '') 
    : null;
  
  return (
    <Layout title="Dashboard | NeuralFit">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {profile?.nickname || user.displayName || 'Fitness Enthusiast'}
              </h1>
              <p className="mt-1 text-gray-600">
                {lastWorkoutDate 
                  ? `Last workout: ${lastWorkoutDate.toLocaleDateString()}`
                  : 'Ready to start your first workout?'}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <button 
                onClick={refreshData} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center"
                disabled={loadingProfile}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                {loadingProfile ? 'Refreshing...' : 'Refresh'}
              </button>
              <button 
                onClick={testDatabaseConnection} 
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Test DB
              </button>
              <Link href="/workout" className="btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Start Workout
              </Link>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="text-gray-500 text-sm font-medium mb-1">Total Workouts</div>
            <div className="text-3xl font-bold text-gray-900">{totalWorkouts}</div>
            <div className="mt-1 text-xs text-gray-500">All time</div>
          </div>
          
          <div className="stat-card">
            <div className="text-gray-500 text-sm font-medium mb-1">Total Calories Burned</div>
            <div className="text-3xl font-bold text-gray-900">{totalCaloriesBurned}</div>
            <div className="mt-1 text-xs text-gray-500">All workouts</div>
          </div>
          
          {profile ? (
            <>
              <div className="stat-card">
                <div className="text-gray-500 text-sm font-medium mb-1">BMI</div>
                <div className="text-3xl font-bold text-gray-900">
                  {(profile.weight / Math.pow(profile.height/100, 2)).toFixed(1)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Height: {profile.height} cm / Weight: {profile.weight} kg
                </div>
              </div>
              
              <div className="stat-card">
                <div className="text-gray-500 text-sm font-medium mb-1">Profile</div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                    {profile.nickname ? profile.nickname.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="ml-2 text-gray-900 font-medium">{profile.nickname || 'User'}</div>
                </div>
                <div className="mt-2 flex">
                  <Link href="/profile" className="text-sm text-primary-600 hover:text-primary-700">
                    View Profile
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="stat-card md:col-span-2">
              <div className="text-gray-500 text-sm font-medium mb-1">Profile Status</div>
              <div className="text-gray-900 font-medium">Profile Not Complete</div>
              <div className="mt-2">
                <Link href="/profile" className="btn-sm bg-primary-50 text-primary-700 hover:bg-primary-100">
                  Complete Your Profile
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Recent Workouts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Workouts</h2>
                <Link href="/history" className="text-primary-600 text-sm font-medium hover:text-primary-700">
                  View All
                </Link>
              </div>
              
              {recentWorkouts.length > 0 ? (
                <div className="space-y-5">
                  {recentWorkouts.map((workout, index) => {
                    const workoutDate = new Date(workout.date);
                    const totalReps = workout.results.reduce((sum, result) => sum + result.reps, 0);
                    // Get duration and calories from summary if available, otherwise calculate
                    const totalCalories = workout.summary?.totalCaloriesBurned || 
                      workout.results.reduce((sum, result) => sum + (result.caloriesBurned || 0), 0);
                    const durationDisplay = workout.summary?.durationFormatted || 
                      `${Math.round((workout.summary?.durationSeconds || 0) / 60)} mins`;
                    
                    return (
                      <div key={index} className="p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {workoutDate.toLocaleDateString(undefined, { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {workout.results.length} exercise{workout.results.length !== 1 ? 's' : ''} · {totalReps} reps · {durationDisplay}
                            </div>
                          </div>
                          <Link href={`/workout-details/${workout.date}`} className="text-sm text-primary-600 hover:text-primary-700">
                            Details
                          </Link>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-1">
                          <div className="px-2 py-1 bg-gray-50 rounded text-sm">
                            <span className="text-gray-600 font-medium">Exercises:</span> {workout.results.length}
                          </div>
                          <div className="px-2 py-1 bg-gray-50 rounded text-sm">
                            <span className="text-gray-600 font-medium">Calories:</span> {totalCalories}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No workouts yet</h3>
                  <p className="mt-1 text-gray-500">Start your first workout to begin tracking your progress.</p>
                  <div className="mt-6">
                    <Link href="/workout" className="btn">
                      Start First Workout
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                <Link href="/workout" className="flex items-center p-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">New Workout</div>
                    <div className="text-sm text-gray-500">Start a new tracking session</div>
                  </div>
                </Link>
                
                <Link href="/history" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Workout History</div>
                    <div className="text-sm text-gray-500">Review past workouts</div>
                  </div>
                </Link>
                
                <Link href="/profile" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Update Profile</div>
                    <div className="text-sm text-gray-500">Edit personal information</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 