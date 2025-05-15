import React, { useState } from 'react';
import { useAuthContext } from '@/lib/AuthContext';
import { useRouter } from 'next/router';
import ProfileSetupForm from './ProfileSetupForm';

interface ProfileData {
  nickname: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
}

interface AuthFormProps {
  mode: 'login' | 'register';
  setIsNewUser: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, setIsNewUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  const { login, register } = useAuthContext();
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (mode === 'login') {
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
    } else {
      if (!email || !password || !confirmPassword || !displayName) {
        setError('Please fill in all fields');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }
    
    try {
      setLoading(true);
      setError('');
      
      if (mode === 'login') {
        const result = await login(email, password);
        
        if (result.success) {
          router.push('/dashboard');
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        // For register, we only collect basic info and then show profile setup form
        setShowProfileSetup(true);
      }
    } catch (err: any) {
      setError(err.message || `An error occurred during ${mode === 'login' ? 'login' : 'registration'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithProfile = async (profileData: ProfileData) => {
    try {
      setLoading(true);
      // Register the user with Firebase Auth and include profile data
      const result = await register(email, password, displayName, profileData);
      
      if (result.success) {
        // Redirect to dashboard since profile is already set up
        router.push('/dashboard');
      } else {
        setError(result.error || 'Registration failed');
        setShowProfileSetup(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
      setShowProfileSetup(false);
    } finally {
      setLoading(false);
    }
  };
  
  if (showProfileSetup) {
    return (
      <ProfileSetupForm 
        email={email}
        displayName={displayName}
        password={password}
        onComplete={handleRegisterWithProfile}
        onCancel={() => setShowProfileSetup(false)}
      />
    );
  }
  
  return (
    <div className="w-full max-w-md mx-auto p-2">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {mode === 'login' ? 'Login to Your Account' : 'Create an Account'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Your name"
              required
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="********"
            required
          />
        </div>
        
        {mode === 'register' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="********"
              required
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading 
            ? (mode === 'login' ? 'Logging in...' : 'Proceeding...') 
            : (mode === 'login' ? 'Login' : 'Continue')}
        </button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => setIsNewUser(mode === 'login')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {mode === 'login' ? "Register here" : "Login here"}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default AuthForm; 