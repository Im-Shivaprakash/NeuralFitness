import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/lib/AuthContext';
import Layout from '@/components/Layout';
import { getUserWorkouts } from '@/lib/firebase';
import Link from 'next/link';

interface WorkoutResult {
  exercise: string;
  reps: number;
  duration: number;
}

interface Workout {
  date: string;
  results: WorkoutResult[];
}

const HistoryPage: React.FC = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // If not logged in, redirect to login page
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const result = await getUserWorkouts(user.uid);
          
          if (result.success) {
            // Sort workouts by date, newest first
            const sortedWorkouts = [...result.workouts].sort((a, b) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            setWorkouts(sortedWorkouts);
          } else {
            setError(result.error || 'Failed to load workout history');
          }
        } catch (err: any) {
          setError(err.message || 'An error occurred while loading workout history');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchWorkoutHistory();
  }, [user]);
  
  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-xl">Loading...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Workout History</h1>
          <p className="text-gray-600">
            Track your progress and see how you've improved over time
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {workouts.length === 0 ? (
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No Workouts Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't recorded any workouts yet. Start your fitness journey today!
            </p>
            <Link href="/workout" className="btn">
              Start Your First Workout
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {workouts.map((workout, index) => (
              <div key={index} className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {new Date(workout.date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <Link href={`/workout-details/${workout.date}`} className="text-blue-600 font-medium">
                    View Details
                  </Link>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exercise
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Repetitions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration (sec)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workout.results.map((result, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {result.exercise}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.reps}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.duration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage; 