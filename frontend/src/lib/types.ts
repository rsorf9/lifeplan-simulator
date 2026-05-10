// Supabase テーブル型定義（最小）。
// 本番では supabase gen types typescript で自動生成することを推奨。

export type SliderInputs = Record<string, number>;

export interface Scenario {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  version: number;
  inputs: SliderInputs;
  extra_settings: Record<string, unknown>;
  parent_scenario_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimulationResult {
  id: string;
  scenario_id: string;
  user_id: string;
  result_type: 'cashflow' | 'asset' | 'loan';
  summary: Record<string, number>;
  time_series: Array<Record<string, number>>;
  engine_version: string;
  computed_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  preferences: Record<string, unknown>;
  default_scenario_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      scenarios: {
        Row: Scenario;
        Insert: Omit<Scenario, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Scenario>;
      };
      simulation_results: {
        Row: SimulationResult;
        Insert: Omit<SimulationResult, 'id' | 'computed_at'> & {
          id?: string;
          computed_at?: string;
        };
        Update: Partial<SimulationResult>;
      };
    };
  };
}
