export interface PlayerScoreRecord {
  DateTime: string;
  PlayerName: string;
  SongPack: string;
  SongName: string;
  Difficulty: string;
  Grade: string;
  Score: number;
  PercentDP: string;
  MaxCombo: number;
  Marvelous: number;
  Perfect: number;
  Great: number;
  Good: number;
  OK: number;
  Miss: number;
  NG: number | "-";
  NumTimesPlayed: number;
  Type: string;
  Modifiers: string;
}
