import os
import sys
import base64
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp
import time

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to the path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your existing code
from modules.burpees import count_burpee_reps
from modules.squats import count_squats
from modules.high_knees import count_high_knees
from modules.mountain_climbers import count_mountain_climber_reps
from modules.jumping_jacks import count_jumping_jack_reps
from modules.pose_optimizer import PoseOptimizer

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize MediaPipe pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Exercise function mapping for efficient dispatch
EXERCISE_FUNCTIONS = {
    'burpees': count_burpee_reps,
    'squats': count_squats,
    'high_knees': count_high_knees,
    'mountain_climbers': count_mountain_climber_reps,
    'jumping_jacks': count_jumping_jack_reps
}

# Initialize pose optimizer
pose_optimizer = PoseOptimizer()

# Global variables to track rep state
last_exercise = None
exercise_state = {}

@app.route('/api/process_frame', methods=['POST'])
def process_frame():
    global last_exercise, exercise_state
    
    data = request.json
    if not data or 'image' not in data or 'exercise' not in data:
        return jsonify({'error': 'Missing required data'}), 400
    
    # Get the exercise type
    exercise = data['exercise']
    
    # Reset state if exercise changed
    if exercise != last_exercise:
        logger.info(f"Exercise changed from {last_exercise} to {exercise}. Resetting state.")
        last_exercise = exercise
        exercise_state = {}
    
    if exercise not in EXERCISE_FUNCTIONS:
        return jsonify({'error': f'Unsupported exercise: {exercise}'}), 400
    
    # Decode the base64 image
    try:
        img_data = base64.b64decode(data['image'].split(',')[1])
        np_arr = np.frombuffer(img_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({'error': f'Error decoding image: {str(e)}'}), 400
    
    # Process image with MediaPipe
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)
    
    # Check if pose was detected
    if not results.pose_landmarks:
        logger.warning("No pose landmarks detected in frame")
        return jsonify({
            'repCount': 0,
            'landmarks': None,
            'feedback': 'No pose detected',
            'confidence': 0
        })
    
    # Extract landmarks
    landmarks = results.pose_landmarks.landmark
    
    # Check if we should process the frame (optimization)
    should_process = pose_optimizer.should_process_frame(landmarks)
    
    rep_count = 0
    feedback = "Analyzing pose..."
    
    if should_process:
        # Log key joint positions for debugging
        hip_y = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y
        knee_y = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y
        ankle_y = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y
        logger.debug(f"Key positions - Hip Y: {hip_y:.4f}, Knee Y: {knee_y:.4f}, Ankle Y: {ankle_y:.4f}")
        
        # Count reps based on exercise type
        logger.info(f"Calling {exercise} rep counter")
        
        # Initialize exercise state if needed
        if exercise == 'squats' and 'squat_in_progress' not in exercise_state:
            from modules.squats import squat_in_progress
            exercise_state['squat_in_progress'] = squat_in_progress
        
        # Call the rep counting function and log the result
        rep_count = EXERCISE_FUNCTIONS[exercise](landmarks)
        logger.info(f"Rep counter returned: {rep_count}")
        
        # For squats, log the squat state
        if exercise == 'squats':
            from modules.squats import squat_in_progress
            logger.info(f"Squat in progress: {squat_in_progress}")
            exercise_state['squat_in_progress'] = squat_in_progress
        
        # Generate feedback based on exercise
        if exercise == 'squats':
            hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
            knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
            ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
            
            # Check if knees are over toes (common mistake)
            if knee.x > ankle.x:
                feedback = "Keep knees behind toes"
            else:
                feedback = "Good form"
        elif exercise == 'burpees':
            feedback = "Keep your core tight"
        elif exercise == 'jumping_jacks':
            shoulder_l = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
            shoulder_r = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
            hand_l = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
            hand_r = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
            
            # Check if arms are fully extended
            if abs(hand_l.y - shoulder_l.y) < 0.15 or abs(hand_r.y - shoulder_r.y) < 0.15:
                feedback = "Extend arms fully"
            else:
                feedback = "Good tempo"
        else:
            feedback = "Keep going!"
    
    # Format the landmarks for sending to the frontend
    formatted_landmarks = []
    for idx, landmark in enumerate(landmarks):
        formatted_landmarks.append({
            'x': landmark.x,
            'y': landmark.y,
            'z': landmark.z,
            'visibility': landmark.visibility
        })
    
    # Estimate confidence based on visibility of key points
    key_points = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26]  # Important landmarks
    confidence = sum(landmarks[i].visibility for i in key_points) / len(key_points)
    
    response_data = {
        'repCount': rep_count,
        'landmarks': formatted_landmarks,
        'feedback': feedback,
        'confidence': float(confidence)
    }
    
    logger.info(f"Returning response with repCount: {rep_count}")
    return jsonify(response_data)

@app.route('/api/debug_state', methods=['GET'])
def debug_state():
    """Endpoint to check the internal state for debugging purposes"""
    return jsonify({
        'last_exercise': last_exercise,
        'exercise_state': exercise_state
    })

if __name__ == '__main__':
    logger.info("Starting Flask server for fitness tracking API")
    app.run(host='0.0.0.0', port=5000, debug=True) 