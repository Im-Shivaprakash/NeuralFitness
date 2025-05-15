import mediapipe as mp

# Initialize MediaPipe Pose model
mp_pose = mp.solutions.pose

# Define threshold for knee movement
knee_in_threshold = -0.05  # Knee should move towards negative x-axis (above hip)
right_knee_in = False
left_knee_in = False

def count_mountain_climber_reps(landmarks):
    global right_knee_in, left_knee_in
    reps_increment = 0

    # Get x-coordinates for knees and hips
    left_knee_x = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x
    right_knee_x = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x
    left_hip_x = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x
    right_hip_x = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x

    # Calculate relative position of knees to hips
    right_knee_relative_x = right_knee_x - right_hip_x
    left_knee_relative_x = left_knee_x - left_hip_x

    # Check right knee movement
    if right_knee_relative_x < knee_in_threshold:  # Right knee has moved inward
        right_knee_in = True  

    # Check left knee movement
    if left_knee_relative_x < knee_in_threshold and right_knee_in:  # Left knee moves inward after right knee
        left_knee_in = True

    # If both knees have moved in, count the rep and reset
    if right_knee_in and left_knee_in:
        reps_increment = 1  # Indicate a completed rep
        right_knee_in = False  # Reset movement state
        left_knee_in = False

    return reps_increment  # Return 1 if rep is completed, 0 otherwise
