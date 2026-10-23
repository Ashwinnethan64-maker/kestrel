import { db } from './index';
import { officers, casesFir, entitiesAccused, caseAccusedJunction, caseEvidence } from './schema';
import { curatedCrimeDataset } from '@kestrel/shared';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

interface OfficerSeed {
  id: string;
  badgeNumber: string;
  name: string;
  email: string;
  role: string;
  station: string;
  district: string;
}

const DEFAULT_OFFICERS: OfficerSeed[] = [
  {
    id: 'OFF-01',
    badgeNumber: 'KA-BLR-0552',
    name: 'Inspector Patil',
    email: 'patil.blr@ksp.gov.in',
    role: 'Investigator',
    station: 'Indiranagar',
    district: 'Bengaluru East'
  },
  {
    id: 'OFF-02',
    badgeNumber: 'KA-BLR-0331',
    name: 'Sub-Inspector Ramesh',
    email: 'ramesh.krp@ksp.gov.in',
    role: 'Investigator',
    station: 'K.R. Puram',
    district: 'Bengaluru East'
  },
  {
    id: 'OFF-03',
    badgeNumber: 'KA-BLR-0219',
    name: 'Inspector Ananya Sharma',
    email: 'ananya.cyber@ksp.gov.in',
    role: 'Investigator',
    station: 'Whitefield',
    district: 'Bengaluru East'
  },
  {
    id: 'OFF-04',
    badgeNumber: 'KA-BLR-0891',
    name: 'Inspector Raghavendra',
    email: 'raghavendra.cub@ksp.gov.in',
    role: 'Investigator',
    station: 'Cubbon Park',
    district: 'Bengaluru Central'
  },
  {
    id: 'OFF-05',
    badgeNumber: 'KA-BLR-0100',
    name: 'ACP Vikramaditya',
    email: 'acp.blr@ksp.gov.in',
    role: 'Superintendent',
    station: 'HQ Command',
    district: 'Bengaluru'
  }
];

function getOfficerIdByName(name?: string): string {
  if (!name) return 'OFF-01';
  const found = DEFAULT_OFFICERS.find((o) => o.name.toLowerCase() === name.toLowerCase());
  return found ? found.id : 'OFF-01';
}

export async function runSeed() {
  const isLarge = process.argv.includes('--large');
  console.log(`\n======================================================`);
  console.log(`[Seed Runner] Kestrel Database Seeding Engine`);
  console.log(`[Seed Runner] Mode: ${isLarge ? 'Dual-Tier (Curated + Large Parametric)' : 'Tier 1 (Curated Golden Path)'}`);
  console.log(`======================================================\n`);

  // 1. Clear existing seed data safely
  console.log('[1/6] Purging existing operational data...');
  await db.execute(sql`TRUNCATE TABLE case_evidence, case_accused_junction, cases_fir, entities_accused, officers CASCADE;`);
  console.log('✓ Existing tables truncated successfully.');

  // 2. Insert Officers
  console.log('\n[2/6] Seeding tactical officers roster...');
  for (const officer of DEFAULT_OFFICERS) {
    await db.insert(officers).values(officer);
  }
  console.log(`✓ Inserted ${DEFAULT_OFFICERS.length} officer profiles.`);

  // 3. Suspects & Accused Entities (Always include curated, union with large if requested)
  console.log('\n[3/6] Seeding accused suspect dossiers...');
  const suspectMap = new Map<string, any>();
  for (const s of curatedCrimeDataset.suspects || []) {
    suspectMap.set(s.id, s);
  }

  if (isLarge) {
    const largeFixturePath = path.resolve(__dirname, '../../../packages/shared/src/fixtures/bengaluru_crime_dataset_large.json');
    if (fs.existsSync(largeFixturePath)) {
      const largeData = JSON.parse(fs.readFileSync(largeFixturePath, 'utf-8'));
      for (const s of largeData.suspects || []) {
        if (!suspectMap.has(s.id)) {
          suspectMap.set(s.id, s);
        }
      }
    }
  }

  for (const s of suspectMap.values()) {
    await db.insert(entitiesAccused).values({
      id: s.id,
      fullName: s.fullName,
      aliases: s.aliases || [],
      isRepeatOffender: Boolean(s.isRepeatOffender),
      riskLevel: s.riskLevel || 'Medium',
      gangAffiliation: s.gangAffiliation || null,
      phoneNumbers: s.phoneNumbers || [],
      knownAddresses: s.knownAddresses || [],
      vehiclePlates: s.vehiclePlates || [],
      totalPriorArrests: String(s.totalPriorArrests ?? '0'),
      bailStatus: s.bailStatus || 'None',
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date()
    });
  }
  console.log(`✓ Inserted ${suspectMap.size} suspect dossiers.`);

  // 4. Cases FIR Seeding (Always include curated, union with large if requested)
  console.log('\n[4/6] Seeding FIR cases with PostGIS spatial coordinates...');
  const casesMap = new Map<string, any>();
  for (const c of curatedCrimeDataset.cases || []) {
    casesMap.set(c.id, c);
  }

  if (isLarge) {
    const largeFixturePath = path.resolve(__dirname, '../../../packages/shared/src/fixtures/bengaluru_crime_dataset_large.json');
    if (fs.existsSync(largeFixturePath)) {
      const largeData = JSON.parse(fs.readFileSync(largeFixturePath, 'utf-8'));
      for (const c of largeData.cases || []) {
        if (!casesMap.has(c.id)) {
          casesMap.set(c.id, c);
        }
      }
    }
  }

  let casesCount = 0;
  for (const c of casesMap.values()) {
    const officerId = getOfficerIdByName(c.investigatingOfficerName);
    await db.insert(casesFir).values({
      id: c.id,
      firNumber: c.firNumber,
      crimeCategory: c.crimeCategory,
      priority: c.priority || 'Medium',
      status: c.status || 'Open',
      incidentDate: new Date(c.incidentDate),
      reportedDate: c.reportedDate ? new Date(c.reportedDate) : new Date(),
      district: c.district || 'Bengaluru East',
      policeStation: c.policeStation,
      investigatingOfficerId: officerId,
      description: c.description,
      descriptionKannada: c.descriptionKannada || null,
      applicableActs: c.applicableActs || [],
      latitude: c.latitude,
      longitude: c.longitude,
      locationGeom: sql`ST_SetSRID(ST_MakePoint(${c.longitude}, ${c.latitude}), 4326)`,
      createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
    });
    casesCount++;
  }
  console.log(`✓ Inserted ${casesCount} FIR cases with PostGIS Point geometries.`);

  // 5. Case-Accused Junction Seeding
  console.log('\n[5/6] Generating co-accused relational junction links...');
  let junctionCount = 0;
  for (const c of casesMap.values()) {
    const accusedList: string[] = c.accusedIds || [];
    for (let i = 0; i < accusedList.length; i++) {
      const accusedId = accusedList[i];
      if (!suspectMap.has(accusedId)) continue;
      const suspect = suspectMap.get(accusedId);
      const role = i === 0 ? 'Prime Suspect' : 'Accomplice';
      const status = suspect?.bailStatus === 'Bailed' ? 'Bailed' : 'Wanted';

      await db.insert(caseAccusedJunction).values({
        id: `JUNC-${c.id}-${accusedId}`,
        caseId: c.id,
        accusedId: accusedId,
        role: role,
        status: status
      });
      junctionCount++;
    }
  }
  console.log(`✓ Linked ${junctionCount} suspect-case junction records.`);

  // 6. Evidence Vault Seeding
  console.log('\n[6/6] Seeding forensic evidence items and chain of custody logs...');
  const evidenceList = (curatedCrimeDataset as any).evidence || [];
  let evidenceCount = 0;
  for (const ev of evidenceList) {
    if (!casesMap.has(ev.caseId)) continue;
    await db.insert(caseEvidence).values({
      id: ev.id,
      caseId: ev.caseId,
      evidenceType: ev.evidenceType,
      title: ev.title,
      description: ev.description,
      fileUrl: ev.fileUrl || null,
      collectedDate: ev.collectedDate ? new Date(ev.collectedDate) : new Date(),
      chainOfCustody: ev.chainOfCustody || []
    });
    evidenceCount++;
  }
  console.log(`✓ Inserted ${evidenceCount} evidence vault records.`);

  console.log(`\n======================================================`);
  console.log(`[Seed Runner] Verification Summary:`);
  console.log(`  - Officers:  ${DEFAULT_OFFICERS.length}`);
  console.log(`  - Suspects:  ${suspectMap.size}`);
  console.log(`  - FIR Cases: ${casesCount}`);
  console.log(`  - Junctions: ${junctionCount}`);
  console.log(`  - Evidence:  ${evidenceCount}`);
  console.log(`[Seed Runner] Complete! Database is populated and operational.`);
  console.log(`======================================================\n`);
}

if (process.argv[1]?.endsWith('seed.ts')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Runner] Error seeding database:', err);
      process.exit(1);
    });
}
