// A simple logger utility for debugging Firebase operations
const isDebug = process.env.NODE_ENV !== 'production';

export const logger = {
  log: (message: string, data?: any) => {
    if (isDebug) {
      if (data) {
        console.log(`[NeuralFit] ${message}`, data);
      } else {
        console.log(`[NeuralFit] ${message}`);
      }
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`[NeuralFit ERROR] ${message}`, error || '');
  }
}; 