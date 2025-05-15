import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>NeuralFit | AI-Powered Fitness Tracking</title>
        <meta name="description" content="Track your workouts, count reps, and achieve your fitness goals with AI-powered technology" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <header className="absolute top-0 left-0 w-full z-10 py-6">
          <div className="container mx-auto px-6 flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              NeuralFit
            </div>
            <div>
              <Link href="/auth" className="btn-sm">
                Get Started
              </Link>
            </div>
          </div>
        </header>
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative h-screen bg-gradient-to-br from-primary-700 via-primary-800 to-secondary-900 overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-6 relative z-10 py-32 md:py-0">
                <div className="flex justify-center">
                  <div className="text-white max-w-2xl">
                    <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                      Your AI Fitness Companion
                    </h1>
                    <p className="mt-6 text-xl text-white/80 max-w-lg">
                      Track workouts, count reps, and perfect your form with real-time AI feedback
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <Link href="/auth" className="btn bg-white text-primary-700 hover:bg-gray-100">
                        Start Your Fitness Journey
                      </Link>
                      <Link href="/auth?demo=true" className="btn-outline border-white text-white hover:bg-white/10">
                        Try Demo
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Powered by AI Technology</h2>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                  NeuralFit combines cutting-edge AI with intuitive design to deliver the ultimate fitness tracking experience
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="card">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Rep Counting</h3>
                  <p className="text-gray-600">
                    Automatically counts your repetitions for various exercises with high accuracy
                  </p>
                </div>
                
                <div className="card">
                  <div className="w-12 h-12 bg-secondary-100 text-secondary-600 rounded-lg flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Form Analysis</h3>
                  <p className="text-gray-600">
                    Get feedback on your exercise form to prevent injuries and maximize results
                  </p>
                </div>
                
                <div className="card">
                  <div className="w-12 h-12 bg-accent-100 text-accent-600 rounded-lg flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                  <p className="text-gray-600">
                    Track your fitness journey with detailed statistics and visual progress charts
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to transform your fitness journey?</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Join thousands of users who are already experiencing the benefits of AI-powered workout tracking
                </p>
                <Link href="/auth" className="btn-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 px-8 py-3 rounded-lg font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started for Free
                </Link>
              </div>
            </div>
          </section>
        </main>
        
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="text-2xl font-bold text-white mb-4">NeuralFit</div>
                <p className="text-gray-400 max-w-md">
                  Your AI-powered fitness companion for better workouts and real-time tracking
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link href="/auth" className="text-gray-400 hover:text-white">Sign Up</Link></li>
                  <li><Link href="/auth" className="text-gray-400 hover:text-white">Login</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} NeuralFit. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home; 