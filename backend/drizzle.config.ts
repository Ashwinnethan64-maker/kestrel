import { defineConfig } from 'drizzle-kit';
import { config } from './src/config';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  tablesFilter: [
    'officers',
    'cases_fir',
    'entities_accused',
    'case_accused_junction',
    'case_evidence',
    'ai_threads',
    'investigative_tasks'
  ],
  dbCredentials: {
    url: config.databaseUrl
  }
});
