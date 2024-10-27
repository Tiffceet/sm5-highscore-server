import { dirname, DIFF_MAP, TIER_MAP, FC_MAP } from "../globals";
import * as fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { PlayerProfile, PlayerScore } from "../interface/PlayerProfile";
import { ScoreType } from "../interface/types/ScoreType";
import { PlayerScoreRecord } from "../interface/PlayerScoreRecord";
import { PackAliases } from "../interface/types/PackAliases";
const getScores = {
  method: "get",
  endpoint: "/getScores",
  handler: async function (req: Request, res: Response) {
    let { r_song, r_pack, r_diff, sort, score_type } = req.query;

    /**
     * {
     *   controller: { Looz: [...], PlayerB: [...] }
     *   pad: { PadLooz: [...] }
     * }
     */
    let scores: Partial<Record<ScoreType, Record<string, PlayerScore[]>>> = {};

    let aliases: PackAliases = {};
    try {
      aliases = JSON.parse(
        fs.readFileSync(dirname + "alias.json", { encoding: "utf-8" })
      );
    } catch (e) {}

    fs.readdir(`${dirname}scores`, function (err, filenames) {
      if (err) {
        console.error(err);
        return;
      }
      for (let i = 0; i < filenames.length; i++) {
        const filename = filenames[i];
        let content: PlayerProfile = JSON.parse(
          fs.readFileSync(dirname + "scores" + path.sep + filename, "utf-8")
        );
        if (score_type) {
          if (content.score_type != score_type) {
            continue;
          }
        }
        
        let new_score_obj: Record<string, PlayerScore[]> = {};
        new_score_obj[`${content.username}`] = content.scores;
        let content_score_type = content.score_type;
        if (!scores[content_score_type]) {
          scores[content_score_type] = {};
        }
        scores[content_score_type] = {
          ...scores[content_score_type],
          ...new_score_obj,
        };
      }
      let data_arr = convertScoreIntoDataRow(scores, aliases, req.query);
      if (sort === "desc") {
        data_arr.sort((a: PlayerScoreRecord, b: PlayerScoreRecord) => {
          if (a.Score < b.Score) {
            return 1;
          }
          if (a.Score > b.Score) {
            return -1;
          }
          if (a.Score == b.Score) {
            return 0;
          }

          return 0;
        });
      }
      if (sort === "asc") {
        data_arr.sort((a: PlayerScoreRecord, b: PlayerScoreRecord) => {
          if (a.Score > b.Score) {
            return 1;
          }
          if (a.Score < b.Score) {
            return -1;
          }
          if (a.Score == b.Score) {
            return 0;
          }
          return 0;
        });
      }
      res.json(data_arr);
    });
  },
};

const convertScoreIntoDataRow = (
  scores: Partial<Record<ScoreType, Record<string, PlayerScore[]>>>,
  packAlias: Record<string, Record<string, string>>,
  {
    r_song,
    r_pack,
    r_diff,
  }: { r_song?: string; r_pack?: string; r_diff?: string }
): PlayerScoreRecord[] => {
  let datarows: PlayerScoreRecord[] = [];

  let scores_by_type = Object.entries(scores);
  scores_by_type.forEach(([score_type, scores]) => {
    let scoresArray = Object.entries(scores);
    scoresArray.forEach(([player, songs]) => {
      songs.forEach((song) => {
        song.diffs.forEach((diff) => {
          // Remap pack, diff and grade
          let cur_pack = song.pack;
          if (packAlias[player] && packAlias[player][song.pack]) {
            cur_pack = packAlias[player][song.pack];
          }
          let cur_diff = parseDiffIntoDDRFormat(diff.Difficulty);
          let cur_grade = parseGradeIntoDDRFormat(diff.Grade);
          if (r_song && song.song !== r_song) {
            return;
          }
          if (r_pack) {
            if (cur_pack !== r_pack) {
              return;
            }
          }
          if (r_diff && r_diff !== cur_diff) {
            return;
          }

          if (diff.FCType && diff.FCType !== "NONE" && FC_MAP[diff.FCType]) {
            cur_grade = cur_grade + FC_MAP[diff.FCType];
          }

          datarows.push({
            DateTime: diff.DateTime,
            PlayerName: player,
            SongPack: song.pack,
            SongName: song.song,
            Difficulty: cur_diff,
            Grade: cur_grade,
            Score: diff.Score,
            PercentDP: diff.PercentDP,
            MaxCombo: diff.MaxCombo,
            Marvelous: diff.TapNoteScores.W1,
            Perfect: diff.TapNoteScores.W2,
            Great: diff.TapNoteScores.W3,
            Good: diff.TapNoteScores.W4,
            OK: diff.OK,
            Miss: diff.TapNoteScores.Miss,
            NG: typeof diff.NG === "number" ? diff.NG : "-",
            NumTimesPlayed: diff.NumTimesPlayed,
            Type: score_type,
            Modifiers: diff.Modifiers.join(", "),
          });
        });
      });
    });
  });
  return datarows;
};

const parseDiffIntoDDRFormat = (diff: string) => {
  if (Object.keys(DIFF_MAP).includes(diff)) {
    return DIFF_MAP[diff as keyof typeof DIFF_MAP];
  }

  return diff;
};
const parseGradeIntoDDRFormat = (grade: string) => {
  if (Object.keys(TIER_MAP).includes(grade)) {
    return TIER_MAP[grade as keyof typeof TIER_MAP];
  }

  return grade;
};

export { getScores };
