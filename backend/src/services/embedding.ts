/**
 * Semantic Crime Vectorizer (pgvector 1536-Dimensional Compatibility)
 * 
 * Maps tactical modus operandi narratives, witness descriptions, entry methods,
 * and statutory categories into normalized 1536-dimensional embedding vectors.
 * 
 * Mathematical Properties:
 * - Unit Euclidean length (L2 norm = 1.0)
 * - Cosine distance: dist(u, v) = 1.0 - dot(u, v)
 * - High inter-cluster orthogonality between disparate crime domains (e.g. cyber fraud vs violent heist)
 * - Sub-millisecond execution with zero external network dependency (100% offline pitch resilience)
 */

export const EMBEDDING_DIMENSION = 1536;

// Tactical Crime Ontology Dimension Anchors (Semantic Projection Bands)
const THEMATIC_CLUSTERS: Record<string, { baseIdx: number; spread: number; terms: string[] }> = {
  // 1. Burglary & Physical Intrusion Tactics (Band: 0 - 200)
  burglary_entry: {
    baseIdx: 0,
    spread: 200,
    terms: [
      'crowbar', 'shutter', 'shutter break', 'rooftop', 'ventilation', 'lockpick',
      'duplicate key', 'glass cutter', 'forced entry', 'burglary', 'break in',
      'trespass', 'bolt cutter', 'angle grinder', 'lathe', 'padlock', 'severed wires',
      'cctv blinded', 'spray painted lens', 'safe drilled', 'iron rod', 'midnight'
    ]
  },
  // 2. Street Crime, Snatching & Mobile Transit (Band: 201 - 450)
  street_snatching: {
    baseIdx: 201,
    spread: 250,
    terms: [
      'snatching', 'chain snatching', 'pillion', 'pillion rider', 'pulsar', 'ktm',
      'duke', 'scooter', 'activa', 'bike', 'motorcycle', 'two wheeler', 'helmet',
      'full face helmet', 'face mask', 'bandana', 'alley', 'morning walk', 'jogger',
      'bus stop', 'metro station', 'gold chain', 'mangalsutra', 'handbag', 'phone snatching'
    ]
  },
  // 3. Violent Heist, Ballistics & Weapons (Band: 451 - 700)
  violent_heist: {
    baseIdx: 451,
    spread: 250,
    terms: [
      'armed robbery', 'robbery', 'machete', 'talwar', 'knife', 'dagger', 'country pistol',
      'firearm', 'desi katta', 'revolver', 'gunpoint', 'hostage', 'tied up', 'gagged',
      'extortion', 'ransom', 'assault', 'grievous hurt', 'dacoity', 'lethal weapon',
      'pepper spray', 'threat to kill', 'syndicate enforcer'
    ]
  },
  // 4. Cyber Crime, Financial Fraud & Impersonation (Band: 701 - 950)
  cyber_financial: {
    baseIdx: 701,
    spread: 250,
    terms: [
      'cyber crime', 'phishing', 'sim swap', 'otp', 'fake kyc', 'job offer scam',
      'crypto scam', 'telegram task', 'mule account', 'upi fraud', 'call center',
      'credit card skimming', 'impersonation', 'meter reader', 'bescom imposter',
      'courier delivery imposter', 'police imposter', 'identity theft', 'hawala', 'unauthorized transfer'
    ]
  },
  // 5. Narcotics & Contraband Networks (Band: 951 - 1150)
  narcotics_contraband: {
    baseIdx: 951,
    spread: 200,
    terms: [
      'narcotics', 'ganja', 'weed', 'cannabis', 'mdma', 'cocaine', 'meth', 'synthetic drugs',
      'peddler', 'consignment', 'courier parcel', 'dark web', 'stash house', 'commercial quantity',
      'ndps act', 'substance trafficking'
    ]
  },
  // 6. Regional Bilingual Terminology (Kannada & Karnataka Police Lexicon) (Band: 1151 - 1350)
  kannada_lexicon: {
    baseIdx: 1151,
    spread: 200,
    terms: [
      'ದರೋಡೆ', 'ಕಳ್ಳತನ', 'ಚೈನ್ ಸ್ನ್ಯಾಚಿಂಗ್', 'ಗಾಂಜಾ', 'ಆಯುಧ', 'ಚಾಕು', 'ಕತ್ತಿ', 'ನಕಲಿ',
      'ಕೊಲೆ', 'ಅಪಹರಣ', 'ವಂಚನೆ', 'ಆರೋಪಿ', 'ಸಾಕ್ಷ್ಯ', 'ಎಫ್ಐಆರ್', 'ಬೆಂಗಳೂರು', 'ಇಂದಿರಾನಗರ',
      'ಕೋರಮಂಗಲ', 'ವೈಟ್‌ಫೀಲ್ಡ್', 'ಪೀಣ್ಯ', 'ಜಯನಗರ', 'ಶಿವಾಜಿನಗರ'
    ]
  }
};

/**
 * Hash function mapping a string to an unsigned 32-bit integer
 */
function hashString(str: string, seed: number = 5381): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return hash;
}

/**
 * Generates an L2-normalized 1536-dimensional embedding vector for arbitrary text.
 */
export function generateEmbedding(text: string): number[] {
  const vec = new Float64Array(EMBEDDING_DIMENSION);
  if (!text || text.trim().length === 0) {
    // Return unit vector along dimension 0 for empty strings
    vec[0] = 1.0;
    return Array.from(vec);
  }

  const normalized = text.toLowerCase();
  const words = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  // 1. Project through curated thematic clusters
  for (const [, cluster] of Object.entries(THEMATIC_CLUSTERS)) {
    for (const term of cluster.terms) {
      if (normalized.includes(term.toLowerCase())) {
        const termHash = hashString(term);
        const targetDim = cluster.baseIdx + (termHash % cluster.spread);
        vec[targetDim] += 3.5;

        // Spread semantic weight to adjacent dimensions in the cluster band
        const neighbor1 = cluster.baseIdx + ((termHash + 1) % cluster.spread);
        const neighbor2 = cluster.baseIdx + ((termHash + 2) % cluster.spread);
        vec[neighbor1] += 1.8;
        vec[neighbor2] += 1.8;
      }
    }
  }

  // 2. Project unigrams and bigrams using open-vocabulary feature hashing
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const h1 = hashString(word, 5381);
    const dim1 = h1 % EMBEDDING_DIMENSION;
    vec[dim1] += 1.0;

    // Bigram context
    if (i < words.length - 1) {
      const bigram = `${word}_${words[i + 1]}`;
      const h2 = hashString(bigram, 7919);
      const dim2 = h2 % EMBEDDING_DIMENSION;
      vec[dim2] += 1.5;
    }

    // Trigram context for fine-grained phrase matching
    if (i < words.length - 2) {
      const trigram = `${word}_${words[i + 1]}_${words[i + 2]}`;
      const h3 = hashString(trigram, 1987);
      const dim3 = h3 % EMBEDDING_DIMENSION;
      vec[dim3] += 1.2;
    }
  }

  // 3. Compute Euclidean L2 norm and normalize vector to unit sphere
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1.0;

  const result: number[] = new Array(EMBEDDING_DIMENSION);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    // 6 decimal places is optimal for pgvector storage and transport
    result[i] = Math.round((vec[i] / norm) * 1000000) / 1000000;
  }

  return result;
}

/**
 * Calculates cosine similarity between two 1536-dimensional vectors: (u • v) / (||u|| * ||v||)
 * Since our vectors are L2-normalized, cosine similarity equals the dot product.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dot));
}

/**
 * Formats a case record into a high-density textual document for vector indexing
 */
export function formatCaseForEmbedding(caseItem: {
  crimeCategory: string;
  policeStation: string;
  district?: string;
  priority?: string | null;
  description: string;
  descriptionKannada?: string | null;
  applicableActs?: string[] | unknown;
}): string {
  const acts = Array.isArray(caseItem.applicableActs)
    ? caseItem.applicableActs.join(' ')
    : '';

  return [
    `Crime Category: ${caseItem.crimeCategory}`,
    `Police Station: ${caseItem.policeStation}`,
    caseItem.district ? `District: ${caseItem.district}` : '',
    caseItem.priority ? `Severity: ${caseItem.priority}` : '',
    `Statutory Sections: ${acts}`,
    `Narrative Description: ${caseItem.description}`,
    caseItem.descriptionKannada ? `ವಿವರಣೆ: ${caseItem.descriptionKannada}` : ''
  ].filter(Boolean).join('. ');
}
