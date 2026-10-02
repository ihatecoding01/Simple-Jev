import { CandidateSchema, PinnedSchema } from '../types';

const STORAGE_KEYS = {
  PREFS: 'simple_jev_user_prefs',
  PINNED: 'simple_jev_pinned_schemas',
  RECENT: 'simple_jev_recent_inquiries',
};

export interface StoredInquiry {
  id: string;
  title: string;
  query: string;
  type: 'choice' | 'score' | 'noul';
  verdict?: string;
  timestamp: string;
}

const DEFAULT_INQUIRIES: StoredInquiry[] = [
  {
    id: 'rec-1',
    title: 'Invoice Billing Refund',
    query: "Categorize customer email: 'I was charged twice on invoice #994. Please issue a refund ASAP.'",
    type: 'choice',
    verdict: 'Billing & Invoicing',
    timestamp: '2m ago',
  },
  {
    id: 'rec-2',
    title: 'Database Outage Severity',
    query: 'Rate urgency: Primary database cluster has failed and all customer logins are returning errors.',
    type: 'score',
    verdict: '5.0 / 5.0 (Critical)',
    timestamp: '14m ago',
  },
  {
    id: 'rec-3',
    title: 'Compliance Verification',
    query: 'Verify email compliance: Customer claims their GDPR data deletion request was ignored.',
    type: 'noul',
    verdict: 'Verified (Violated)',
    timestamp: '1h ago',
  },
];

export interface UserPrefs {
  mode: 'restricted' | 'unrestricted';
  theme: 'dark' | 'light';
  unedited_count: number;
}

export function getPreferences(): UserPrefs {
  if (typeof window === 'undefined') return { mode: 'restricted', theme: 'dark', unedited_count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read prefs', e);
  }
  return { mode: 'restricted', theme: 'dark', unedited_count: 0 };
}

export function savePreferences(prefs: UserPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save prefs', e);
  }
}

export function getPinnedSchemas(): PinnedSchema[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PINNED);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read pinned schemas', e);
  }
  return [
    {
      id: 'pinned-default-1',
      friendly_name: 'Customer Email Router',
      intent_summary: 'Sort incoming emails into departments',
      question_type: 'Choice',
      options: ['Billing & Invoicing', 'Technical Support', 'Account Management', 'Feature Requests'],
      schema_data: {
        type: 'Choice',
        question: 'What department should this customer email be routed to?',
        options: ['Billing & Invoicing', 'Technical Support', 'Account Management', 'Feature Requests'],
      },
      created_at: new Date().toISOString(),
    },
    {
      id: 'pinned-default-2',
      friendly_name: 'Ticket Urgency Scorer',
      intent_summary: 'Rate urgency from 1 to 5',
      question_type: 'Score',
      options: [],
      schema_data: {
        type: 'Score',
        question: 'Rate the operational urgency of this ticket from 1 to 5.',
        min_score: 1.0,
        max_score: 5.0,
        criteria: 'Impact on business operations and time sensitivity',
      },
      created_at: new Date().toISOString(),
    },
  ];
}

export function savePinnedSchemas(schemas: PinnedSchema[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(schemas));
  } catch (e) {
    console.error('Failed to save pinned schemas', e);
  }
}

export function pinSchema(schemaData: CandidateSchema, friendlyName?: string): PinnedSchema[] {
  const existing = getPinnedSchemas();
  const name = friendlyName || schemaData.question.slice(0, 36);
  const newEntry: PinnedSchema = {
    id: `pinned-${Date.now()}`,
    friendly_name: name,
    intent_summary: schemaData.question,
    question_type: schemaData.type,
    options: schemaData.options || [],
    schema_data: schemaData,
    created_at: new Date().toISOString(),
  };
  const updated = [newEntry, ...existing.filter((s) => s.friendly_name !== name)];
  savePinnedSchemas(updated);
  return updated;
}

export function unpinSchema(id: string): PinnedSchema[] {
  const existing = getPinnedSchemas();
  const updated = existing.filter((s) => s.id !== id);
  savePinnedSchemas(updated);
  return updated;
}

export function renamePinnedSchema(id: string, newName: string): PinnedSchema[] {
  const existing = getPinnedSchemas();
  const updated = existing.map((s) => (s.id === id ? { ...s, friendly_name: newName } : s));
  savePinnedSchemas(updated);
  return updated;
}

export function getRecentInquiries(): StoredInquiry[] {
  if (typeof window === 'undefined') return DEFAULT_INQUIRIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to read recent inquiries', e);
  }
  return DEFAULT_INQUIRIES;
}

export function saveRecentInquiry(inquiry: Omit<StoredInquiry, 'id' | 'timestamp'> & { timestamp?: string }): StoredInquiry[] {
  if (typeof window === 'undefined') return DEFAULT_INQUIRIES;
  const existing = getRecentInquiries();
  const entry: StoredInquiry = {
    ...inquiry,
    id: `rec-${Date.now()}`,
    timestamp: inquiry.timestamp || 'Just now',
  };
  const filtered = existing.filter((item) => item.query.trim().toLowerCase() !== inquiry.query.trim().toLowerCase());
  const updated = [entry, ...filtered].slice(0, 15);
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent inquiry', e);
  }
  return updated;
}
