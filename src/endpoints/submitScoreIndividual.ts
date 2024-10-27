import { dirname } from "../globals.js";
import * as fs from "node:fs";
import * as path from "path";
import { Request, Response } from "express";
import { PlayerProfile } from "../interface/PlayerProfile.js";
const submitScoreIndividual = {
  method: "post",
  endpoint: "/submitScoreIndividual",
  handler: function (req: Request, res: Response) {
    let {
      player,
      pack,
      song,
      Difficulty,
      DateTime,
      Disqualified,
      Grade,
      MaxCombo,
      Modifiers,
      PercentDP,
      Score,
      HitMine,
      AvoidMine,
      CheckpointMiss,
      Miss,
      W5,
      W4,
      W3,
      W2,
      W1,
      CheckpointHit,
      OK,
    } = req.body;
    Disqualified = Disqualified === "true" ? true : false;
    Modifiers =
      typeof Modifiers === "string" ? Modifiers.split(",") : Modifiers;
    Score = +Score;
    HitMine = +HitMine;
    AvoidMine = +AvoidMine;
    CheckpointMiss = +CheckpointMiss;
    Miss = +Miss;
    W5 = +W5;
    W4 = +W4;
    W3 = +W3;
    W2 = +W2;
    W1 = +W1;
    CheckpointHit = +CheckpointHit;
    OK = +OK;

    if (!verifyIndividualScoreBody(req.body)) {
      res.status(400);
      res.send("400 Bad Request");
      return;
    }

    let score_obj: Partial<PlayerProfile> = {};
    try {
      score_obj = JSON.parse(
        fs.readFileSync(`${dirname}scores${path.sep}${player}.json`, {
          encoding: "utf-8",
        })
      );
    } catch (e) {
      // This is a new player
      score_obj = {};
      score_obj[player] = [];
    }

    let player_key = Object.keys(score_obj)[0];
    let scores_arr = score_obj[player_key];
    let found_song: [boolean, number] = [false, -1];
    for (let i = 0; i < scores_arr.length; i++) {
      const x = scores_arr[i];
      if (x.pack === pack && x.song === song) {
        found_song[0] = true;
        found_song[1] = i;
        break;
      }
    }

    if (!found_song[0]) {
      score_obj[player_key].push({
        pack,
        song,
        diffs: [
          {
            Difficulty,
            DateTime,
            Disqualified,
            Grade,
            MaxCombo,
            Modifiers,
            PercentDP,
            Score,
            TapNoteScores: {
              HitMine,
              AvoidMine,
              CheckpointMiss,
              Miss,
              W5,
              W4,
              W3,
              W2,
              W1,
              CheckpointHit,
              OK,
            },
          },
        ],
      });
      fs.writeFileSync(
        `${path.resolve(path.dirname(""))}${path.sep}scores${
          path.sep
        }${player}.json`,
        JSON.stringify(score_obj)
      );
      res.status(200);
      res.end();
      return;
    }

    let diffs = score_obj[player_key][found_song[1]].diffs;
    let found_diff: [boolean, number] = [false, -1];
    for (let i = 0; i < diffs.length; i++) {
      const x = diffs[i];
      if (x.Difficulty === Difficulty) {
        found_diff = [true, i];
        break;
      }
    }

    if (!found_diff[0]) {
      score_obj[player_key][found_song[1]].diffs.push({
        Difficulty,
        DateTime,
        Disqualified,
        Grade,
        MaxCombo,
        Modifiers,
        PercentDP,
        Score,
        TapNoteScores: {
          HitMine,
          AvoidMine,
          CheckpointMiss,
          Miss,
          W5,
          W4,
          W3,
          W2,
          W1,
          CheckpointHit,
          OK,
        },
      });
      fs.writeFileSync(
        `${path.resolve(path.dirname(""))}${path.sep}scores${
          path.sep
        }${player}.json`,
        JSON.stringify(score_obj)
      );
      res.status(200);
      res.end();
      return;
    }

    let existing_score =
      score_obj[player_key][found_song[1]].diffs[found_diff[1]].Score;
    if (existing_score > Score) {
      res.status(200);
      res.end();
      return;
    }

    score_obj[player_key][found_song[1]].diffs[found_diff[1]] = {
      Difficulty,
      DateTime,
      Disqualified,
      Grade,
      MaxCombo,
      Modifiers,
      PercentDP,
      Score,
      TapNoteScores: {
        HitMine,
        AvoidMine,
        CheckpointMiss,
        Miss,
        W5,
        W4,
        W3,
        W2,
        W1,
        CheckpointHit,
        OK,
      },
    };

    fs.writeFileSync(
      `${path.resolve(path.dirname(""))}${path.sep}scores${
        path.sep
      }${player}.json`,
      JSON.stringify(score_obj)
    );
    res.status(200);
    res.end();
  },
};

const verifyIndividualScoreBody = (body: Record<string, any>) => {
  let {
    player,
    pack,
    song,
    Difficulty,
    DateTime,
    Disqualified,
    Grade,
    MaxCombo,
    Modifiers,
    PercentDP,
    Score,
    HitMine,
    AvoidMine,
    CheckpointMiss,
    Miss,
    W5,
    W4,
    W3,
    W2,
    W1,
    CheckpointHit,
    OK,
  } = body;
  if (typeof player === "undefined") {
    return false;
  }
  if (typeof pack === "undefined") {
    return false;
  }
  if (typeof song === "undefined") {
    return false;
  }
  if (typeof Difficulty === "undefined") {
    return false;
  }
  if (typeof DateTime === "undefined") {
    return false;
  }
  if (typeof Disqualified === "undefined") {
    return false;
  }
  if (typeof Grade === "undefined") {
    return false;
  }
  if (typeof MaxCombo === "undefined") {
    return false;
  }
  if (typeof Modifiers === "undefined") {
    return false;
  }
  if (typeof PercentDP === "undefined") {
    return false;
  }
  if (typeof Score === "undefined") {
    return false;
  }
  if (typeof HitMine === "undefined") {
    return false;
  }
  if (typeof AvoidMine === "undefined") {
    return false;
  }
  if (typeof CheckpointMiss === "undefined") {
    return false;
  }
  if (typeof Miss === "undefined") {
    return false;
  }
  if (typeof W5 === "undefined") {
    return false;
  }
  if (typeof W4 === "undefined") {
    return false;
  }
  if (typeof W3 === "undefined") {
    return false;
  }
  if (typeof W2 === "undefined") {
    return false;
  }
  if (typeof W1 === "undefined") {
    return false;
  }
  if (typeof CheckpointHit === "undefined") {
    return false;
  }
  if (typeof OK === "undefined") {
    return false;
  }
  if (isNaN(Score)) {
    return false;
  }
  if (isNaN(HitMine)) {
    return false;
  }
  if (isNaN(AvoidMine)) {
    return false;
  }
  if (isNaN(CheckpointMiss)) {
    return false;
  }
  if (isNaN(Miss)) {
    return false;
  }
  if (isNaN(W5)) {
    return false;
  }
  if (isNaN(W4)) {
    return false;
  }
  if (isNaN(W3)) {
    return false;
  }
  if (isNaN(W2)) {
    return false;
  }
  if (isNaN(W1)) {
    return false;
  }
  if (isNaN(CheckpointHit)) {
    return false;
  }
  if (isNaN(OK)) {
    return false;
  }
  return true;
};
export { submitScoreIndividual };
