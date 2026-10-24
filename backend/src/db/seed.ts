import { db } from './index';
import { officers, casesFir, entitiesAccused, caseAccusedJunction, caseEvidence, investigativeTasks } from './schema';
import { curatedCrimeDataset } from '@kestrel/shared';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { seedEmbeddings } from '../scripts/seedEmbeddings';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

interface InvestigativeTaskSeed {
  id: string;
  caseId: string;
  assignedOfficerId: string;
  title: string;
  taskType: 'CCTV' | 'Forensic' | 'Interrogation' | 'Seizure' | 'Documentation';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
  completedAt?: string;
  notes?: string;
}

const SEED_TASKS: InvestigativeTaskSeed[] = [
  {
    id: 'TASK-001',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Obtain 12th Main Indiranagar CCTV footage from Axis Bank ATM',
    taskType: 'CCTV',
    priority: 'Critical',
    status: 'Completed',
    dueDate: '2024-03-16T12:00:00Z',
    completedAt: '2024-03-16T10:45:00Z',
    notes: 'Footage collected on USB drive and tagged as evidence EV-001.'
  },
  {
    id: 'TASK-002',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Dispatch seized 7.65mm shell casings to Madiwala FSL Ballistics Division',
    taskType: 'Forensic',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2024-03-18T18:00:00Z',
    notes: 'Awaiting preliminary ballistic comparison with country pistol seized in Whitefield case.'
  },
  {
    id: 'TASK-003',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Record Section 180 BNSS statement of eyewitness Smt. Jayalakshmi',
    taskType: 'Documentation',
    priority: 'High',
    status: 'Pending',
    dueDate: '2024-03-19T14:00:00Z',
    notes: 'Witness scheduled to appear at Indiranagar PS at 11:00 AM.'
  },
  {
    id: 'TASK-004',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Execute formal seizure memo for black Bajaj Pulsar (KA-04-E-1234)',
    taskType: 'Seizure',
    priority: 'High',
    status: 'Completed',
    dueDate: '2024-03-16T16:00:00Z',
    completedAt: '2024-03-16T15:30:00Z',
    notes: 'Vehicle impounded under PF 44/2024 and parked at PS yard.'
  },
  {
    id: 'TASK-005',
    caseId: 'CASE-2024-INDR-0102',
    assignedOfficerId: 'OFF-01',
    title: 'Interrogate co-accused Deepak Kumar @ Bullet Deepu regarding firearm source',
    taskType: 'Interrogation',
    priority: 'High',
    status: 'Pending',
    dueDate: '2024-03-20T17:00:00Z',
    notes: 'Focus on supply trail linking country-made pistol to Kalasipalya workshop.'
  },
  {
    id: 'TASK-006',
    caseId: 'CASE-2024-KRP-0215',
    assignedOfficerId: 'OFF-02',
    title: 'Request tower CDR dump for Old Madras Road junction during midnight heist',
    taskType: 'Forensic',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2024-03-21T18:00:00Z',
    notes: 'Awaiting nodal officer response for Airtel and Jio cell IDs.'
  },
  {
    id: 'TASK-007',
    caseId: 'CASE-2024-KRP-0215',
    assignedOfficerId: 'OFF-02',
    title: 'Raid suspected chop shop in B.Channasandra (Syed Imran residence)',
    taskType: 'Seizure',
    priority: 'High',
    status: 'Pending',
    dueDate: '2024-03-22T06:00:00Z',
    notes: 'Search warrant approved by ACMM court.'
  },
  {
    id: 'TASK-008',
    caseId: 'CASE-2024-KORM-0088',
    assignedOfficerId: 'OFF-01',
    title: 'Inspect Ejipura Main Road jewellery store safe for tool-mark forensics',
    taskType: 'Forensic',
    priority: 'High',
    status: 'Completed',
    dueDate: '2024-03-14T15:00:00Z',
    completedAt: '2024-03-14T14:10:00Z',
    notes: 'Gas cutter marks matched industrial acetylene torches.'
  },
  {
    id: 'TASK-009',
    caseId: 'CASE-2024-KORM-0088',
    assignedOfficerId: 'OFF-01',
    title: 'File proclamation warrant under Sec 84 BNSS against Manjunath @ Blade Manja',
    taskType: 'Documentation',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2024-03-23T11:00:00Z',
    notes: 'Accused absconding from known Ejipura address.'
  },
  {
    id: 'TASK-010',
    caseId: 'CASE-2024-WF-0301',
    assignedOfficerId: 'OFF-03',
    title: 'Trace cryptocurrency wallet transactions to mule bank accounts',
    taskType: 'Forensic',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2024-03-22T19:00:00Z',
    notes: 'Tether USDT outbound transfers traced to overseas exchanges.'
  },
  {
    id: 'TASK-011',
    caseId: 'CASE-2024-WF-0301',
    assignedOfficerId: 'OFF-03',
    title: 'Summon bank branch manager under 94 BNSS for KYC documents',
    taskType: 'Documentation',
    priority: 'High',
    status: 'Completed',
    dueDate: '2024-03-17T16:00:00Z',
    completedAt: '2024-03-17T15:00:00Z',
    notes: 'KYC verified fraudulent identities with forged Aadhaar cards.'
  },
  {
    id: 'TASK-012',
    caseId: 'CASE-2024-WF-0301',
    assignedOfficerId: 'OFF-03',
    title: 'Execute freeze order under Sec 106 BNSS on 4 mule ICICI accounts',
    taskType: 'Seizure',
    priority: 'Critical',
    status: 'Completed',
    dueDate: '2024-03-18T10:00:00Z',
    completedAt: '2024-03-18T09:30:00Z',
    notes: 'INR 18,50,000 successfully lien-marked.'
  },
  {
    id: 'TASK-013',
    caseId: 'CASE-2024-CUB-0044',
    assignedOfficerId: 'OFF-04',
    title: 'Retrieve Lavelle Road traffic junction PTZ camera recordings',
    taskType: 'CCTV',
    priority: 'High',
    status: 'Completed',
    dueDate: '2024-03-15T18:00:00Z',
    completedAt: '2024-03-15T17:20:00Z',
    notes: 'Getaway vehicle Honda City (KA-03-Z-8899) identified.'
  },
  {
    id: 'TASK-014',
    caseId: 'CASE-2024-CUB-0044',
    assignedOfficerId: 'OFF-04',
    title: 'Conduct interrogation of Kiran Gowda @ Shadow at Central Prison Parappana Agrahara',
    taskType: 'Interrogation',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2024-03-21T15:00:00Z',
    notes: 'Body warrant obtained from 1st ACMM Court.'
  },
  {
    id: 'TASK-015',
    caseId: 'CASE-2024-CUB-0044',
    assignedOfficerId: 'OFF-04',
    title: 'Draft statutory charge-sheet for Section 305 / 331(4) BNS violations',
    taskType: 'Documentation',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '2024-03-25T17:00:00Z',
    notes: 'Review draft with Assistant Public Prosecutor.'
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
  console.log('[1/7] Purging existing operational data...');
  await db.execute(sql`TRUNCATE TABLE investigative_tasks, case_evidence, case_accused_junction, cases_fir, entities_accused, officers CASCADE;`);
  console.log('✓ Existing tables truncated successfully.');

  // 2. Insert Officers
  console.log('\n[2/7] Seeding tactical officers roster...');
  for (const officer of DEFAULT_OFFICERS) {
    await db.insert(officers).values(officer);
  }
  console.log(`✓ Inserted ${DEFAULT_OFFICERS.length} officer profiles.`);

  // 3. Suspects & Accused Entities (Always include curated, union with large if requested)
  console.log('\n[3/7] Seeding accused suspect dossiers...');
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
  console.log('\n[4/7] Seeding FIR cases with PostGIS spatial coordinates...');
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
  console.log('\n[5/7] Generating co-accused relational junction links...');
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
  console.log('\n[6/7] Seeding forensic evidence items and chain of custody logs...');
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

  // 7. Investigative Tasks Seeding
  console.log('\n[7/7] Seeding operational investigative tasks for officers...');
  let taskCount = 0;
  for (const t of SEED_TASKS) {
    if (!casesMap.has(t.caseId)) continue;
    await db.insert(investigativeTasks).values({
      id: t.id,
      caseId: t.caseId,
      assignedOfficerId: t.assignedOfficerId,
      title: t.title,
      taskType: t.taskType,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
      notes: t.notes || null,
      createdAt: new Date()
    });
    taskCount++;
  }
  console.log(`✓ Inserted ${taskCount} operational investigative tasks.`);

  // Vector Embeddings Seeding for pgvector
  console.log('\nPopulating 1536-dim semantic embeddings for pgvector...');
  await seedEmbeddings();

  console.log(`\n======================================================`);
  console.log(`[Seed Runner] Verification Summary:`);
  console.log(`  - Officers:  ${DEFAULT_OFFICERS.length}`);
  console.log(`  - Suspects:  ${suspectMap.size}`);
  console.log(`  - FIR Cases: ${casesCount}`);
  console.log(`  - Junctions: ${junctionCount}`);
  console.log(`  - Evidence:  ${evidenceCount}`);
  console.log(`  - Tasks:     ${taskCount}`);
  console.log(`  - Embeddings: 1536-dim pgvector HNSW indexed`);
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
