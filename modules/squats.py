import mediapipe as mp
import numpy as np
import logging

# Set up logging
logger = logging.getLogger(__name__)

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

alignment_tolerance = 0.1  # Adjust as necessary
squat_depth_threshold = 0.15  # Threshold for squat depth (adjust as needed)
squat_in_progress = False  # Global variable for squat state
debug_counter = 0  # Counter for periodic logging

def check_squat_conditions(landmarks):
    hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
    ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    foot_index = landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value]

    # Calculate hip to knee height ratio for squat depth
    standing_height = hip.y
    current_height = knee.y
    hip_knee_ratio = abs(standing_height - current_height)
    
    # Check if the knees are behind the toes (good form)
    knee_not_over_foot = knee.x < foot_index.x
    
    # Check if the person is in a squatting position based on knee bend
    is_squatting = hip.y > (knee.y - squat_depth_threshold)
    
    # Log the values periodically
    global debug_counter
    debug_counter += 1
    if debug_counter % 10 == 0:
        logger.debug(f"Hip Y: {hip.y:.4f}, Knee Y: {knee.y:.4f}, Ratio: {hip_knee_ratio:.4f}")
        logger.debug(f"Is squatting: {is_squatting}, Knees behind toes: {knee_not_over_foot}")
    
    return is_squatting, knee_not_over_foot

def is_initial_standing(landmarks):
    """Check if the person is in a standing position"""
    shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
    ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]

    # Check vertical alignment of body
    vertical_alignment = (abs(shoulder.x - hip.x) < alignment_tolerance and
                         abs(hip.x - knee.x) < alignment_tolerance and
                         abs(knee.x - ankle.x) < alignment_tolerance)
    
    # Check if knees are straight (not bent)
    knees_straight = hip.y < knee.y
    
    # Log the values periodically
    global debug_counter
    if debug_counter % 10 == 0:
        logger.debug(f"Standing check - Alignment: {vertical_alignment}, Knees straight: {knees_straight}")
    
    return vertical_alignment and knees_straight

def count_squats(landmarks):
    """
    Count squats based on pose landmarks.
    Returns 1 when a squat is completed, 0 otherwise.
    """
    global squat_in_progress  # Keep track of squat state globally

    # Check the positions
    standing_pose = is_initial_standing(landmarks)
    is_squatting, good_form = check_squat_conditions(landmarks)

    # Get key positions for debugging
    hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value] 
    ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    
    # Log the current state periodically
    global debug_counter
    if debug_counter % 10 == 0:
        logger.debug(f"Squat state - In progress: {squat_in_progress}, Standing: {standing_pose}, Squatting: {is_squatting}")
        logger.debug(f"Positions - Hip Y: {hip.y:.4f}, Knee Y: {knee.y:.4f}, Ankle Y: {ankle.y:.4f}")

    # Detect when a squat is starting
    if not squat_in_progress and is_squatting:
        logger.info("Squat started")
        squat_in_progress = True  # Squat has started
        return 0  # No rep yet, just started the squat
    
    # Detect when squat is completed (returning to standing position)
    elif squat_in_progress and standing_pose:
        logger.info("Squat completed - counting 1 rep")
        squat_in_progress = False  # Squat completed, reset state
        return 1  # Count 1 rep

    # No state change
    return 0