export interface Player {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number; // 1=GKP, 2=DEF, 3=MID, 4=FWD
  now_cost: number;
  selected_by_percent: string;
  form: string;
  points_per_game: string;
  total_points: number;
  event_points?: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  news: string;
  chance_of_playing_next_round: number | null;
  cost_change_start: number;
  cost_change_event: number;
  status: string;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  code: number; // Used for shirt images
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

export interface Fixture {
  id: number;
  event: number; // gameweek
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string;
  started: boolean;
  finished: boolean;
  team_h_score: number | null;
  team_a_score: number | null;
}

export interface ManagerTeam {
  element: number; // player id
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  multiplier: number;
}

export interface ManagerData {
  id: number;
  player_first_name: string;
  player_last_name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  current_event: number;
  bank: number;
  value: number;
  name: string;
}

export interface ManagerPicks {
  active_chip: string | null;
  automatic_subs: any[];
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    rank_sort: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  };
  picks: ManagerTeam[];
}

export interface GameweekData {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
  chip_plays: any[];
}

export interface TransferPlan {
  gameweek: number;
  playerOut: number | null;
  playerIn: number | null;
  cost: number;
}

export interface ChipPlan {
  gameweek: number;
  chip: 'wildcard' | 'freehit' | 'benchboost' | 'triplecaptain' | null;
}

export interface FPLBootstrapData {
  events: GameweekData[];
  teams: Team[];
  elements: Player[];
  element_types: { id: number; singular_name: string; plural_name: string }[];
}
