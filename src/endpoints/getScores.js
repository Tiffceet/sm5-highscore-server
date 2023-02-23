import { dirname, DIFF_MAP, TIER_MAP, FC_MAP } from "../globals.js";
import * as fs from "fs";
import path from "path";
const getScores = {
    method: "get",
    endpoint: "/getScores",
    handler: async function (req, res) {
        let { r_song, r_pack, r_diff, sort, score_type } = req.query;
        let scores = {};

        let aliases = {};
        try {
            aliases = JSON.parse(fs.readFileSync(dirname + "alias.json"));
        } catch (e) {}

        fs.readdir(`${dirname}scores`, function (err, filenames) {
            if (err) {
                console.error(err);
                return;
            }
            for (let i = 0; i < filenames.length; i++) {
                const filename = filenames[i];
                let content = fs.readFileSync(
                    dirname + "scores" + path.sep + filename,
                    "utf-8"
                );
                content = JSON.parse(content);
                if (score_type) {
                    if (content.score_type != score_type) {
                        continue;
                    }
                }
                let new_score_obj = {};
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
                data_arr.sort((a, b) => {
                    if (a.Score < b.Score) {
                        return 1;
                    }
                    if (a.Score > b.Score) {
                        return -1;
                    }
                    if (a.Score == b.Score) {
                        return 0;
                    }
                });
            }
            if (sort === "asc") {
                data_arr.sort((a, b) => {
                    if (a.Score > b.Score) {
                        return 1;
                    }
                    if (a.Score < b.Score) {
                        return -1;
                    }
                    if (a.Score == b.Score) {
                        return 0;
                    }
                });
            }
            res.json(data_arr);
        });
    },
};

const convertScoreIntoDataRow = (
    scores,
    packAlias,
    { r_song, r_pack, r_diff }
) => {
    let datarows = [];

    let scores_by_type = Object.entries(scores);
    scores_by_type.forEach(([score_type, scores]) => {
        scores = Object.entries(scores);
        scores.forEach(([player, songs]) => {
            songs.forEach((song) => {
                song.diffs.forEach((diff) => {
                    // Remap pack, diff and grade
                    let cur_pack = song.pack;
                    if (packAlias[player] && packAlias[player][song.pack]) {
                        cur_pack = packAlias[player][song.pack];
                    }
                    let cur_diff =
                        typeof DIFF_MAP[diff.Difficulty] === "undefined"
                            ? diff.Difficulty
                            : DIFF_MAP[diff.Difficulty];
                    let cur_grade =
                        typeof TIER_MAP[diff.Grade] === "undefined"
                            ? diff.Grade
                            : TIER_MAP[diff.Grade];
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

                    if (
                        diff.FCType &&
                        diff.FCType !== "NONE" &&
                        FC_MAP[diff.FCType]
                    ) {
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
                        // NG: typeof diff.NG === "number" ? diff.NG : "-",
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

export { getScores };
