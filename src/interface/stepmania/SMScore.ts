import { Grade } from "./../enums/Grade";
import { Difficulty } from "./../enums/Difficulty";
export interface SMScore {
  DateTime: string;
  PlayerName: string;
  SongPack: string;
  SongName: string;
  Difficulty: Difficulty;
  Grade: Grade;
  Score: number;
  PercentDP: string;
  MaxCombo: string;
  Marvelous: number;
  Perfect: number;
  Great: number;
  Good: number;
  OK: number;
  Miss: number;
  NG: number;
  NumTimesPlayed: string;
  Type: "controller" | "pad" | string;
  Modifiers: string;
}
