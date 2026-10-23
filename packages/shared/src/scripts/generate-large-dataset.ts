import * as fs from 'fs';
import * as path from 'path';

// Seeded pseudorandom generator for 100% reproducible data
class SeededRandom {
  private s: number;
  constructor(seed = 1337) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

const rng = new SeededRandom(42042);

// Real Bengaluru police stations and coordinates
const POLICE_STATIONS = [
  { name: 'Indiranagar', district: 'Bengaluru East', lat: 12.9784, lng: 77.6408, code: 'INDR' },
  { name: 'Koramangala', district: 'Bengaluru South', lat: 12.9352, lng: 77.6245, code: 'KORM' },
  { name: 'K.R. Puram', district: 'Bengaluru East', lat: 13.0075, lng: 77.6959, code: 'KRP' },
  { name: 'Whitefield', district: 'Bengaluru East', lat: 12.9698, lng: 77.7499, code: 'WFD' },
  { name: 'Cubbon Park', district: 'Bengaluru Central', lat: 12.9733, lng: 77.6031, code: 'CUB' },
  { name: 'Ulsoor', district: 'Bengaluru Central', lat: 12.9818, lng: 77.6256, code: 'ULS' },
  { name: 'Shivajinagar', district: 'Bengaluru Central', lat: 12.9857, lng: 77.6057, code: 'SHV' },
  { name: 'Jayanagar', district: 'Bengaluru South', lat: 12.9308, lng: 77.5838, code: 'JAY' },
  { name: 'HSR Layout', district: 'Bengaluru South', lat: 12.9121, lng: 77.6446, code: 'HSR' },
  { name: 'Electronic City', district: 'Bengaluru South', lat: 12.8452, lng: 77.6602, code: 'ECY' },
  { name: 'Peenya', district: 'Bengaluru North', lat: 13.0285, lng: 77.5197, code: 'PNY' },
  { name: 'Yeshwanthpur', district: 'Bengaluru North', lat: 13.0238, lng: 77.5501, code: 'YPR' },
  { name: 'Malleshwaram', district: 'Bengaluru Central', lat: 13.0031, lng: 77.5643, code: 'MAL' },
  { name: 'Yelahanka', district: 'Bengaluru North', lat: 13.1007, lng: 77.5963, code: 'YLH' },
  { name: 'Banaswadi', district: 'Bengaluru East', lat: 13.0142, lng: 77.6519, code: 'BNW' }
];

const CRIME_PROFILES = [
  {
    category: 'Armed Robbery',
    acts: ['IPC 392', 'IPC 397', 'Arms Act Sec 25'],
    severityWeights: ['Critical', 'High', 'High', 'Medium'],
    timeWindow: { startHour: 20, endHour: 4 },
    templates: [
      'Store clerk held at knife/machete point in commercial lane; cash register cleared.',
      'Pedestrian intercepted by three motorcycle riders brandishing weapons near underpass.',
      'Delivery personnel ambushed and robbed of high-value electronics package and cash.'
    ]
  },
  {
    category: 'Vehicle Theft',
    acts: ['IPC 379', 'IPC 34'],
    severityWeights: ['High', 'Medium', 'Medium', 'Low'],
    timeWindow: { startHour: 1, endHour: 5 },
    templates: [
      'Two-wheeler parked outside residence lifted overnight using duplicate master key.',
      'SUV stolen from public transit metro parking lot after bypass of security alarm.',
      'Commercial delivery van stolen while driver was offloading inventory.'
    ]
  },
  {
    category: 'Organized House Burglary',
    acts: ['IPC 457', 'IPC 380'],
    severityWeights: ['High', 'High', 'Medium', 'Medium'],
    timeWindow: { startHour: 2, endHour: 5 },
    templates: [
      'Gated house broken into while family was away on vacation; gold ornaments and cash missing.',
      'Ground floor apartment rear window grill removed with hydraulic jacks; electronics taken.',
      'Independent villa targeted; safe opened using angle grinder.'
    ]
  },
  {
    category: 'Cyber Fraud',
    acts: ['IT Act Sec 66D', 'IPC 420'],
    severityWeights: ['Critical', 'High', 'Medium', 'Medium'],
    timeWindow: { startHour: 9, endHour: 18 },
    templates: [
      'Victim deceived by fake electricity bill disconnection SMS and APK malware install.',
      'Corporate HR worker victimized by fake CEO spear-phishing wire transfer request.',
      'Senior citizen duped into transferring pension savings through bogus courier customs scam.'
    ]
  },
  {
    category: 'Narcotics Trafficking',
    acts: ['NDPS Act Sec 20', 'NDPS Act Sec 21'],
    severityWeights: ['Critical', 'Critical', 'High', 'Medium'],
    timeWindow: { startHour: 18, endHour: 2 },
    templates: [
      'Commercial quantity synthetic contraband seized during highway interception checkpoint.',
      'Darknet delivery parcel intercepted at courier hub containing MDMA pills.',
      'Raid on rented apartment operating as distribution depot for youth syndicate.'
    ]
  },
  {
    category: 'Assault & Extortion',
    acts: ['IPC 384', 'IPC 324', 'IPC 506'],
    severityWeights: ['High', 'High', 'Medium', 'Critical'],
    timeWindow: { startHour: 19, endHour: 1 },
    templates: [
      'Local construction site manager threatened with assault by gang henchmen for protection levy.',
      'Bystander attacked with iron rods following road rage dispute in traffic bottleneck.',
      'Small business proprietor assaulted inside shop for reporting earlier harassment.'
    ]
  }
];

const FIRST_NAMES = ['Ramesh', 'Suresh', 'Manjunath', 'Kiran', 'Deepak', 'Anil', 'Sunil', 'Vijay', 'Santosh', 'Praveen', 'Venkatesh', 'Girish', 'Harish', 'Syed', 'Mohammed', 'Arjun', 'Prashanth', 'Naveen', 'Raghu', 'Chetan'];
const LAST_NAMES = ['Gowda', 'Shetty', 'Kumar', 'Nayak', 'Reddy', 'Patil', 'Babu', 'Naidu', 'Deshmukh', 'Khan', 'Hebbar', 'Rao', 'Shastry', 'Poojary', 'Urs'];
const ALIASES = ['Snake', 'Blade', 'Bullet', 'Shadow', 'Tiger', 'Speed', 'Ghost', 'Lockcutter', 'Crypto', 'Doctor', 'Master', 'Pilot', 'Chota', 'Bada'];

export function generateDataset(totalCases = 1500, totalSuspects = 350) {
  console.log(`Generating ${totalCases} cases and ${totalSuspects} suspects...`);

  // 1. Generate Suspects
  const suspects = [];
  for (let i = 1; i <= totalSuspects; i++) {
    const fName = rng.pick(FIRST_NAMES);
    const lName = rng.pick(LAST_NAMES);
    const alias = `${rng.pick(ALIASES)} ${fName}`;
    const station = rng.pick(POLICE_STATIONS);
    const isRepeat = rng.next() < 0.35; // 35% recidivism rate
    const priorArrests = isRepeat ? rng.int(2, 8) : rng.int(0, 1);
    const risk = priorArrests > 4 ? 'Critical' : priorArrests > 2 ? 'High' : priorArrests > 0 ? 'Medium' : 'Low';
    
    suspects.push({
      id: `SUSP-${String(i).padStart(4, '0')}`,
      fullName: `${fName} ${lName}`,
      aliases: [alias],
      isRepeatOffender: isRepeat,
      riskLevel: risk,
      gangAffiliation: isRepeat && rng.next() < 0.6 ? `Syndicate-${rng.int(1, 8)}` : undefined,
      phoneNumbers: [`+91 ${rng.int(90000, 99999)} ${rng.int(10000, 99999)}`],
      knownAddresses: [`${rng.int(1, 120)}, Cross ${rng.int(1, 15)}, ${station.name}, Bengaluru`],
      vehiclePlates: isRepeat ? [`KA-${String(rng.int(1, 55)).padStart(2, '0')}-${rng.pick(['AB', 'MB', 'E', 'Z', 'N'])}-${rng.int(1000, 9999)}`] : [],
      primaryStation: station.name,
      totalPriorArrests: priorArrests,
      bailStatus: isRepeat ? rng.pick(['Bailed', 'Wanted', 'Absconding']) : rng.pick(['None', 'Arrested']),
      activeCaseIds: [],
      createdAt: new Date(Date.now() - rng.int(60, 365) * 86400000).toISOString()
    });
  }

  // 2. Generate Cases across 90-day window
  const cases = [];
  const now = Date.now();
  const ninetyDaysMs = 90 * 86400000;

  for (let i = 1; i <= totalCases; i++) {
    const station = rng.pick(POLICE_STATIONS);
    const profile = rng.pick(CRIME_PROFILES);
    const timestamp = now - rng.int(0, ninetyDaysMs);
    const dateObj = new Date(timestamp);
    
    // Adjust hour based on crime diurnal profile
    const hour = rng.range(0, 1) < 0.7
      ? profile.timeWindow.startHour > profile.timeWindow.endHour
        ? (rng.next() < 0.5 ? rng.int(profile.timeWindow.startHour, 23) : rng.int(0, profile.timeWindow.endHour))
        : rng.int(profile.timeWindow.startHour, profile.timeWindow.endHour)
      : rng.int(0, 23);
    dateObj.setHours(hour, rng.int(0, 59), 0, 0);

    // Realistic Gaussian coordinate jitter around station center
    const latJitter = (rng.next() - 0.5) * 0.035;
    const lngJitter = (rng.next() - 0.5) * 0.035;

    // Pick 1 to 3 suspects
    const caseSuspects: string[] = [];
    const numSuspects = rng.range(0, 1) < 0.7 ? rng.int(1, 2) : rng.int(1, 4);
    for (let s = 0; s < numSuspects; s++) {
      const susp = rng.pick(suspects);
      if (!caseSuspects.includes(susp.id)) {
        caseSuspects.push(susp.id);
        (susp.activeCaseIds as string[]).push(`CASE-2024-${station.code}-${String(i).padStart(4, '0')}`);
      }
    }

    const firNum = `FIR-2024-${station.code}-${String(i).padStart(4, '0')}`;
    const caseId = `CASE-2024-${station.code}-${String(i).padStart(4, '0')}`;
    const severity = rng.pick(profile.severityWeights);

    cases.push({
      id: caseId,
      firNumber: firNum,
      crimeCategory: profile.category,
      priority: severity,
      status: rng.pick(['Open', 'Under Investigation', 'Under Investigation', 'Under Review', 'Closed']),
      incidentDate: dateObj.toISOString(),
      reportedDate: new Date(dateObj.getTime() + rng.int(1, 12) * 3600000).toISOString(),
      district: station.district,
      policeStation: station.name,
      investigatingOfficerName: `Officer ${rng.pick(LAST_NAMES)}`,
      description: rng.pick(profile.templates),
      applicableActs: profile.acts,
      latitude: Number((station.lat + latJitter).toFixed(5)),
      longitude: Number((station.lng + lngJitter).toFixed(5)),
      accusedIds: caseSuspects,
      evidenceIds: [],
      createdAt: dateObj.toISOString(),
      updatedAt: new Date(dateObj.getTime() + rng.int(12, 72) * 3600000).toISOString()
    });
  }

  // 3. Build Graph Edges (Co-Accused links)
  const edges: {
    id: string;
    source: string;
    target: string;
    relation: string;
    weight: number;
    animated: boolean;
  }[] = [];
  const edgeMap = new Map();

  cases.forEach((c) => {
    if (c.accusedIds.length > 1) {
      for (let a = 0; a < c.accusedIds.length; a++) {
        for (let b = a + 1; b < c.accusedIds.length; b++) {
          const key = [c.accusedIds[a], c.accusedIds[b]].sort().join('___');
          const currentWeight = edgeMap.get(key) || 0;
          edgeMap.set(key, currentWeight + 1);
        }
      }
    }
  });

  edgeMap.forEach((weight, key) => {
    const [source, target] = key.split('___');
    edges.push({
      id: `EDGE-${edges.length + 1}`,
      source,
      target,
      relation: 'CO_ACCUSED_WITH',
      weight,
      animated: weight > 1
    });
  });

  console.log(`Generated ${cases.length} cases, ${suspects.length} suspects, ${edges.length} co-accused graph links.`);

  const outputPayload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalCases: cases.length,
      totalSuspects: suspects.length,
      totalGraphEdges: edges.length,
      jurisdiction: 'Bengaluru City Police'
    },
    cases,
    suspects,
    edges
  };

  const fixturesDir = path.resolve(__dirname, '../fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  const outputPath = path.join(fixturesDir, 'bengaluru_crime_dataset_large.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputPayload, null, 2), 'utf8');
  console.log(`Successfully written large dataset to: ${outputPath}`);
}

// Run if called directly
if (require.main === module || process.argv[1]?.endsWith('generate-large-dataset.ts')) {
  generateDataset(1500, 350);
}
