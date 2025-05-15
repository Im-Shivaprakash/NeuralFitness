import React, { useState } from 'react';
import { WorkoutData, WorkoutSet, EXERCISE_TYPES } from '@/lib/types';

interface WorkoutFormProps {
  onSubmit: (workoutData: WorkoutData) => void;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ onSubmit }) => {
  const [preparationTime, setPreparationTime] = useState<number>(10);
  const [workoutTime, setWorkoutTime] = useState<number>(30);
  const [restTime, setRestTime] = useState<number>(15);
  const [numSets, setNumSets] = useState<number>(1);
  const [sets, setSets] = useState<WorkoutSet[]>([{ setNum: 1, cycles: ['squats'] }]);

  const handleAddSet = () => {
    if (sets.length >= 10) return; // Limit to 10 sets
    
    const newSet: WorkoutSet = {
      setNum: sets.length + 1,
      cycles: ['squats'] // Default exercise
    };
    
    setSets([...sets, newSet]);
    setNumSets(numSets + 1);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length <= 1) return;
    
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets.map((set, i) => ({ ...set, setNum: i + 1 })));
    setNumSets(numSets - 1);
  };

  const handleAddCycle = (setIndex: number) => {
    if (sets[setIndex].cycles.length >= 5) return; // Limit to 5 cycles per set
    
    const newSets = [...sets];
    newSets[setIndex].cycles.push('squats');
    setSets(newSets);
  };

  const handleRemoveCycle = (setIndex: number, cycleIndex: number) => {
    if (sets[setIndex].cycles.length <= 1) return;
    
    const newSets = [...sets];
    newSets[setIndex].cycles.splice(cycleIndex, 1);
    setSets(newSets);
  };

  const handleCycleChange = (setIndex: number, cycleIndex: number, value: string) => {
    const newSets = [...sets];
    newSets[setIndex].cycles[cycleIndex] = value;
    setSets(newSets);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we don't have workout_end in the middle of the workout
    // Only allow it as the last exercise in the last set
    const sanitizedSets = [...sets];
    
    // Remove any workout_end markers first
    sanitizedSets.forEach((set, setIndex) => {
      set.cycles = set.cycles.filter(cycle => {
        // Keep workout_end only if it's the last exercise in the last set
        if (cycle === 'workout_end') {
          return setIndex === sanitizedSets.length - 1 && 
                 set.cycles.indexOf(cycle) === set.cycles.length - 1;
        }
        return true;
      });
    });
    
    // If the last set's last cycle is not workout_end, add it
    const lastSet = sanitizedSets[sanitizedSets.length - 1];
    if (lastSet.cycles[lastSet.cycles.length - 1] !== 'workout_end') {
      lastSet.cycles.push('workout_end');
    }
    
    const workoutData: WorkoutData = {
      preparationTime,
      workoutTime,
      restTime,
      sets: sanitizedSets
    };
    
    onSubmit(workoutData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="preparationTime" className="block text-sm font-medium text-gray-700 mb-1">
            Preparation Time (seconds)
          </label>
          <input
            type="number"
            id="preparationTime"
            className="input-field"
            min="0"
            value={preparationTime}
            onChange={(e) => setPreparationTime(Number(e.target.value))}
            required
          />
        </div>
        
        <div>
          <label htmlFor="workoutTime" className="block text-sm font-medium text-gray-700 mb-1">
            Workout Time (seconds)
          </label>
          <input
            type="number"
            id="workoutTime"
            className="input-field"
            min="1"
            value={workoutTime}
            onChange={(e) => setWorkoutTime(Number(e.target.value))}
            required
          />
        </div>
        
        <div>
          <label htmlFor="restTime" className="block text-sm font-medium text-gray-700 mb-1">
            Rest Time (seconds)
          </label>
          <input
            type="number"
            id="restTime"
            className="input-field"
            min="0"
            value={restTime}
            onChange={(e) => setRestTime(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Workout Sets</h3>
        
        {sets.map((set, setIndex) => (
          <div key={set.setNum} className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold">Set {set.setNum}</h4>
              <button
                type="button"
                onClick={() => handleRemoveSet(setIndex)}
                className="text-red-500 hover:text-red-700"
                disabled={sets.length <= 1}
              >
                Remove Set
              </button>
            </div>
            
            <div className="space-y-4">
              {set.cycles.map((cycle, cycleIndex) => (
                <div key={cycleIndex} className="flex items-center space-x-4">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cycle {cycleIndex + 1} Exercise
                    </label>
                    <select
                      className="input-field"
                      value={cycle}
                      onChange={(e) => handleCycleChange(setIndex, cycleIndex, e.target.value)}
                      required
                    >
                      {EXERCISE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type === 'workout_end' 
                            ? 'End Workout (stops workout here)' 
                            : type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCycle(setIndex, cycleIndex)}
                    className="text-red-500 hover:text-red-700 mt-6"
                    disabled={set.cycles.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => handleAddCycle(setIndex)}
                className="btn bg-green-600 hover:bg-green-700 text-sm py-1 px-3 mt-2"
                disabled={set.cycles.length >= 5}
              >
                Add Exercise
              </button>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={handleAddSet}
          className="btn bg-blue-600 hover:bg-blue-700 mt-4"
          disabled={sets.length >= 10}
        >
          Add Set
        </button>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <button type="submit" className="btn bg-blue-600 hover:bg-blue-700">
          Start Workout
        </button>
      </div>
    </form>
  );
};

export default WorkoutForm; 