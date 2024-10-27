import { Difficulty, Grade } from "./enums";
import { FCType } from "./types/FCType";
import { SMTapNoteScore } from "./stepmania/SMDifficultyScore";
import { ScoreType } from "./types/ScoreType";

export interface PlayerDifficultyScore {
  Difficulty: string;
  DateTime: string;
  NG: number;
  Grade: Grade;
  MaxCombo: number;
  Modifiers: string[];
  PercentDP: string;
  Score: number;
  TapNoteScores: Record<keyof SMTapNoteScore, number>;
  OK: number;
  FCType: FCType;
  NumTimesPlayed: number;
}

export interface PlayerScore {
  pack: string;
  song: string;
  diffs: PlayerDifficultyScore[];
}

export interface PlayerProfile {
  username: string;
  score_type: ScoreType;
  scores: PlayerScore[];
  [username: string]: any;
}
