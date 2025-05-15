import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/lib/AuthContext';
import Layout from '@/components/Layout';
import { getUserProfile, updateUserProfile } from '@/lib/firebase';

interface UserProfile {
  nickname: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  updatedAt: string;
}

const ProfilePage: React.FC = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    // If not logged in, redirect to login page
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const result = await getUserProfile(user.uid);
          
          if (result.success && result.profile) {
            const profile = result.profile as UserProfile;
            setNickname(profile.nickname || '');
            setAge(profile.age?.toString() || '');
            setGender(profile.gender || '');
            setHeight(profile.height?.toString() || '');
            setWeight(profile.weight?.toString() || '');
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load profile');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
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
      setIsSaving(true);
      setError('');
      setSuccessMessage('');
      
      const result = await updateUserProfile(user.uid, {
        nickname,
        age: ageNum,
        gender,
        height: heightNum,
        weight: weightNum
      });
      
      if (result.success) {
        setSuccessMessage('Profile updated successfully');
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };
  
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
      <div className="max-w-2xl mx-auto mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-gray-600">
            Update your personal information and preferences
          </p>
        </div>
        
        <div className="card">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname (what we should call you)
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-field"
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
                className="input-field"
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
                className="input-field"
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
                className="input-field"
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
                className="input-field"
                placeholder="Weight in kg"
                required
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="btn w-full"
              >
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 