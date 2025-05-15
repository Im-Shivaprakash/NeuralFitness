import mediapipe as mp
import numpy as np

# Initialize MediaPipe Pose model
mp_pose = mp.solutions.pose

# Jumping Jack state tracking
is_open = False

def calculate_distance(p1, p2):
    return np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

def count_jumping_jack_reps(landmarks):
    global is_open
    reps_increment = 0

    # Extract relevant landmarks
    shoulder_l = (landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y)
    shoulder_r = (landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y)
    wrist_l = (landmarks[mp_pose.PoseLandmark.LEFT_WRIST].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST].y)
    wrist_r = (landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y)
    hip_l = (landmarks[mp_pose.PoseLandmark.LEFT_HIP].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP].y)
    hip_r = (landmarks[mp_pose.PoseLandmark.RIGHT_HIP].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y)
    toe_l = (landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX].x, landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX].y)
    toe_r = (landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX].x, landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX].y)

    # **Arm and Foot Movement Detection Without Thresholds**
    arm_length = calculate_distance(shoulder_l, wrist_l)
    leg_length = calculate_distance(hip_l, toe_l)
    
    # Attention Pose Detection
    arms_down = wrist_l[1] > shoulder_l[1] and wrist_r[1] > shoulder_r[1]
    feet_together = abs(toe_l[0] - toe_r[0]) < 0.1  # Small distance threshold
    
    # Jump Pose Detection
    arms_up = wrist_l[1] < shoulder_l[1] - 0.5 * arm_length and wrist_r[1] < shoulder_r[1] - 0.5 * arm_length
    feet_apart = 0.4 * leg_length < abs(toe_l[0] - toe_r[0]) < 0.6 * leg_length

    # Detect Jumping Jack Reps Without Fixed Thresholds
    if arms_up and feet_apart and not is_open:
        is_open = True  # Arms up, feet apart → Open position
    elif arms_down and feet_together and is_open:
        reps_increment = 1  # Arms down, feet together → Rep counted
        is_open = False  # Reset state

    return reps_increment  # Returns 1 when a rep is completed
