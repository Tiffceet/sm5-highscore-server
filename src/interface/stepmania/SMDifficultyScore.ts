import { Difficulty } from "../enums/Difficulty";
import { SMTier } from "./SMTier";

export interface SMDifficultyScore {
  $: {
    Difficulty: Difficulty;
  };
  HighScoreList: SMHighscoreList[];
}

export interface SMHighscoreList {
  NumTimesPlayed: number[];
  HighScore: SMHighscore[];
}

export interface SMHighscore {
  NumTimesPlayed: string;
  LastPlayed: string;
  HighGrade: string;
  HighScore: string;
  Name: string;
  Grade: [SMTier];
  Score: string;
  PercentDP: string;
  SurviveSeconds: string;
  MaxCombo: [number];
  StageAward: string;
  PeakComboAward: string;
  Modifiers: string[];
  DateTime: string;
  PlayerGuid: string;
  MachineGuid: string;
  ProductID: string;
  TapNoteScores: [SMTapNoteScore];
  HoldNoteScores: { LetGo: string; Held: string; MissedHold: string }[];
  RadarValues: {
    Stream: number;
    Voltage: number;
    Air: number;
    Freeze: number;
    Chaos: number;
    Notes: number;
    TapsAndHolds: number[];
    Jumps: number;
    Holds: number;
    Mines: number;
    Hands: number;
    Rolls: number;
    Lifts: number;
    Fakes: number;
  }[];
  LifeRemainingSeconds: string;
  Disqualified: string;
}

export interface SMTapNoteScore {
  HitMine: number;
  AvoidMine: number;
  CheckpointMiss: number;
  Miss: number[];
  W5: [number];
  W4: [number];
  W3: [number];
  W2: [number];
  W1: [number];
  CheckpointHit: number;
}
