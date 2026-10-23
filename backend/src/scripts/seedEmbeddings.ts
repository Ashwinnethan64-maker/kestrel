import { db } from '../db';
import { casesFir } from '../db/schema';
import { sql, isNull } from 'drizzle-orm';
import { generateEmbedding, formatCaseForEmbedding } from '../services/embedding';

export async function seedEmbeddings() {
  console.log('[Seed Embeddings] Starting vector embedding backfill for cases_fir...');
  const startTime = Date.now();

  // 1. Ensure HNSW index exists for high-performance cosine similarity retrieval
  try {
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_cases_fir_embedding 
      ON cases_fir USING hnsw (embedding vector_cosine_ops);
    `);
    console.log('[Seed Embeddings] Verified HNSW vector index: idx_cases_fir_embedding');
  } catch (err: any) {
    console.warn('[Seed Embeddings] Notice creating HNSW index:', err.message);
  }

  // 2. Query cases needing vector embeddings
  const pendingCases = await db
    .select({
      id: casesFir.id,
      firNumber: casesFir.firNumber,
      crimeCategory: casesFir.crimeCategory,
      policeStation: casesFir.policeStation,
      district: casesFir.district,
      priority: casesFir.priority,
      description: casesFir.description,
      descriptionKannada: casesFir.descriptionKannada,
      applicableActs: casesFir.applicableActs
    })
    .from(casesFir)
    .where(isNull(casesFir.embedding));

  console.log(`[Seed Embeddings] Found ${pendingCases.length} cases requiring 1536-dim embeddings.`);

  if (pendingCases.length === 0) {
    console.log('[Seed Embeddings] All cases already indexed with vector embeddings.');
    return;
  }

  const BATCH_SIZE = 50;
  let processed = 0;

  for (let i = 0; i < pendingCases.length; i += BATCH_SIZE) {
    const chunk = pendingCases.slice(i, i + BATCH_SIZE);

    // Compute embeddings in parallel for the chunk
    const updatePromises = chunk.map((c) => {
      const textToEmbed = formatCaseForEmbedding(c);
      const vector = generateEmbedding(textToEmbed);
      const vectorString = '[' + vector.join(',') + ']';

      return db.execute(sql`
        UPDATE cases_fir 
        SET embedding = ${vectorString}::vector, updated_at = NOW()
        WHERE id = ${c.id}
      `);
    });

    await Promise.all(updatePromises);
    processed += chunk.length;

    if (processed % 250 === 0 || processed === pendingCases.length) {
      const progress = ((processed / pendingCases.length) * 100).toFixed(1);
      console.log(`[Seed Embeddings] Progress: ${processed}/${pendingCases.length} (${progress}%) indexed...`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Seed Embeddings] Successfully populated embeddings for ${processed} cases in ${durationSec}s!`);
}

// Allow direct CLI execution: npx tsx backend/src/scripts/seedEmbeddings.ts
if (require.main === module || process.argv[1]?.endsWith('seedEmbeddings.ts')) {
  seedEmbeddings()
    .then(() => {
      console.log('[Seed Embeddings] Complete. Exiting process.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Embeddings] Fatal error:', err);
      process.exit(1);
    });
}
