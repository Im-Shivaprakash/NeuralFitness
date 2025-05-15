import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Fitness Tracker
        </Link>
        <nav className="space-x-4">
          <Link href="/" className="hover:text-blue-200">
            Home
          </Link>
          <Link href="/workout" className="hover:text-blue-200">
            Start Workout
          </Link>
          <Link href="/history" className="hover:text-blue-200">
            History
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header; 