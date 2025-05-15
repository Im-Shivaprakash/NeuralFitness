import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthContext } from '@/lib/AuthContext';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'NeuralFit - AI Fitness Tracking' 
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuthContext();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI-powered fitness tracking application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    NeuralFit
                  </span>
                </Link>
                
                <nav className="hidden sm:ml-8 sm:flex sm:space-x-6">
                  {!loading && user ? (
                    <>
                      <Link href="/dashboard" 
                        className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                          router.pathname === '/dashboard' 
                            ? 'border-primary-500 text-primary-700' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } text-sm font-medium`}
                      >
                        Dashboard
                      </Link>
                      <Link href="/workout" 
                        className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                          router.pathname === '/workout' 
                            ? 'border-primary-500 text-primary-700' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } text-sm font-medium`}
                      >
                        Workout
                      </Link>
                      <Link href="/history" 
                        className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                          router.pathname === '/history' 
                            ? 'border-primary-500 text-primary-700' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } text-sm font-medium`}
                      >
                        History
                      </Link>
                      <Link href="/profile" 
                        className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                          router.pathname === '/profile' 
                            ? 'border-primary-500 text-primary-700' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } text-sm font-medium`}
                      >
                        Profile
                      </Link>
                    </>
                  ) : loading ? null : (
                    <>
                      <Link href="/auth" 
                        className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                          router.pathname === '/auth' 
                            ? 'border-primary-500 text-primary-700' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } text-sm font-medium`}
                      >
                        Login / Register
                      </Link>
                    </>
                  )}
                </nav>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {!loading && user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">{user.displayName || user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                ) : loading ? null : (
                  <Link href="/auth" className="btn-sm">
                    Get Started
                  </Link>
                )}
              </div>
              
              <div className="-mr-2 flex items-center sm:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg 
                    className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg 
                    className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className={`${menuOpen ? 'block' : 'hidden'} sm:hidden border-t border-gray-200`}>
            <div className="pt-2 pb-3 space-y-1">
              {!loading && user ? (
                <>
                  <Link href="/dashboard" 
                    className={`block pl-3 pr-4 py-2 border-l-4 ${
                      router.pathname === '/dashboard' 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } text-base font-medium`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link href="/workout" 
                    className={`block pl-3 pr-4 py-2 border-l-4 ${
                      router.pathname === '/workout' 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } text-base font-medium`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Workout
                  </Link>
                  <Link href="/history" 
                    className={`block pl-3 pr-4 py-2 border-l-4 ${
                      router.pathname === '/history' 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } text-base font-medium`}
                    onClick={() => setMenuOpen(false)}
                  >
                    History
                  </Link>
                  <Link href="/profile" 
                    className={`block pl-3 pr-4 py-2 border-l-4 ${
                      router.pathname === '/profile' 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } text-base font-medium`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    {user.displayName && (
                      <div className="block px-4 py-2 text-sm text-gray-500">
                        Signed in as <span className="font-medium">{user.displayName}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left pl-3 pr-4 py-2 text-primary-600 hover:bg-gray-50 text-base font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : loading ? null : (
                <>
                  <Link href="/auth" 
                    className={`block pl-3 pr-4 py-2 border-l-4 ${
                      router.pathname === '/auth' 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } text-base font-medium`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Login / Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
        
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">NeuralFit</span>
                <p className="mt-2 text-sm text-gray-500">Your AI-powered fitness companion for better workouts and real-time tracking.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Quick Links</h3>
                <ul className="mt-4 space-y-2">
                  <li><Link href="/dashboard" className="text-gray-500 hover:text-primary-600">Dashboard</Link></li>
                  <li><Link href="/workout" className="text-gray-500 hover:text-primary-600">Start Workout</Link></li>
                  <li><Link href="/history" className="text-gray-500 hover:text-primary-600">Workout History</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-2">
                  <li><Link href="#" className="text-gray-500 hover:text-primary-600">Privacy Policy</Link></li>
                  <li><Link href="#" className="text-gray-500 hover:text-primary-600">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-6 text-center">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} NeuralFit. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout; 