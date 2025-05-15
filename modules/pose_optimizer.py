import numpy as np
import mediapipe as mp

class PoseOptimizer:
    def __init__(self):
        self.prev_landmarks = None
        self.frame_skip_counter = 0
        self.movement_threshold_high = 0.05  # Threshold for high movement
        self.movement_threshold_low = 0.02   # Threshold for low movement
        self.mp_pose = mp.solutions.pose

    def calculate_movement_score(self, current_landmarks):
        """Calculate the movement score between current and previous landmarks"""
        if self.prev_landmarks is None:
            self.prev_landmarks = current_landmarks
            return float('inf')  # Process first frame

        movement_score = 0
        for i in range(33):  # MediaPipe has 33 landmarks
            curr_lm = current_landmarks[i]
            prev_lm = self.prev_landmarks[i]
            
            # Calculate Euclidean distance for each landmark
            movement_score += np.sqrt(
                (curr_lm.x - prev_lm.x) ** 2 + 
                (curr_lm.y - prev_lm.y) ** 2
            )

        self.prev_landmarks = current_landmarks
        return movement_score / 33  # Normalize by number of landmarks

    def should_process_frame(self, landmarks):
        """Determine if the current frame should be processed based on movement intensity"""
        if landmarks is None:
            return True  # Always process if no landmarks detected

        movement_score = self.calculate_movement_score(landmarks)

        # High movement (e.g., jumping jacks, burpees) - process every frame
        if movement_score > self.movement_threshold_high:
            self.frame_skip_counter = 0
            return True

        # Moderate movement - process every 2nd frame
        elif movement_score > self.movement_threshold_low:
            self.frame_skip_counter = (self.frame_skip_counter + 1) % 2
            return self.frame_skip_counter == 0

        # Low movement (e.g., planks, holds) - process every 4th frame
        else:
            self.frame_skip_counter = (self.frame_skip_counter + 1) % 4
            return self.frame_skip_counter == 0

    def get_exercise_type(self, workout_name):
        """Categorize exercises by their typical movement intensity"""
        high_intensity = {'burpees', 'jumping_jacks', 'high_knees'}
        moderate_intensity = {'mountain_climbers', 'squats'}
        
        if workout_name.lower() in high_intensity:
            return 'high'
        elif workout_name.lower() in moderate_intensity:
            return 'moderate'
        else:
            return 'low'

    def adjust_thresholds(self, workout_name):
        """Adjust movement thresholds based on exercise type"""
        exercise_type = self.get_exercise_type(workout_name)
        
        if exercise_type == 'high':
            self.movement_threshold_high = 0.05
            self.movement_threshold_low = 0.03
        elif exercise_type == 'moderate':
            self.movement_threshold_high = 0.04
            self.movement_threshold_low = 0.02
        else:
            self.movement_threshold_high = 0.03
            self.movement_threshold_low = 0.01 