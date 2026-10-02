export type QuestionType = 'Choice' | 'Score' | 'Noul';

export interface CandidateSchema {
  type: QuestionType;
  question: string;
  options?: string[];
  min_score?: number;
  max_score?: number;
  criteria?: string;
  assertion?: string;
}

export interface FitnessReport {
  passed: boolean;
  coverage: Record<string, any>;
  exclusivity: Record<string, any>;
  type_fitness: Record<string, any>;
  scope: Record<string, any>;
  state_sufficiency: Record<string, any>;
  diagnostics: string[];
}

export interface ExecutionResult {
  decision: string | number | boolean;
  confidence: number;
  distribution: Record<string, number>;
  summary: string;
  question_type: QuestionType;
  execution_time_ms: number;
  is_simulation?: boolean;
  engine_mode?: 'live' | 'simulation';
  engine_name?: string;
}

export interface EvaluateResponse {
  status: 'cache_hit' | 'needs_confirmation' | 'diverged' | 'incomplete_state' | 'fallback';
  schema_data?: CandidateSchema;
  state?: Record<string, any>;
  plain_translation?: string;
  divergence_delta?: Record<string, any>;
  assistant_message?: string;
  fitness_report?: FitnessReport;
  retries_attempted: number;
  stepper_stages: Array<{ stage: string; label: string; status?: string }>;
  execution_result?: ExecutionResult;
  is_cached?: boolean;
  is_simulation?: boolean;
  engine_mode?: 'live' | 'simulation';
}

export interface PinnedSchema {
  id: string;
  friendly_name: string;
  intent_summary: string;
  question_type: QuestionType;
  options: string[];
  schema_data: CandidateSchema;
  created_at: string;
}

export interface QuotaStatus {
  daily_limit: number;
  remaining: number;
  cached_runs: number;
  cold_runs: number;
}
