import { curatedCrimeDataset } from '@kestrel/shared';

export async function runSeed() {
  console.log('[Seed Runner] Loading curated reference dataset...');
  console.log(`Found ${curatedCrimeDataset.cases.length} cases and ${curatedCrimeDataset.suspects.length} suspects.`);
  console.log('[Seed Runner] Ready to populate PostGIS & pgvector once PostgreSQL is connected.');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  runSeed()
    .then(() => console.log('[Seed Runner] Completed successfully.'))
    .catch((err) => console.error('[Seed Runner] Failed:', err));
}
