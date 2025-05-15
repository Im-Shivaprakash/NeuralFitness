# Fitness Workout Tracker Web App

A React-based web application for tracking workouts with AI-powered form detection, based on a MediaPipe fitness tracking backend.

## Features

- Create custom workouts with multiple exercises and sets
- Real-time form detection and feedback using webcam
- Rep counting for various exercises (squats, jumping jacks, high knees, etc.)
- Workout timer with preparation and rest periods
- Workout history tracking

## Technology Stack

- React
- Next.js
- TypeScript
- TailwindCSS
- MediaPipe (backend)

## Project Structure

- `src/components`: UI components for the application
- `src/pages`: Next.js pages
- `src/lib`: Utility functions and types
- `src/styles`: Global CSS styles

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Integration with Python Backend

This React application is designed to work with a MediaPipe-based Python backend for exercise detection and rep counting. In a production environment, you would need to:

1. Set up a server running the Python backend
2. Configure API endpoints for processing video frames
3. Update the `src/lib/api.ts` file to make real API calls instead of using the mock implementations

## Available Exercises

- Squats
- Jumping Jacks
- High Knees
- Mountain Climbers
- Burpees

## Future Enhancements

- User authentication and profiles
- More detailed exercise statistics
- Custom workout plans
- Social sharing features
- Mobile app version 