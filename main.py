import cv2
import mediapipe as mp
import time
import pandas as pd 
from modules.burpees import count_burpee_reps as burpees
from modules.squats import count_squats as squats
from modules.high_knees import count_high_knees as highknees
from modules.mountain_climbers import count_mountain_climber_reps as mountainclimbers
from modules.jumping_jacks import count_jumping_jack_reps as jumpingjacks
from modules.pose_optimizer import PoseOptimizer
import subprocess

# Exercise function mapping for efficient dispatch
EXERCISE_FUNCTIONS = {
    'burpees': burpees,
    'squats': squats,
    'high_knees': highknees,
    'mountain_climbers': mountainclimbers,
    'jumping_jacks': jumpingjacks
}

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils

def get_valid_input(prompt, input_type=int, min_value=0):
    while True:
        try:
            value = input_type(input(prompt))
            if value < min_value:
                print(f"Please enter a value greater than or equal to {min_value}")
                continue
            return value
        except ValueError:
            print(f"Invalid input. Please enter a valid {input_type.__name__}")

def get_valid_exercise_name(prompt):
    while True:
        exercise_name = input(prompt).lower()
        if exercise_name in EXERCISE_FUNCTIONS:
            return exercise_name
        print(f"Invalid exercise. Please choose from: {', '.join(EXERCISE_FUNCTIONS.keys())}")

def cleanup_resources(cap):
    if cap is not None:
        cap.release()
    cv2.destroyAllWindows()

def check_timeout(start_time, max_duration):
    """Check if operation has exceeded maximum duration"""
    return time.time() - start_time > max_duration

def main():
    cap = None
    try:
        # Initialize pose optimizer
        pose_optimizer = PoseOptimizer()
        
        # Placeholder for workout data
        workout_data = {}
        # Dictionary to track the reps count for each exercise type
        reps_dict = {}
        # List to collect workout rows for batch DataFrame creation
        workout_rows = []

        # Get workout parameters with validation
        workout_data['preparation_time'] = get_valid_input("Enter preparation time in seconds: ")
        workout_data['workout_time'] = get_valid_input("Enter workout time in seconds: ", min_value=1)
        workout_data['rest_time'] = get_valid_input("Enter rest time in seconds: ")
        num_sets = get_valid_input("Enter the number of sets: ", min_value=1)
        workout_data['sets'] = []

        # Step 3: Loop through each set to get workout details
        for set_num in range(1, num_sets + 1):
            set_data = {'set_num': set_num, 'cycles': []}

            if set_num == 1:
                num_cycles = get_valid_input(f"Enter the number of cycles for set {set_num}: ", min_value=1)
            else:
                repeat_cycles = input("Do you want to repeat the cycle data from the previous set? (yes/no): ").lower()
                if repeat_cycles == 'yes':
                    set_data['cycles'] = workout_data['sets'][0]['cycles']
                    workout_data['sets'].append(set_data)
                    continue
                else:
                    num_cycles = get_valid_input(f"Enter the number of cycles for set {set_num}: ", min_value=1)

            for cycle_num in range(1, num_cycles + 1):
                exercise_name = get_valid_exercise_name(
                    f"Enter workout name for cycle {cycle_num} of set {set_num} ({', '.join(EXERCISE_FUNCTIONS.keys())}): "
                )
                set_data['cycles'].append(exercise_name)
                if exercise_name not in reps_dict:
                    reps_dict[exercise_name] = 0

            workout_data['sets'].append(set_data)
        
        # Initialize video capture
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise RuntimeError("Cannot detect camera feed")

        flip_horizontal = True

        # Preparation time countdown
        if workout_data['preparation_time'] > 0:
            print(f'Starting preparation time: {workout_data["preparation_time"]} seconds')
            start_prep_time = time.time()
            while not check_timeout(start_prep_time, workout_data['preparation_time'] + 1):  # +1 for safety margin
                ret, frame = cap.read()
                if not ret:
                    raise RuntimeError("Failed to read from camera during preparation")
                
                elapsed_prep = time.time() - start_prep_time
                time_left = int(workout_data['preparation_time'] - elapsed_prep)
                if time_left < 0:
                    break
                
                if flip_horizontal:
                    frame = cv2.flip(frame, 1)
                
                cv2.putText(frame, 'Get Ready!', (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 0), 3, cv2.LINE_AA)
                cv2.putText(frame, f'Time Left: {time_left}s', (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 0), 2, cv2.LINE_AA)
                cv2.imshow('Workout Tracker', frame)
                
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    return
            print('Preparation time complete')

        for set_num in range(1, num_sets + 1):
            workout_cycles = workout_data['sets'][set_num - 1]['cycles']

            for cycle_num, workout_name in enumerate(workout_cycles, start=1):
                print(f'Starting {workout_name} for set {set_num}, cycle {cycle_num}')
                
                pose_optimizer.adjust_thresholds(workout_name)
                start_time = time.time()
                end_time = start_time + workout_data['workout_time']
                rep_counter = 0

                while not check_timeout(start_time, workout_data['workout_time'] + 1):
                    ret, frame = cap.read()
                    if not ret:
                        raise RuntimeError("Failed to read from camera during workout")

                    if flip_horizontal:
                        frame = cv2.flip(frame, 1)

                    try:
                        # Process pose landmarks
                        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        results = pose.process(image_rgb)

                        if results.pose_landmarks:
                            landmarks = results.pose_landmarks.landmark
                            
                            if pose_optimizer.should_process_frame(landmarks):
                                if workout_name in EXERCISE_FUNCTIONS:
                                    rep_counter += EXERCISE_FUNCTIONS[workout_name](landmarks)

                        # Update display
                        remaining_time = max(0, end_time - time.time())
                        minutes, seconds = divmod(int(remaining_time), 60)
                        timer_display = f"{minutes:02}:{seconds:02}"

                        # Drawing pose landmarks
                        if results.pose_landmarks:
                            mp_drawing.draw_landmarks(
                                frame,
                                results.pose_landmarks,
                                mp_pose.POSE_CONNECTIONS,
                                mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2),
                                mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2)
                            )

                        # Overlay text
                        cv2.putText(frame, f'Workout: {workout_name.title()}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                        cv2.putText(frame, f'Reps: {rep_counter}', (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                        cv2.putText(frame, f'Time Left: {timer_display}', (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

                        cv2.imshow('Workout Tracker', frame)

                    except Exception as e:
                        print(f"Error processing frame: {e}")
                        continue

                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        return

                # Update workout data
                reps_dict[workout_name] += rep_counter
                workout_rows.append({'Set Number': set_num, 'Exercise': workout_name, 'Reps': rep_counter})
                print(f'Completed {workout_name} for set {set_num}, cycle {cycle_num}, reps: {rep_counter}')

                # Rest period
                if workout_data['rest_time'] > 0:
                    rest_start = time.time()
                    while not check_timeout(rest_start, workout_data['rest_time'] + 1):
                        ret, frame = cap.read()
                        if not ret:
                            raise RuntimeError("Failed to read from camera during rest")

                        if flip_horizontal:
                            frame = cv2.flip(frame, 1)

                        time_left = max(0, int(workout_data['rest_time'] - (time.time() - rest_start)))
                        if time_left <= 0:
                            break

                        cv2.putText(frame, 'Resting...', (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 0), 3, cv2.LINE_AA)
                        cv2.putText(frame, f'Time Left: {time_left}s', (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 0), 2, cv2.LINE_AA)
                        cv2.imshow('Workout Tracker', frame)

                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            return

        # Create final DataFrame and save
        workout_df = pd.DataFrame(workout_rows)
        workout_df.to_csv('workout_data.csv', index=False)
        print('Workout complete. Data saved to workout_data.csv')

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        cleanup_resources(cap)

if __name__ == '__main__':
    main()

