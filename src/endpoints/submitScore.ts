import * as xml2js from "xml2js";
import * as fs from "fs";
import * as path from "path";
import { dirname } from "../globals";
import { SMSong } from "../interface/stepmania/SMSong";
import { Difficulty, Grade } from "../interface/enums";
import {
  SMDifficultyScore,
  SMHighscore,
  SMTapNoteScore,
} from "../interface/stepmania/SMDifficultyScore";
import { createDirectoryIfNotExists } from "./../utils/createDirectoryIfNotExists";
import { Request, Response } from "express";
import { SMTier } from "../interface/stepmania/SMTier";
import { PlayerScoreRecord } from "../interface/PlayerScoreRecord";
import { PlayerDifficultyScore, PlayerScore } from "../interface/PlayerProfile";
import { FCType } from "../interface/types/FCType";

// curl -H "Content-Type: text/plain; charset=UTF-8" --data-binary "@Stats.xml" localhost:8765/submitScore
const submitScore = {
  method: "post",
  endpoint: "/submitScore",
  handler: function (req: Request, res: Response) {
    let score_type: string = "-";
    if (req.query.score_type) {
      score_type = req.query.score_type as string;
    }

    xml2js.parseString(req.body, (err, result) => {
      if (err) {
        console.error(err);
        return;
      }

      let username: string = result.Stats.GeneralData[0].DisplayName[0];
      let data: {
        username: string;
        score_type: string;
        scores: PlayerScore[];
        [k: string]: any;
      } = {
        username,
        score_type,
        scores: [],
      };
      data[username] = [];
      result.Stats.SongScores[0].Song.forEach((song_obj: SMSong) => {
        data.scores.push(parseSong(song_obj));
      });
      createDirectoryIfNotExists("scores");
      fs.writeFileSync(
        `${dirname}scores${path.sep}${username}${
          score_type === "-" ? "" : "-" + score_type
        }.json`,
        JSON.stringify(data)
      );

      // Code to save a backup copy
      createDirectoryIfNotExists("_backup");
      fs.writeFileSync(`${dirname}_backup${path.sep}${username}.xml`, req.body);
    });
    res.status(200);
    res.end();
  },
};

const parseSong = (song_obj: SMSong): PlayerScore => {
  let diffs: PlayerDifficultyScore[] = [];
  let [_, pack, song] = song_obj.$.Dir.split("/");
  song_obj.Steps.forEach((diff_obj) => {
    if (
      typeof diff_obj.HighScoreList !== "undefined" &&
      typeof diff_obj.HighScoreList[0].HighScore !== "undefined"
    ) {
      diffs.push(parseDiff(diff_obj));
    }
  });
  return {
    pack,
    song,
    diffs,
  };
};

const parseDiff = (diff_obj: SMDifficultyScore): PlayerDifficultyScore => {
  let { Difficulty } = diff_obj.$;
  let NumTimesPlayed = diff_obj.HighScoreList[0].NumTimesPlayed[0];
  let top_score: SMHighscore = diff_obj.HighScoreList[0].HighScore[0];

  let DateTime = top_score.DateTime[0];
  let NG = +top_score.HoldNoteScores[0].LetGo[0];
  let Grade = getDDRAGradeFromScore(+top_score.Score[0], top_score.Grade[0]);
  let MaxCombo = top_score.MaxCombo[0];
  let FCType = getFCType(top_score);
  let Modifiers = top_score.Modifiers;
  let PercentDP = top_score.PercentDP[0];
  let Score = +top_score.Score[0];
  let TapNoteScores: Record<keyof SMTapNoteScore, number> = Object.entries(
    top_score.TapNoteScores[0]
  ).reduce<Record<keyof SMTapNoteScore, number>>((prev, cur, idx) => {
    let new_obj: Record<keyof SMTapNoteScore, number> = {
      ...prev,
    };

    new_obj[cur[0] as keyof SMTapNoteScore] = +cur[1][0];
    return new_obj;
  }, {} as Record<keyof SMTapNoteScore, number>);

  if (typeof TapNoteScores.W4 !== "undefined") {
    TapNoteScores.W4 = TapNoteScores.W4 + TapNoteScores.W5;
  }

  let OK = +top_score.HoldNoteScores[0].Held[0];

  return {
    Difficulty,
    DateTime,
    NG,
    Grade: Grade as Grade,
    MaxCombo,
    Modifiers,
    PercentDP,
    Score,
    TapNoteScores,
    OK,
    FCType,
    NumTimesPlayed,
  };
};

/**
 *
 * @param {*} score
 * @returns {"NONE"|"MFC"|"PFC"|"GRFC"|"GOFC"}
 */
const getFCType = (score: SMHighscore): FCType => {
  // Attempt to read stage award before parsing the fc manually
  if (score.StageAward && score.StageAward[0]) {
    switch (score.StageAward[0]) {
      case "FullComboW3":
        return "GRFC";
      case "FullComboW2":
        return "PFC";
      case "FullComboW1":
        return "MFC";
    }
  }
  let max_combo = +score.RadarValues[0].TapsAndHolds[0];
  let player_max_combo = score.MaxCombo[0];
  if (player_max_combo < max_combo) {
    return "NONE";
  }

  let fc_type: FCType = "MFC";
  if (+score.TapNoteScores[0].W2[0] != 0) {
    fc_type = "PFC";
  }

  if (+score.TapNoteScores[0].W3[0] != 0) {
    fc_type = "GRFC";
  }
  if (+score.TapNoteScores[0].W4[0] != 0) {
    fc_type = "GOFC";
  }
  if (+score.TapNoteScores[0].W5[0] != 0) {
    fc_type = "NONE";
  }
  if (+score.HoldNoteScores[0].LetGo[0] != 0) {
    fc_type = "NONE";
  }
  if (+score.HoldNoteScores[0].MissedHold[0] != 0) {
    fc_type = "NONE";
  }
  if (+score.TapNoteScores[0].Miss[0] != 0) {
    fc_type = "NONE";
  }

  return fc_type;
};

const getDDRAGradeFromScore = (score: number, original_grade: SMTier) => {
  if (original_grade === "Failed") {
    return "Failed";
  }
  let grade_table = {
    Tier01: 1000000, // AAA+
    Tier02: 990000, // AAA
    Tier03: 950000, // AA+
    Tier04: 900000, // AA
    Tier05: 890000, // AA-
    Tier06: 850000, // A+
    Tier07: 800000, // A
    Tier08: 790000, // A-
    Tier09: 750000, // B+
    Tier10: 700000, // B
    Tier11: 690000, // B-
    Tier12: 650000, // C+
    Tier13: 600000, // C
    Tier14: 590000, // C-
    Tier15: 550000, // D+
    Tier16: 500000, // D
    Tier17: 0, // D
  };
  let gt = Object.entries(grade_table);
  let final_tier = "Tier17";
  for (let i = gt.length - 1; i >= 0; i--) {
    const [Tier, TierScore] = gt[i];
    if (score >= TierScore) {
      final_tier = Tier;
    }
  }
  return final_tier;
};

export { submitScore };
