import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root .env first, fallback to cwd .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  groqApiKey: process.env.GROQ_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development'
};
