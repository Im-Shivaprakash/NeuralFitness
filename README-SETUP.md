# Fitness Tracker Web App - Setup Instructions

This application consists of two parts:
1. A React frontend web application
2. A Flask backend API server that uses MediaPipe for pose detection

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- npm or yarn

## Backend Setup (Python MediaPipe Server)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Start the Flask server:
   ```
   python app.py
   ```

   The backend server will run on http://localhost:5000

## Frontend Setup (React Web App)

1. Open a new terminal window (keep the backend running)

2. Navigate back to the project root directory

3. Install the required dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev
   ```

   The frontend app will be available at http://localhost:3000 or http://localhost:3001 if port 3000 is already in use.

## Using the Application

1. Visit the frontend URL in your web browser
2. Allow camera access when prompted
3. Use the "Start Workout" page to configure your workout
4. The application will track your exercises and count reps in real-time

## Troubleshooting

- If you see "Error processing frame" in the camera view, make sure the backend server is running
- If the backend fails to start with import errors, ensure the Python modules directory is properly set up
- For better performance, make sure you have good lighting and sufficient space for the camera to see your full body

## Technical Details

- The frontend sends video frames to the backend as JPEG base64 images
- The backend processes the frames with MediaPipe and returns pose landmarks
- The frontend draws these landmarks on a canvas overlay
- Rep counting is performed on the backend using the existing Python code

## Performance Notes

- Frame rate is intentionally reduced to improve performance (every 3rd frame is processed)
- For better results, ensure you have a clear background and good lighting 