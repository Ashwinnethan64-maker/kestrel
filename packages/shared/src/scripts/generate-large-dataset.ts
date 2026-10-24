import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

interface LandmarkPair {
  en: string;
  kn: string;
}

interface StationConfig {
  name: string;
  district: string;
  lat: number;
  lng: number;
  code: string;
  rtoCode: string;
  landmarks: LandmarkPair[];
}

const POLICE_STATIONS: StationConfig[] = [
  {
    name: 'Indiranagar',
    district: 'Bengaluru East',
    lat: 12.9784,
    lng: 77.6408,
    code: 'INDR',
    rtoCode: 'KA-03',
    landmarks: [
      { en: '100 Feet Road near 12th Main', kn: '100 ಅಡಿ ರಸ್ತೆಯ 12ನೇ ಮುಖ್ಯರಸ್ತೆ ಬಳಿ' },
      { en: 'CMH Road Metro Corridor', kn: 'ಸಿಎಂಹೆಚ್ ರಸ್ತೆಯ ಮೆಟ್ರೋ ಕಾರಿಡಾರ್' },
      { en: 'Defence Colony 2nd Stage', kn: 'ಡಿಫೆನ್ಸ್ ಕಾಲೋನಿ 2ನೇ ಹಂತ' },
      { en: 'HAL 2nd Stage Double Road', kn: 'ಹೆಚ್ಎಎಲ್ 2ನೇ ಹಂತದ ಡಬಲ್ ರೋಡ್' }
    ]
  },
  {
    name: 'Koramangala',
    district: 'Bengaluru South',
    lat: 12.9352,
    lng: 77.6245,
    code: 'KORM',
    rtoCode: 'KA-01',
    landmarks: [
      { en: '5th Block Commercial Hub near Sony World Signal', kn: 'ಸೋನಿ ವರ್ಲ್ಡ್ ಸಿಗ್ನಲ್ ಬಳಿಯ 5ನೇ ಬ್ಲಾಕ್ ವಾಣಿಜ್ಯ ಪ್ರದೇಶ' },
      { en: '80 Feet Road near Maharaja Signal', kn: '80 ಅಡಿ ರಸ್ತೆಯ ಮಹಾರಾಜ ಸಿಗ್ನಲ್ ಬಳಿ' },
      { en: 'Jyoti Nivas College Road', kn: 'ಜ್ಯೋತಿ ನಿವಾಸ್ ಕಾಲೇಜು ರಸ್ತೆ' },
      { en: 'Ejipura Main Road near Inner Ring Road', kn: 'ಒಳವರ್ತುಲ ರಸ್ತೆ ಬಳಿಯ ಈಜಿಪುರ ಮುಖ್ಯರಸ್ತೆ' }
    ]
  },
  {
    name: 'K.R. Puram',
    district: 'Bengaluru East',
    lat: 13.0075,
    lng: 77.6959,
    code: 'KRP',
    rtoCode: 'KA-53',
    landmarks: [
      { en: 'Old Madras Road near Cable-Stayed Hanging Bridge', kn: 'ಹಳೆಯ ಮದ್ರಾಸ್ ರಸ್ತೆಯ ತೂಗು ಸೇತುವೆ ಬಳಿ' },
      { en: 'Tin Factory Bus Interchange', kn: 'ಟಿನ್ ಫ್ಯಾಕ್ಟರಿ ಬಸ್ ನಿಲ್ದಾಣ' },
      { en: 'Bhattarahalli Highway Junction', kn: 'ಭಟ್ಟರಹಳ್ಳಿ ಹೆದ್ದಾರಿ ಜಂಕ್ಷನ್' },
      { en: 'Devasandra Main Road', kn: 'ದೇವಸಂದ್ರ ಮುಖ್ಯರಸ್ತೆ' }
    ]
  },
  {
    name: 'Whitefield',
    district: 'Bengaluru East',
    lat: 12.9698,
    lng: 77.7499,
    code: 'WFD',
    rtoCode: 'KA-53',
    landmarks: [
      { en: 'ITPL Main Road near Hope Farm Junction', kn: 'ಹೋಪ್ ಫಾರ್ಮ್ ಜಂಕ್ಷನ್ ಬಳಿಯ ಐಟಿಪಿಎಲ್ ಮುಖ್ಯರಸ್ತೆ' },
      { en: 'Kundalahalli Gate underpass', kn: 'ಕುಂದಲಹಳ್ಳಿ ಗೇಟ್ ಅಂಡರ್‌ಪಾಸ್' },
      { en: 'EPIP Industrial Zone near Export Park', kn: 'ಇಪಿಐಪಿ ಕೈಗಾರಿಕಾ ವಲಯದ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಪಾರ್ಕ್ ಬಳಿ' },
      { en: 'Varthur Kodi Main Road', kn: 'ವರ್ತೂರು ಕೋಡಿ ಮುಖ್ಯರಸ್ತೆ' }
    ]
  },
  {
    name: 'Cubbon Park',
    district: 'Bengaluru Central',
    lat: 12.9733,
    lng: 77.6031,
    code: 'CUB',
    rtoCode: 'KA-01',
    landmarks: [
      { en: 'MG Road Metro Boulevard', kn: 'ಎಂ.ಜಿ. ರಸ್ತೆ ಮೆಟ್ರೋ ಬೌಲೆವಾರ್ಡ್' },
      { en: 'Brigade Road intersection', kn: 'ಬ್ರಿಗೇಡ್ ರಸ್ತೆ ಜಂಕ್ಷನ್' },
      { en: 'Lavelle Road corporate avenue', kn: 'ಲ್ಯಾವೆಲ್ಲೆ ರಸ್ತೆಯ ಕಾರ್ಪೊರೇಟ್ ಅವೆನ್ಯೂ' },
      { en: 'Kasturba Road near Museum Gate', kn: 'ಕಸ್ತೂರಬಾ ರಸ್ತೆಯ ಮ್ಯೂಸಿಯಂ ಗೇಟ್ ಬಳಿ' }
    ]
  },
  {
    name: 'Ulsoor',
    district: 'Bengaluru Central',
    lat: 12.9818,
    lng: 77.6256,
    code: 'ULS',
    rtoCode: 'KA-03',
    landmarks: [
      { en: 'Cambridge Road near Halasuru Lake bund', kn: 'ಹಲಸೂರು ಕೆರೆ ಏರಿ ಬಳಿಯ ಕೇಂಬ್ರಿಡ್ಜ್ ರಸ್ತೆ' },
      { en: 'Bazaar Street commercial lane', kn: 'ಬಜಾರ್ ರಸ್ತೆಯ ವಾಣಿಜ್ಯ ಸಾಲು' },
      { en: 'Kensington Road', kn: 'ಕೆನ್ಸಿಂಗ್ಟನ್ ರಸ್ತೆ' },
      { en: 'Someshwara Temple precinct', kn: 'ಸೋಮೇಶ್ವರ ದೇವಸ್ಥಾನದ ಪರಿಸರ' }
    ]
  },
  {
    name: 'Shivajinagar',
    district: 'Bengaluru Central',
    lat: 12.9857,
    lng: 77.6057,
    code: 'SHV',
    rtoCode: 'KA-01',
    landmarks: [
      { en: 'Russell Market wholesale precinct', kn: 'ರಸ್ಸೆಲ್ ಮಾರ್ಕೆಟ್ ಸಗಟು ವ್ಯಾಪಾರ ವಲಯ' },
      { en: 'Commercial Street pedestrian plaza', kn: 'ಕಮರ್ಷಿಯಲ್ ಸ್ಟ್ರೀಟ್ ಪಾದಚಾರಿ ಪ್ಲಾಜಾ' },
      { en: 'Bowring Hospital Road', kn: 'ಬೌರಿಂಗ್ ಆಸ್ಪತ್ರೆ ರಸ್ತೆ' },
      { en: 'Tasker Town main lane', kn: 'ಟಾಸ್ಕರ್ ಟೌನ್ ಮುಖ್ಯ ರಸ್ತೆ' }
    ]
  },
  {
    name: 'Jayanagar',
    district: 'Bengaluru South',
    lat: 12.9308,
    lng: 77.5838,
    code: 'JAY',
    rtoCode: 'KA-05',
    landmarks: [
      { en: '4th Block Shopping Complex', kn: '4ನೇ ಬ್ಲಾಕ್ ಶಾಪಿಂಗ್ ಕಾಂಪ್ಲೆಕ್ಸ್' },
      { en: 'South End Circle Metro station', kn: 'ಸೌತ್ ಎಂಡ್ ಸರ್ಕಲ್ ಮೆಟ್ರೋ ನಿಲ್ದಾಣ' },
      { en: '11th Main Boulevard, 3rd Block', kn: '3ನೇ ಬ್ಲಾಕ್‌ನ 11ನೇ ಮುಖ್ಯರಸ್ತೆ ಬೌಲೆವಾರ್ಡ್' },
      { en: 'Ashoka Pillar intersection', kn: 'ಅಶೋಕ ಪಿಲ್ಲರ್ ಜಂಕ್ಷನ್' }
    ]
  },
  {
    name: 'HSR Layout',
    district: 'Bengaluru South',
    lat: 12.9121,
    lng: 77.6446,
    code: 'HSR',
    rtoCode: 'KA-51',
    landmarks: [
      { en: '27th Main Road near Sector 1 BDA Complex', kn: 'ಸೆಕ್ಟರ್ 1 ಬಿಡಿಎ ಕಾಂಪ್ಲೆಕ್ಸ್ ಬಳಿಯ 27ನೇ ಮುಖ್ಯರಸ್ತೆ' },
      { en: '19th Main commercial strip', kn: '19ನೇ ಮುಖ್ಯ ರಸ್ತೆಯ ವಾಣಿಜ್ಯ ವಲಯ' },
      { en: 'Agara Lake flyover junction', kn: 'ಅಗರ ಕೆರೆ ಫ್ಲೈಓವರ್ ಜಂಕ್ಷನ್' },
      { en: 'Sector 4 residential enclave', kn: 'ಸೆಕ್ಟರ್ 4 ವಸತಿ ಬಡಾವಣೆ' }
    ]
  },
  {
    name: 'Electronic City',
    district: 'Bengaluru South',
    lat: 12.8452,
    lng: 77.6602,
    code: 'ECY',
    rtoCode: 'KA-51',
    landmarks: [
      { en: 'Phase 1 Toll Gate junction', kn: 'ಹಂತ 1 ಟೋಲ್ ಗೇಟ್ ಜಂಕ್ಷನ್' },
      { en: 'Infosys Avenue IT campus perimeter', kn: 'ಇನ್ಫೋಸಿಸ್ ಅವೆನ್ಯೂ ಐಟಿ ಕ್ಯಾಂಪಸ್ ಸುತ್ತಮುತ್ತ' },
      { en: 'Neeladri Road commercial stretch', kn: 'ನೀಲಾದ್ರಿ ರಸ್ತೆಯ ವಾಣಿಜ್ಯ ಮಾರ್ಗ' },
      { en: 'Konappana Agrahara elevated expressway ramp', kn: 'ಕೋನಪ್ಪನ ಅಗ್ರಹಾರ ಎಲಿವೇಟೆಡ್ ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇ ಇಳಿದಾಣ' }
    ]
  },
  {
    name: 'Peenya',
    district: 'Bengaluru North',
    lat: 13.0285,
    lng: 77.5197,
    code: 'PNY',
    rtoCode: 'KA-04',
    landmarks: [
      { en: '1st Stage Industrial Area 4th Cross', kn: '1ನೇ ಹಂತ ಕೈಗಾರಿಕಾ ಪ್ರದೇಶದ 4ನೇ ಕ್ರಾಸ್' },
      { en: 'CMTI Signal on Tumkur Road Highway', kn: 'ತುಮಕೂರು ರಸ್ತೆ ಹೆದ್ದಾರಿಯ ಸಿಎಂಟಿಐ ಸಿಗ್ನಲ್' },
      { en: 'Jalahalli Cross logistics terminal', kn: 'ಜಾಲಹಳ್ಳಿ ಕ್ರಾಸ್ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಟರ್ಮಿನಲ್' },
      { en: 'Outer Ring Road flyover underpass', kn: 'ಹೊರವರ್ತುಲ ರಸ್ತೆ ಫ್ಲೈಓವರ್ ಅಂಡರ್‌ಪಾಸ್' }
    ]
  },
  {
    name: 'Yeshwanthpur',
    district: 'Bengaluru North',
    lat: 13.0238,
    lng: 77.5501,
    code: 'YPR',
    rtoCode: 'KA-04',
    landmarks: [
      { en: 'APMC Market Yard Gate 2', kn: 'ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ಪ್ರಾಂಗಣ ಗೇಟ್ 2' },
      { en: 'Yeshwanthpur Railway Station front concourse', kn: 'ಯಶವಂತಪುರ ರೈಲ್ವೆ ನಿಲ್ದಾಣದ ಮುಂಭಾಗ' },
      { en: 'Gorguntepalya junction', kn: 'ಗೊರಗುಂಟೆಪಾಳ್ಯ ಜಂಕ್ಷನ್' },
      { en: 'Subhash Nagar railway colony', kn: 'ಸುಭಾಷ್ ನಗರ ರೈಲ್ವೆ ಕಾಲೋನಿ' }
    ]
  },
  {
    name: 'Malleshwaram',
    district: 'Bengaluru Central',
    lat: 13.0031,
    lng: 77.5643,
    code: 'MAL',
    rtoCode: 'KA-04',
    landmarks: [
      { en: '8th Cross Sampige Road traditional market', kn: '8ನೇ ಕ್ರಾಸ್ ಸಂಪಿಗೆ ರಸ್ತೆಯ ಸಾಂಪ್ರದಾಯಿಕ ಮಾರುಕಟ್ಟೆ' },
      { en: 'Margosa Road 15th Cross intersection', kn: 'ಮಾರ್ಗೋಸಾ ರಸ್ತೆ 15ನೇ ಕ್ರಾಸ್ ಜಂಕ್ಷನ್' },
      { en: 'Malleshwaram Circle bus terminus', kn: 'ಮಲ್ಲೇಶ್ವರಂ ಸರ್ಕಲ್ ಬಸ್ ಟರ್ಮಿನಸ್' },
      { en: 'Kadu Malleshwara temple precinct', kn: 'ಕಾಡು ಮಲ್ಲೇಶ್ವರ ದೇವಸ್ಥಾನದ ಪರಿಸರ' }
    ]
  },
  {
    name: 'Yelahanka',
    district: 'Bengaluru North',
    lat: 13.1007,
    lng: 77.5963,
    code: 'YLH',
    rtoCode: 'KA-50',
    landmarks: [
      { en: 'New Town 4th Phase Kogilu Cross', kn: 'ನ್ಯೂ ಟೌನ್ 4ನೇ ಹಂತದ ಕೋಗಿಲು ಕ್ರಾಸ್' },
      { en: 'NES Junction on Airport Highway', kn: 'ಏರ್‌ಪೋರ್ಟ್ ಹೆದ್ದಾರಿಯ ಎನ್ಇಎಸ್ ಜಂಕ್ಷನ್' },
      { en: 'Judicial Layout main boulevard', kn: 'ಜ್ಯುಡಿಷಿಯಲ್ ಲೇಔಟ್ ಮುಖ್ಯ ರಸ್ತೆ' },
      { en: 'Yelahanka Old Town market street', kn: 'ಯಲಹಂಕ ಹಳೇ ಪೇಟೆ ಮಾರುಕಟ್ಟೆ ರಸ್ತೆ' }
    ]
  },
  {
    name: 'Banaswadi',
    district: 'Bengaluru East',
    lat: 13.0142,
    lng: 77.6519,
    code: 'BNW',
    rtoCode: 'KA-03',
    landmarks: [
      { en: 'HRBR Layout 80 Feet Road', kn: 'ಹೆಚ್ಆರ್‌ಬಿಆರ್ ಲೇಔಟ್ 80 ಅಡಿ ರಸ್ತೆ' },
      { en: 'Kammanahalli Main Road culinary hub', kn: 'ಕಮ್ಮನಹಳ್ಳಿ ಮುಖ್ಯರಸ್ತೆ ವಾಣಿಜ್ಯ ವಲಯ' },
      { en: 'CMR Road residential sector', kn: 'ಸಿಎಂಆರ್ ರಸ್ತೆಯ ವಸತಿ ವಲಯ' },
      { en: 'Banaswadi Railway Underpass', kn: 'ಬಾಣಸವಾಡಿ ರೈಲ್ವೆ ಅಂಡರ್‌ಪಾಸ್' }
    ]
  }
];

// 6 Named Syndicates with operational territories and specialties
const SYNDICATES = [
  {
    name: 'East Ring Heist Syndicate',
    stations: ['Indiranagar', 'Koramangala', 'K.R. Puram'],
    crimeFocus: 'Armed Robbery',
    leaderAlias: 'Snake Raju',
    threatLevel: 'Critical'
  },
  {
    name: 'Whitefield Cyber Banking Ring',
    stations: ['Whitefield', 'HSR Layout', 'Electronic City'],
    crimeFocus: 'Cyber Fraud',
    leaderAlias: 'Crypto Vikram',
    threatLevel: 'High'
  },
  {
    name: 'Central Shadow Burglary Crew',
    stations: ['Cubbon Park', 'Ulsoor', 'Shivajinagar', 'Malleshwaram'],
    crimeFocus: 'Organized House Burglary',
    leaderAlias: 'Lockcutter Suri',
    threatLevel: 'High'
  },
  {
    name: 'Peenya Freight & Vehicle Cartel',
    stations: ['Peenya', 'Yeshwanthpur', 'Yelahanka'],
    crimeFocus: 'Vehicle Theft',
    leaderAlias: 'Don Raghu',
    threatLevel: 'High'
  },
  {
    name: 'South Suburb Extortion Syndicate',
    stations: ['Jayanagar', 'HSR Layout', 'Banaswadi'],
    crimeFocus: 'Assault & Extortion',
    leaderAlias: 'Blade Manja',
    threatLevel: 'Critical'
  },
  {
    name: 'Outer Ring Narcotics Network',
    stations: ['Indiranagar', 'Banaswadi', 'Yelahanka', 'Whitefield'],
    crimeFocus: 'Narcotics Trafficking',
    leaderAlias: 'Doctor Santosh',
    threatLevel: 'Critical'
  }
];

// Police Officers in Karnataka State Police (Bengaluru)
const INVESTIGATING_OFFICERS = [
  'Inspector Manjunath Gowda',
  'Inspector Anitha Rao',
  'Sub-Inspector Raghavendra Patil',
  'Inspector Venkatesh Prasad',
  'Sub-Inspector Girish Kumar',
  'Inspector Shivakumar Urs',
  'Sub-Inspector Harish Nayak',
  'Inspector Ramesh Babu',
  'Inspector Kavitha Hegde',
  'Sub-Inspector Suresh Deshmukh'
];

interface CrimeArchetype {
  category: string;
  acts: string[];
  severityWeights: ('Critical' | 'High' | 'Medium' | 'Low')[];
  timeWindow: { startHour: number; endHour: number };
  generator: (ctx: {
    station: StationConfig;
    landmark: LandmarkPair;
    plate: string;
    amount: number;
    weightGrams: number;
  }) => {
    en: string;
    kn: string;
    mo: string;
    tags: string[];
  };
}

const CRIME_ARCHETYPES: CrimeArchetype[] = [
  {
    category: 'Armed Robbery',
    acts: ['IPC 392', 'IPC 397', 'Arms Act Sec 25'],
    severityWeights: ['Critical', 'High', 'High', 'Medium'],
    timeWindow: { startHour: 20, endHour: 3 },
    generator: ({ station, landmark, plate, amount, weightGrams }) => {
      const templates = [
        {
          en: `Two motorcycle-borne assailants intercepted complainant near ${landmark.en}, ${station.name}. Threatening with a long machete, they looted ${weightGrams}g gold ornaments and escaped on a two-wheeler (${plate}).`,
          kn: `${station.name} ಪೊಲೀಸ್ ಠಾಣಾ ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಬಳಿ ಬೈಕ್‌ನಲ್ಲಿ ಬಂದ ಇಬ್ಬರು ಮುಸುಕುಧಾರಿಗಳು ಮಾರಕಾಸ್ತ್ರ ತೋರಿಸಿ ಬೆದರಿಸಿ ${weightGrams} ಗ್ರಾಂ ಚಿನ್ನದ ಸರ ದರೋಡೆ ಮಾಡಿ (${plate}) ವಾಹನದಲ್ಲಿ ಪರಾರಿಯಾಗಿದ್ದಾರೆ.`,
          mo: 'Midnight two-wheeler ambush using bladed weapon intimidation in arterial transit corridors.',
          tags: ['Armed Robbery', 'Gold Snatching', 'Machete Attack', 'Transit Ambush']
        },
        {
          en: `Commercial cash counter ransacked at knifepoint in a retail establishment near ${landmark.en}, ${station.name}. Robbers looted ₹${amount.toLocaleString('en-IN')} cash and fled towards outer ring road.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ವಾಣಿಜ್ಯ ಮಳಿಗೆಗೆ ನುಗ್ಗಿದ ದರೋಡೆಕೋರರು ನೌಕರರಿಗೆ ಚಾಕು ತೋರಿಸಿ ₹${amount.toLocaleString('en-IN')} ನಗದನ್ನು ದರೋಡೆ ಮಾಡಿ ಪರಾರಿಯಾಗಿದ್ದಾರೆ.`,
          mo: 'Commercial retail store robbery at knifepoint during closing cash balance accounting.',
          tags: ['Armed Robbery', 'Commercial Heist', 'Cash Loot', 'Retail Crime']
        },
        {
          en: `ATM cash replenishment custodian threatened with firearms and country pistol near ${landmark.en}, ${station.name}. Suspects seized cash cassette containing ₹${(amount * 2).toLocaleString('en-IN')} before vanishing.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಎಟಿಎಂ ನಗದು ವಾಹನದ ಸಿಬ್ಬಂದಿಗೆ ಪಿಸ್ತೂಲ್ ತೋರಿಸಿ ಜೀವಬೆದರಿಕೆ ಹಾಕಿ ₹${(amount * 2).toLocaleString('en-IN')} ನಗದು ಬಾಕ್ಸ್ ದರೋಡೆ ಮಾಡಲಾಗಿದೆ.`,
          mo: 'Coordinated heist on transit cash handlers with weapon intimidation during vault transfer.',
          tags: ['Armed Robbery', 'Cash Logistics', 'Firearm Threat', 'Organized Heist']
        }
      ];
      return rng.pick(templates);
    }
  },
  {
    category: 'Vehicle Theft',
    acts: ['IPC 379', 'IPC 120B'],
    severityWeights: ['High', 'Medium', 'Medium', 'Low'],
    timeWindow: { startHour: 1, endHour: 5 },
    generator: ({ station, landmark, plate }) => {
      const templates = [
        {
          en: `Luxury SUV registration ${plate} stolen overnight from residential apartment driveway near ${landmark.en}, ${station.name}, using an electronic CAN-bus bypass device.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಬಳಿಯ ಅಪಾರ್ಟ್‌ಮೆಂಟ್ ಪಾರ್ಕಿಂಗ್ ಸ್ಥಳದಿಂದ ${plate} ನೋಂದಣಿಯ ಐಷಾರಾಮಿ ಎಸ್‌ಯುವಿ ಕಾರನ್ನು ಇಲೆಕ್ಟ್ರಾನಿಕ್ ಡಿವೈಸ್ ಬಳಸಿ ಕಳವು ಮಾಡಲಾಗಿದೆ.`,
          mo: 'Electronic OBD port CAN-bus signal cloning and immobilizer bypass of high-end vehicles.',
          tags: ['Vehicle Theft', 'CAN-Bus Hack', 'SUV Lifting', 'Night Burglary']
        },
        {
          en: `Royal Enfield motorcycle (${plate}) lifted from metro station parking facility near ${landmark.en}, ${station.name}, using duplicated master ignition keys.`,
          kn: `${station.name} ಠಾಣಾ ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಮೆಟ್ರೋ ಪಾರ್ಕಿಂಗ್ ಸ್ಥಳದಲ್ಲಿ ನಿಲ್ಲಿಸಿದ್ದ ${plate} ನಂಬರಿನ ರಾಯಲ್ ಎನ್‌ಫೀಲ್ಡ್ ಬೈಕನ್ನು ನಕಲಿ ಕೀ ಬಳಸಿ ಕಳ್ಳತನ ಮಾಡಲಾಗಿದೆ.`,
          mo: 'Master key mechanical override on parked two-wheelers in high-density transit hubs.',
          tags: ['Vehicle Theft', 'Two Wheeler', 'Master Key', 'Transit Parking']
        },
        {
          en: `Commercial logistics delivery vehicle (${plate}) loaded with retail electronics stolen while parked near ${landmark.en}, ${station.name}.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಬಳಿ ನಿಲ್ಲಿಸಿದ್ದ ಇಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಸರಕು ತುಂಬಿದ ಕಮರ್ಷಿಯಲ್ ವಾಹನ (${plate}) ಕಳ್ಳತನವಾಗಿದೆ.`,
          mo: 'Targeted lifting of parked commercial freight carriers during midnight offloading intervals.',
          tags: ['Vehicle Theft', 'Commercial Freight', 'Electronics Cargo', 'Logistics Theft']
        }
      ];
      return rng.pick(templates);
    }
  },
  {
    category: 'Organized House Burglary',
    acts: ['IPC 457', 'IPC 380', 'IPC 34'],
    severityWeights: ['Critical', 'High', 'High', 'Medium'],
    timeWindow: { startHour: 2, endHour: 5 },
    generator: ({ station, landmark, amount, weightGrams }) => {
      const templates = [
        {
          en: `Gated independent residence near ${landmark.en}, ${station.name}, broken into while occupants were out of station. Burglars severed window iron grills using hydraulic jacks, looting ₹${amount.toLocaleString('en-IN')} and ${weightGrams}g gold ornaments.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಬಳಿಯ ಮನೆಯ ಕಿಟಕಿ ಸರಳುಗಳನ್ನು ಹೈಡ್ರಾಲಿಕ್ ಉಪಕರಣದಿಂದ ಮುರಿದು ₹${amount.toLocaleString('en-IN')} ನಗದು ಹಾಗೂ ${weightGrams} ಗ್ರಾಂ ಚಿನ್ನಾಭರಣ ಕಳ್ಳತನ ಮಾಡಲಾಗಿದೆ.`,
          mo: 'Organized midnight entry by hydraulic window grill spreading in locked executive residences.',
          tags: ['House Burglary', 'Hydraulic Jack', 'Gold Theft', 'Locked House']
        },
        {
          en: `First floor duplex apartment near ${landmark.en}, ${station.name}, burgled during late night hours. Iron godrej safe opened with high-speed diamond cutter; diamond jewelry and antique silver seized.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಬಳಿಯ ಡ್ಯೂಪ್ಲೆಕ್ಸ್ ಮನೆಗೆ ನುಗ್ಗಿದ ಖದೀಮರು ಗೋದ್ರೆಜ್ ಲಾಕರ್ ಅನ್ನು ಕಟ್ಟರ್‌ನಿಂದ ಕತ್ತರಿಸಿ ವಜ್ರಾಭರಣ ಹಾಗೂ ಬೆಳ್ಳಿ ವಸ್ತುಗಳನ್ನು ಕದ್ದಿದ್ದಾರೆ.`,
          mo: 'Targeted safe breach utilizing portable high-RPM diamond abrasive disc cutters.',
          tags: ['House Burglary', 'Safe Cracking', 'Diamond Jewelry', 'Organized Gang']
        }
      ];
      return rng.pick(templates);
    }
  },
  {
    category: 'Cyber Fraud',
    acts: ['IT Act Sec 66D', 'IPC 420', 'IPC 120B'],
    severityWeights: ['Critical', 'High', 'Medium', 'Medium'],
    timeWindow: { startHour: 9, endHour: 18 },
    generator: ({ station, landmark, amount }) => {
      const templates = [
        {
          en: `Senior IT professional residing near ${landmark.en}, ${station.name}, defrauded of ₹${amount.toLocaleString('en-IN')} under fake CBI/Narcotics Bureau Skype digital arrest intimidation scam.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ನಿವಾಸಿಯೊಬ್ಬರಿಗೆ ನಕಲಿ ಸಿಬಿಐ ಅಧಿಕಾರಿ ಎಂದು ಸ್ಕೈಪ್ ಮೂಲಕ ಬೆದರಿಸಿ ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ಹೆಸರಿನಲ್ಲಿ ₹${amount.toLocaleString('en-IN')} ವರ್ಗಾಯಿಸಿಕೊಂಡು ವಂಚಿಸಲಾಗಿದೆ.`,
          mo: 'Impersonation of central law enforcement agencies via encrypted VoIP video calls with fraudulent digital arrest warrants.',
          tags: ['Cyber Fraud', 'Digital Arrest', 'CBI Impersonation', 'Mule Accounts']
        },
        {
          en: `Resident near ${landmark.en}, ${station.name}, received fake BESCOM electricity power disconnection SMS containing malicious APK, draining ₹${amount.toLocaleString('en-IN')} through mirrored OTPs.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ನಿವಾಸಿಗೆ ಬೆಸ್ಕಾಂ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತದ ನಕಲಿ ಎಸ್‌ಎಂಎಸ್ ಕಳುಹಿಸಿ ಎಪಿಕೆ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿಸಿ ₹${amount.toLocaleString('en-IN')} ಸೈಬರ್ ವಂಚನೆ ಮಾಡಲಾಗಿದೆ.`,
          mo: 'Phishing SMS delivery of remote-access trojan (RAT) APK to intercept two-factor SMS OTPs.',
          tags: ['Cyber Fraud', 'Malicious APK', 'BESCOM Phishing', 'OTP Hijack']
        },
        {
          en: `Victim lured into high-yield cryptocurrency arbitrage task scam on Telegram near ${landmark.en}, ${station.name}, depositing ₹${amount.toLocaleString('en-IN')} across 6 layered cooperative bank accounts.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ನಾಗರಿಕರಿಗೆ ಟೆಲಿಗ್ರಾಮ್‌ನಲ್ಲಿ ನಕಲಿ ಕ್ರಿಪ್ಟೋ ಹೂಡಿಕೆ ಆಮಿಷವೊಡ್ಡಿ ಹಂತ ಹಂತವಾಗಿ ₹${amount.toLocaleString('en-IN')} ಹಣ ಪಡೆದು ವಂಚಿಸಲಾಗಿದೆ.`,
          mo: 'Investment fraud orchestrated via Telegram task escrow channels routed to synthetic identity mule accounts.',
          tags: ['Cyber Fraud', 'Crypto Scam', 'Telegram Escrow', 'Layered Accounts']
        }
      ];
      return rng.pick(templates);
    }
  },
  {
    category: 'Narcotics Trafficking',
    acts: ['NDPS Act Sec 20', 'NDPS Act Sec 21', 'NDPS Act Sec 22'],
    severityWeights: ['Critical', 'Critical', 'High', 'Medium'],
    timeWindow: { startHour: 18, endHour: 2 },
    generator: ({ station, landmark, weightGrams, plate }) => {
      const templates = [
        {
          en: `Interception of delivery vehicle (${plate}) near ${landmark.en}, ${station.name}, yielding ${weightGrams}g commercial ecstasy MDMA crystals and synthetic blotters sourced via darknet routes.`,
          kn: `${station.name} ಠಾಣಾ ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಬಳಿ (${plate}) ವಾಹನ ತಪಾಸಣೆ ವೇಳೆ ಡಾರ್ಕ್‌ನೆಟ್ ಮೂಲಕ ತರಿಸಲಾಗಿದ್ದ ${weightGrams} ಗ್ರಾಂ ಎಂಡಿಎಂಎ ಸಿಂಥೆಟಿಕ್ ಮಾದಕ ವಸ್ತುಗಳನ್ನು ವಶಪಡಿಸಿಕೊಳ್ಳಲಾಗಿದೆ.`,
          mo: 'Darknet synthetic contraband procurement distributed via dead-drop dead-letter boxes.',
          tags: ['Narcotics', 'MDMA Seizure', 'Darknet Route', 'Highway Checkpoint']
        },
        {
          en: `Special tactical squad raided apartment depot near ${landmark.en}, ${station.name}, seizing ${(weightGrams * 15)}g high-grade hydroponic cannabis packaged for distribution in nightclub circuits.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಅಪಾರ್ಟ್‌ಮೆಂಟ್ ಮೇಲೆ ದಾಳಿ ನಡೆಸಿ ನೈಟ್‌ಕ್ಲಬ್‌ಗಳಿಗೆ ಸರಬರಾಜು ಮಾಡಲು ಪ್ಯಾಕ್ ಮಾಡಲಾಗಿದ್ದ ${(weightGrams * 15)} ಗ್ರಾಂ ಹೈಡ್ರೋಪೋನಿಕ್ ಗಾಂಜಾ ಜಪ್ತಿ ಮಾಡಲಾಗಿದೆ.`,
          mo: 'Organized bulk stocking and micro-pouch packaging of hydro-weed for youth nightlife circuits.',
          tags: ['Narcotics', 'Hydroponic Weed', 'Apartment Depot', 'Special Squad Raid']
        }
      ];
      return rng.pick(templates);
    }
  },
  {
    category: 'Assault & Extortion',
    acts: ['IPC 384', 'IPC 324', 'IPC 506', 'IPC 149'],
    severityWeights: ['High', 'High', 'Medium', 'Critical'],
    timeWindow: { startHour: 19, endHour: 1 },
    generator: ({ station, landmark, amount }) => {
      const templates = [
        {
          en: `Armed henchmen barged into commercial establishment near ${landmark.en}, ${station.name}, assaulting owner with iron rods for refusing monthly hafta protection demand of ₹${amount.toLocaleString('en-IN')}.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ವಾಣಿಜ್ಯ ಮಳಿಗೆಗೆ ನುಗ್ಗಿದ ಗ್ಯಾಂಗ್ ಸದಸ್ಯರು ಪ್ರತಿ ತಿಂಗಳು ₹${amount.toLocaleString('en-IN')} ಹಪ್ತಾ ವಸೂಲಿಗೆ ನಿರಾಕರಿಸಿದ ಮಾಲೀಕನ ಮೇಲೆ ಮಾರಣಾಂತಿಕ ಹಲ್ಲೆ ನಡೆಸಿದ್ದಾರೆ.`,
          mo: 'Syndicate-backed armed intimidation and physical battery for extortion / hafta compliance.',
          tags: ['Assault', 'Extortion Hafta', 'Iron Rods', 'Gang Threat']
        },
        {
          en: `Violent clash erupted near ${landmark.en}, ${station.name}, between rival local gangs over territorial supremacy, leading to machete brandishing and grievous hurt.`,
          kn: `${station.name} ವ್ಯಾಪ್ತಿಯ ${landmark.kn} ಬಳಿ ಏರಿಯಾ ಪ್ರಭಾವಕ್ಕಾಗಿ ಎರಡು ರೌಡಿ ಗ್ಯಾಂಗ್‌ಗಳ ನಡುವೆ ಮಾರಾಮಾರಿ ನಡೆದು ಲಾಂಗ್ ಮಚ್ಚುಗಳಿಂದ ಪರಸ್ಪರ ಮಾರಣಾಂತಿಕ ಹಲ್ಲೆ ಮಾಡಲಾಗಿದೆ.`,
          mo: 'Clash between rival locality syndicates utilizing illicit bladed weapons in public streets.',
          tags: ['Assault', 'Gang War', 'Machete Clash', 'Public Disturbance']
        }
      ];
      return rng.pick(templates);
    }
  }
];

const FIRST_NAMES = [
  'Raju', 'Deepak', 'Manjunath', 'Syed', 'Vikram', 'Kiran', 'Suresh', 'Prashanth',
  'Raghu', 'Anand', 'Sunil', 'Chetan', 'Imran', 'Santosh', 'Naveen', 'Vijay',
  'Girish', 'Harish', 'Arjun', 'Praveen', 'Venkatesh', 'Shiva', 'Karthik', 'Dinesh'
];

const LAST_NAMES = [
  'Nayak', 'Kumar', 'Shetty', 'Imran', 'Malhotra', 'Gowda', 'Babu', 'Khan',
  'Patil', 'Deshmukh', 'Reddy', 'Urs', 'Hebbar', 'Rao', 'Poojary', 'Shastry'
];

const KANNADA_ALIASES = [
  'Snake', 'Blade', 'Bullet', 'Lockcutter', 'Crypto', 'Shadow', 'Don', 'Meter',
  'Silicon', 'Tiger', 'Speed', 'Silent', 'Mechanic', 'Doctor', 'Wire', 'Gold'
];

export function generateDataset(totalCases = 150, totalSuspects = 45) {
  console.log(`Generating ${totalCases} tailored cases and ${totalSuspects} tailored suspects for Bengaluru jurisdiction...`);

  // 1. Generate Structured Suspects with Syndicates & High Recidivism Linkages
  const suspects: any[] = [];
  const syndicateMap = new Map<string, string[]>();

  SYNDICATES.forEach((syn) => syndicateMap.set(syn.name, []));

  for (let i = 1; i <= totalSuspects; i++) {
    const fName = rng.pick(FIRST_NAMES);
    const lName = rng.pick(LAST_NAMES);
    const aliasTag = rng.pick(KANNADA_ALIASES);
    const alias = `${aliasTag} ${fName}`;
    const station = rng.pick(POLICE_STATIONS);
    
    // 65% of suspects belong to one of our 6 organized syndicates
    const hasSyndicate = rng.next() < 0.65;
    const syndicate = hasSyndicate ? rng.pick(SYNDICATES) : null;
    const isRepeat = hasSyndicate ? rng.next() < 0.8 : rng.next() < 0.35;
    const priorArrests = isRepeat ? rng.int(2, 7) : rng.int(0, 1);
    
    const riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' = 
      priorArrests >= 4 ? 'Critical' :
      priorArrests >= 2 ? 'High' :
      priorArrests === 1 ? 'Medium' : 'Low';

    const bailStatus: 'Bailed' | 'Remanded' | 'Absconding' | 'None' =
      riskLevel === 'Critical' ? rng.pick(['Absconding', 'Bailed']) :
      riskLevel === 'High' ? rng.pick(['Bailed', 'Remanded']) :
      riskLevel === 'Medium' ? rng.pick(['Bailed', 'None']) : 'None';

    const suspId = `SUSP-${String(i).padStart(4, '0')}`;
    const plate = `${station.rtoCode}-${rng.pick(['AB', 'MB', 'E', 'Z', 'N', 'K'])}-${rng.int(1000, 9999)}`;

    if (syndicate) {
      syndicateMap.get(syndicate.name)!.push(suspId);
    }

    suspects.push({
      id: suspId,
      fullName: `${fName} ${lName}`,
      aliases: [alias, `${aliasTag}anna`],
      isRepeatOffender: isRepeat,
      riskLevel,
      gangAffiliation: syndicate ? syndicate.name : undefined,
      phoneNumbers: [`+91 ${rng.int(94000, 99999)} ${rng.int(10000, 99999)}`],
      knownAddresses: [`No. ${rng.int(12, 180)}, ${rng.pick(station.landmarks).en}, ${station.name}, Bengaluru`],
      vehiclePlates: isRepeat ? [plate] : [],
      primaryStation: station.name,
      totalPriorArrests: priorArrests,
      bailStatus,
      activeCaseIds: [],
      createdAt: new Date(Date.now() - rng.int(90, 365) * 86400000).toISOString()
    });
  }

  // 2. Generate 150 Deeply Tailored FIR Cases
  const cases: any[] = [];
  const now = Date.now();
  const ninetyDaysMs = 90 * 86400000;

  // Distribute exactly across stations (~10 cases per station for balanced geographic radar)
  for (let i = 1; i <= totalCases; i++) {
    const station = POLICE_STATIONS[(i - 1) % POLICE_STATIONS.length];
    const landmark = rng.pick(station.landmarks);

    // Pick crime archetype - check if station has an active syndicate for crime specialization
    const activeSyndicate = SYNDICATES.find((s) => s.stations.includes(station.name) && rng.next() < 0.6);
    const archetype = activeSyndicate
      ? (CRIME_ARCHETYPES.find((a) => a.category === activeSyndicate.crimeFocus) || rng.pick(CRIME_ARCHETYPES))
      : rng.pick(CRIME_ARCHETYPES);

    // Date & Diurnal time distribution
    const timestamp = now - rng.int(0, ninetyDaysMs);
    const dateObj = new Date(timestamp);
    const hour = rng.next() < 0.75
      ? archetype.timeWindow.startHour > archetype.timeWindow.endHour
        ? (rng.next() < 0.5 ? rng.int(archetype.timeWindow.startHour, 23) : rng.int(0, archetype.timeWindow.endHour))
        : rng.int(archetype.timeWindow.startHour, archetype.timeWindow.endHour)
      : rng.int(0, 23);
    dateObj.setHours(hour, rng.int(0, 59), 0, 0);

    // Gaussian spatial jitter near selected landmark coordinates (within ~200-800m)
    const latJitter = (rng.next() - 0.5) * 0.012;
    const lngJitter = (rng.next() - 0.5) * 0.012;

    const firNum = `FIR-2024-${station.code}-${String(i).padStart(4, '0')}`;
    const caseId = `CASE-2024-${station.code}-${String(i).padStart(4, '0')}`;

    // Select 1 to 3 co-accused suspects (preferring syndicate associates if applicable)
    const caseSuspects: string[] = [];
    const numSuspects = rng.next() < 0.65 ? rng.int(1, 2) : rng.int(2, 3);

    const eligibleSuspectPool = (activeSyndicate && syndicateMap.get(activeSyndicate.name)!.length > 0)
      ? suspects.filter((s) => syndicateMap.get(activeSyndicate.name)!.includes(s.id))
      : suspects;

    for (let s = 0; s < numSuspects; s++) {
      const chosen = rng.pick(eligibleSuspectPool.length > 0 ? eligibleSuspectPool : suspects);
      if (!caseSuspects.includes(chosen.id)) {
        caseSuspects.push(chosen.id);
        (chosen.activeCaseIds as string[]).push(caseId);
      }
    }

    const plate = `${station.rtoCode}-${rng.pick(['AB', 'MB', 'E', 'Z', 'N', 'K'])}-${rng.int(1000, 9999)}`;
    const amount = rng.pick([45000, 85000, 150000, 320000, 550000, 1200000, 2400000]);
    const weightGrams = rng.pick([25, 45, 65, 90, 140, 280]);

    const generatedNarrative = archetype.generator({
      station,
      landmark,
      plate,
      amount,
      weightGrams
    });

    const priority = rng.pick(archetype.severityWeights);
    const status = rng.pick(['Open', 'Under Investigation', 'Under Investigation', 'Under Review', 'Closed']);

    cases.push({
      id: caseId,
      firNumber: firNum,
      crimeCategory: archetype.category,
      priority,
      status,
      incidentDate: dateObj.toISOString(),
      reportedDate: new Date(dateObj.getTime() + rng.int(1, 8) * 3600000).toISOString(),
      district: station.district,
      policeStation: station.name,
      investigatingOfficerName: rng.pick(INVESTIGATING_OFFICERS),
      description: generatedNarrative.en,
      descriptionKannada: generatedNarrative.kn,
      applicableActs: archetype.acts,
      latitude: Number((station.lat + latJitter).toFixed(5)),
      longitude: Number((station.lng + lngJitter).toFixed(5)),
      accusedIds: caseSuspects,
      evidenceIds: [],
      modusOperandi: generatedNarrative.mo,
      tags: generatedNarrative.tags,
      createdAt: dateObj.toISOString(),
      updatedAt: new Date(dateObj.getTime() + rng.int(12, 48) * 3600000).toISOString()
    });
  }

  // 3. Build Syndicate Topology Graph Edges (Co-Accused Links)
  const edges: {
    id: string;
    source: string;
    target: string;
    relation: string;
    weight: number;
    animated: boolean;
  }[] = [];
  const edgeMap = new Map<string, number>();

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

  console.log(`✓ Successfully generated ${cases.length} tailored cases, ${suspects.length} suspects, and ${edges.length} co-accused graph links.`);

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
  console.log(`Successfully written tailored dataset (${cases.length} cases) to: ${outputPath}`);
}

// Run if called directly
const isDirectExecution = process.argv[1] && (
  process.argv[1].endsWith('generate-large-dataset.ts') ||
  process.argv[1].endsWith('generate-large-dataset.js') ||
  path.resolve(process.argv[1]) === path.resolve(__filename)
);

if (isDirectExecution) {
  generateDataset(150, 45);
}
