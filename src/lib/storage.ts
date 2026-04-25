export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface UserProfile {
  name: string;
  age: string;
  phone: string;
  email: string;
  contacts: EmergencyContact[];
  safePhrase: string;
  setupComplete: boolean;
  createdAt: string;
}

const PROFILE_KEY = 'safetap_profile';

export function saveProfile(profile: UserProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
}

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROFILE_KEY);
  }
}

export function generateSafePhrase(): string {
  const adjectives = ['silent', 'amber', 'cobalt', 'velvet', 'golden', 'crimson', 'silver', 'misty'];
  const nouns = ['falcon', 'harbor', 'lantern', 'compass', 'anchor', 'bridge', 'forest', 'river'];
  const numbers = ['7', '3', '12', '9', '42', '5', '17', '8'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = numbers[Math.floor(Math.random() * numbers.length)];
  return `${adj}-${noun}-${num}`;
}