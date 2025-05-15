import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/lib/AuthContext';
import Layout from '@/components/Layout';
import AuthForm from '@/components/AuthForm';
import Image from 'next/image';
import Head from 'next/head';

const AuthPage: React.FC = () => {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const { user, loading } = useAuthContext();
  const router = useRouter();
  
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Authenticating...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <>
      <Head>
        <title>{isNewUser === true ? 'Create Account' : isNewUser === false ? 'Login' : 'Login or Register'} | NeuralFit</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="absolute top-0 left-0 w-full z-10 py-6">
          <div className="container mx-auto px-6">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              NeuralFit
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl w-full space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Left Column - Information */}
              <div className="bg-gradient-to-br from-primary-600 to-secondary-700 rounded-2xl shadow-xl overflow-hidden relative hidden md:block">
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="p-8 h-full flex flex-col relative z-10">
                  <div className="flex-1">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white">
                        {isNewUser === true 
                          ? 'Join Our Fitness Community'
                          : isNewUser === false
                            ? 'Welcome Back to NeuralFit'
                            : 'Transform Your Fitness Journey'
                        }
                      </h2>
                      <div className="mt-4 h-1 w-16 bg-accent-400 rounded"></div>
                    </div>
                    
                    <div className="space-y-6 text-white/90">
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>AI-powered workout tracking with real-time rep counting and form analysis</p>
                      </div>
                      
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Personalized workout analytics and progress tracking</p>
                      </div>
                      
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Access to a wide range of exercises with proper form guidance</p>
                      </div>
                      
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Set and achieve your fitness goals with a data-driven approach</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-8">
                    <div className="text-white/80 text-sm">
                      "NeuralFit has completely transformed my workouts with its AI-powered rep counting and form analysis."
                    </div>
                    <div className="mt-2 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                        J
                      </div>
                      <div className="ml-2">
                        <div className="text-white font-medium text-sm">John D.</div>
                        <div className="text-white/70 text-xs">NeuralFit User</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Auth Forms */}
              <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col">
                {isNewUser === null ? (
                  <div className="flex flex-col h-full justify-center items-center">
                    <div className="text-center mb-10">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to NeuralFit</h2>
                      <p className="text-gray-600 max-w-md">
                        Track your workouts, count reps, and achieve your fitness goals with our AI-powered technology
                      </p>
                    </div>
                    
                    <div className="w-full max-w-xs space-y-4">
                      <button 
                        onClick={() => setIsNewUser(false)}
                        className="btn w-full"
                      >
                        Log in
                      </button>
                      <button 
                        onClick={() => setIsNewUser(true)}
                        className="btn-outline w-full"
                      >
                        Create Account
                      </button>
                      <div className="text-center text-gray-500 text-sm mt-8">
                        By continuing, you agree to our <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a> and <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-8 text-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isNewUser ? 'Create Your Account' : 'Log in to Your Account'}
                      </h2>
                      <p className="mt-2 text-gray-600 text-sm">
                        {isNewUser 
                          ? 'Join today to start tracking your fitness journey'
                          : 'Welcome back! Please enter your details'
                        }
                      </p>
                    </div>
                    
                    <AuthForm mode={isNewUser ? 'register' : 'login'} setIsNewUser={setIsNewUser} />
                    
                    <div className="mt-8 text-center text-sm">
                      {isNewUser ? (
                        <p className="text-gray-600">
                          Already have an account?{' '}
                          <button 
                            onClick={() => setIsNewUser(false)}
                            className="text-primary-600 font-medium hover:text-primary-700"
                          >
                            Log in
                          </button>
                        </p>
                      ) : (
                        <p className="text-gray-600">
                          Don't have an account?{' '}
                          <button 
                            onClick={() => setIsNewUser(true)}
                            className="text-primary-600 font-medium hover:text-primary-700"
                          >
                            Sign up
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage; 