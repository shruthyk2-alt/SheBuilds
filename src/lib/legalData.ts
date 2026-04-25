export interface LegalResponse {
  id: string;
  keywords: string[];
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lawCitations: string[];
  description: string;
  steps: string[];
  nextActions: string[];
  helplines: string[];
}

export const legalDatabase: LegalResponse[] = [
  {
    id: 'harassment-workplace',
    keywords: ['harass', 'workplace', 'office', 'boss', 'colleague', 'posh', 'sexual', 'touch', 'uncomfortable', 'grope'],
    category: 'Workplace Sexual Harassment',
    severity: 'high',
    lawCitations: [
      'POSH Act 2013 (Prevention of Sexual Harassment at Workplace)',
      'IPC Section 354A — Sexual harassment and punishment',
      'IPC Section 509 — Word, gesture or act intended to insult modesty',
    ],
    description: 'Sexual harassment at the workplace is a cognizable offence under the POSH Act 2013 and IPC. Every organisation with 10+ employees must have an Internal Complaints Committee (ICC).',
    steps: [
      'Document the incident with date, time, location, and witnesses',
      'File a written complaint with your ICC within 3 months of the incident',
      'If no ICC exists, file with Local Complaints Committee (LCC) at District level',
      'Request interim relief (transfer, leave) during inquiry',
      'Preserve all evidence: messages, emails, CCTV requests',
    ],
    nextActions: [
      'File ICC complaint immediately',
      'Contact National Commission for Women: 7217735372',
      'Consult a lawyer for criminal complaint under IPC 354A',
      'Reach iCall helpline: 9152987821',
    ],
    helplines: ['1091 — Women Helpline', '112 — Emergency', 'NCW: 7217735372'],
  },
  {
    id: 'domestic-violence',
    keywords: ['husband', 'wife', 'domestic', 'home', 'beat', 'hit', 'abuse', 'family', 'in-law', 'dowry', 'married'],
    category: 'Domestic Violence',
    severity: 'critical',
    lawCitations: [
      'Protection of Women from Domestic Violence Act 2005 (PWDVA)',
      'IPC Section 498A — Husband or relative of husband subjecting woman to cruelty',
      'IPC Section 304B — Dowry death',
      'IPC Section 406 — Criminal breach of trust (dowry)',
    ],
    description: 'Domestic violence includes physical, emotional, sexual, and economic abuse. The PWDVA provides civil remedies including protection orders, residence orders, and monetary relief.',
    steps: [
      'Reach a safe location immediately — neighbor, shelter, or family',
      'Contact a Protection Officer (PO) under PWDVA',
      'File an application in Magistrate Court for Protection Order',
      'Simultaneously file FIR under IPC 498A at nearest police station',
      'Collect evidence: photos of injuries, medical reports, witness names',
    ],
    nextActions: [
      'Call 1091 Women Helpline NOW',
      'Contact nearest One Stop Centre (OSC)',
      'File Domestic Incident Report (DIR) with Protection Officer',
      'Apply for emergency protection order in Magistrate Court',
    ],
    helplines: ['1091 — Women Helpline', '181 — Domestic Violence', '112 — Emergency Police'],
  },
  {
    id: 'stalking',
    keywords: ['follow', 'stalk', 'track', 'watch', 'spy', 'chase', 'follow me', 'someone following', 'being followed'],
    category: 'Stalking',
    severity: 'high',
    lawCitations: [
      'IPC Section 354D — Stalking (inserted by Criminal Law Amendment Act 2013)',
      'IT Act Section 66E — Violation of privacy',
      'IT Act Section 67 — Publishing obscene material (if cyber-stalking)',
    ],
    description: 'Stalking is a criminal offence under IPC 354D. First conviction: up to 3 years imprisonment. Second conviction: up to 5 years. Cyber-stalking through digital means is also covered.',
    steps: [
      'Do NOT confront the stalker — move to a public, populated area',
      'Note the stalker\'s description, vehicle number, time and location',
      'File an FIR at the nearest police station — insist they register it',
      'Apply for restraining order under Section 144 CrPC',
      'Enable location sharing with a trusted contact',
    ],
    nextActions: [
      'Call 112 immediately if in immediate danger',
      'File FIR at nearest police station within 24 hours',
      'Apply for anticipatory bail protection if needed',
      'Contact Cyber Crime Cell if digital harassment: cybercrime.gov.in',
    ],
    helplines: ['112 — Emergency', '1091 — Women Helpline', 'Cyber Crime: 1930'],
  },
  {
    id: 'assault',
    keywords: ['attack', 'assault', 'hit', 'hurt', 'injured', 'physical', 'punched', 'slapped', 'knife', 'weapon', 'bleed'],
    category: 'Physical Assault',
    severity: 'critical',
    lawCitations: [
      'IPC Section 351 — Assault',
      'IPC Section 354 — Assault or criminal force on woman with intent to outrage modesty',
      'IPC Section 323 — Punishment for voluntarily causing hurt',
      'IPC Section 326 — Voluntarily causing grievous hurt by dangerous weapons',
    ],
    description: 'Physical assault on a woman carries enhanced punishment under IPC 354. Grievous hurt with weapons is non-bailable. Seek medical attention first, then file FIR immediately.',
    steps: [
      'Get to safety immediately — call 112 for police + ambulance',
      'Seek immediate medical attention — get injuries documented',
      'Do NOT wash or change clothes — preserve forensic evidence',
      'File FIR at nearest police station — demand medico-legal case (MLC)',
      'Get MLC copy from hospital — it is your legal right',
    ],
    nextActions: [
      'Call 112 NOW — police and ambulance',
      'Go to government hospital for free MLC documentation',
      'File FIR within 24 hours — demand FIR copy as legal right',
      'Contact District Legal Services Authority (DLSA) for free legal aid',
    ],
    helplines: ['112 — Emergency', '108 — Ambulance', '1091 — Women Helpline'],
  },
  {
    id: 'online-harassment',
    keywords: ['online', 'social media', 'message', 'photo', 'video', 'morphed', 'fake', 'instagram', 'whatsapp', 'cyber', 'threat', 'blackmail'],
    category: 'Cyber Harassment / Online Abuse',
    severity: 'high',
    lawCitations: [
      'IT Act Section 66C — Identity theft',
      'IT Act Section 66E — Violation of privacy (publishing private images)',
      'IT Act Section 67A — Publishing sexually explicit material',
      'IPC Section 354D — Cyber-stalking',
      'IPC Section 503 — Criminal intimidation (threats online)',
    ],
    description: 'Cyber harassment includes morphed images, fake profiles, threats, blackmail, and non-consensual sharing of intimate content. Report to Cyber Crime Portal at cybercrime.gov.in.',
    steps: [
      'Screenshot and preserve ALL evidence — don\'t delete messages',
      'Report content to the platform (Instagram, WhatsApp, etc.) immediately',
      'File complaint at cybercrime.gov.in (National Cyber Crime Portal)',
      'File FIR at local Cyber Crime Cell or nearest police station',
      'Request platform to remove content under IT Act Section 79',
    ],
    nextActions: [
      'File online complaint: cybercrime.gov.in',
      'Call Cyber Crime Helpline: 1930',
      'Contact National Commission for Women for digital safety',
      'Consult cyber lawyer for civil injunction',
    ],
    helplines: ['1930 — Cyber Crime Helpline', '1091 — Women Helpline', '112 — Emergency'],
  },
  {
    id: 'general-danger',
    keywords: ['help', 'danger', 'scared', 'afraid', 'unsafe', 'threatening', 'emergency', 'alone', 'dark', 'night'],
    category: 'General Safety Emergency',
    severity: 'critical',
    lawCitations: [
      'IPC Section 339 — Wrongful restraint',
      'IPC Section 340 — Wrongful confinement',
      'IPC Section 506 — Criminal intimidation',
    ],
    description: 'If you feel unsafe or threatened, your immediate safety is the priority. Indian law provides strong protections — but first get to safety, then document and report.',
    steps: [
      'Move to a public, well-lit, populated area immediately',
      'Call 112 — describe your location clearly',
      'Activate your safe phrase to alert emergency contacts',
      'Stay on the phone with someone trusted until safe',
      'Do not go home alone if you believe you are being followed',
    ],
    nextActions: [
      'Call 112 immediately',
      'Trigger SOS to alert your emergency contacts',
      'Share your live location with a trusted person',
      'Go to nearest police station or hospital',
    ],
    helplines: ['112 — Emergency Police', '1091 — Women Helpline', '108 — Ambulance'],
  },
];

export function findLegalResponse(message: string): LegalResponse {
  const lower = message.toLowerCase();
  let bestMatch: LegalResponse | null = null;
  let bestScore = 0;

  for (const response of legalDatabase) {
    let score = 0;
    for (const keyword of response.keywords) {
      if (lower.includes(keyword)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = response;
    }
  }

  // Default to general danger if no match
  return bestMatch || legalDatabase[legalDatabase.length - 1];
}

export function detectEmergencyKeywords(text: string): boolean {
  const emergencyWords = ['help', 'danger', 'scared', 'afraid', 'attack', 'emergency', 'hurt', 'bleeding', 'weapon', 'knife', 'gun'];
  const lower = text.toLowerCase();
  return emergencyWords.some(word => lower.includes(word));
}