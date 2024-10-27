import { SMDifficultyScore } from "./SMDifficultyScore";

export interface SMSong {
  $: {
    Dir: string;
  };
  Steps: SMDifficultyScore[];
}
