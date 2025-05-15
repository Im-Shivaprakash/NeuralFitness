import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/lib/AuthContext';
import Layout from '@/components/Layout';
import { db, auth, saveUserProfile } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { logger } from '@/lib/debug/logger';

const ProfileSetup: React.FC = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // If not logged in, redirect to login page
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the inputs
    if (!nickname || !age || !gender || !height || !weight) {
      setError('Please fill in all fields');
      return;
    }
    
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 120) {
      setError('Please enter a valid age between 12 and 120');
      return;
    }
    
    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      setError('Please enter a valid height in cm (100-250)');
      return;
    }
    
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      setError('Please enter a valid weight in kg (30-300)');
      return;
    }
    
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setIsSubmitting(true);
      logger.log('Submitting profile data', { userId: user.uid });
      
      // Use the saveUserProfile function instead of direct Firestore calls
      const result = await saveUserProfile(user.uid, {
        nickname,
        age: ageNum,
        gender,
        height: heightNum,
        weight: weightNum
      });
      
      if (result.success) {
        logger.log('Profile saved successfully, redirecting to dashboard');
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to save profile information');
      }
    } catch (err: any) {
      logger.error('Error in profile setup:', err);
      setError(err.message || 'Failed to save profile information');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
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
      <div className="max-w-lg mx-auto mt-10">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-4">
                We need a few more details to personalize your fitness experience.
              </p>
            </div>
            
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname (what we should call you)
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Nickname"
                required
              />
            </div>
            
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                id="age"
                type="number"
                min="12"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Age"
                required
              />
            </div>
            
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                id="height"
                type="number"
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Height in cm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                min="30"
                max="300"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Weight in kg"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile Setup'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProfileSetup; 