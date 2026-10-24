export * from './types/index.js';

// Static ESM import — works in Vite (browser) and tsx (Node ESM backend)
import curatedData from './fixtures/bengaluru_crime_curated.json';

export const curatedCrimeDataset = curatedData;

