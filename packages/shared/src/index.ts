export * from './types/index.js';

// Static ESM import — works in Vite (browser) and tsx (Node ESM backend)
import curatedData from './fixtures/bengaluru_crime_curated.json';
import largeData from './fixtures/bengaluru_crime_dataset_large.json';

export const curatedCrimeDataset = curatedData;
export const largeCrimeDataset = largeData;
