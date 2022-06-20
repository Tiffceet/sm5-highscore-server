import { dirname, DIFF_MAP, TIER_MAP } from "../globals.js";
import * as fs from "fs";
import path from "path";
const getScores = {
    method: "get",
    endpoint: "/getScores",
    handler: async function (req, res) {
        let { r_song, r_pack, r_diff } = req.query;
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
                scores = { ...scores, ...JSON.parse(content) };
            }
            res.json(convertScoreIntoDataRow(scores, aliases, req.query));
        });
    },
};

const convertScoreIntoDataRow = (
    scores,
    packAlias,
    { r_song, r_pack, r_diff }
) => {
    let datarows = [];
    scores = Object.entries(scores);
    scores.forEach(([player, songs]) => {
        songs.forEach((song) => {
            song.diffs.forEach((diff) => {
                // Remap pack, diff and grade
                let cur_pack = song.pack;
                if (!packAlias[player] && !packAlias[player][song.pack]) {
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
                    Disqualified: diff.Disqualified,
                    Modifiers: diff.Modifiers.join(", "),
                });
            });
        });
    });
    return datarows;
};

export { getScores };
