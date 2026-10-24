export * from './types/index.js';

import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const curatedData = _require('./fixtures/bengaluru_crime_curated.json');

export const curatedCrimeDataset = curatedData;

