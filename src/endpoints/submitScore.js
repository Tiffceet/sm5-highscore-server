import * as xml2js from "xml2js";
import * as fs from "fs";
const submitScore = {
    method: "post",
    endpoint: "/submitScore",
    handler: function (req, res) {
        xml2js.parseString(req.body, (err, result) => {
            if (err) {
                console.error(err);
                return;
            }

            let data = {};
            let username = result.Stats.GeneralData[0].DisplayName[0];
            data[username] = [];
            result.Stats.SongScores[0].Song.forEach((song_obj) => {
                data[username].push(parseSong(song_obj));
            });
            fs.writeFileSync(
                `${path.resolve(path.dirname(""))}${path.sep}scores${
                    path.sep
                }${username}.json`,
                JSON.stringify(data)
            );
        });
        res.status(200);
        res.end();
    },
};

const parseSong = (song_obj) => {
    let diffs = [];
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

const parseDiff = (diff_obj) => {
    let { Difficulty } = diff_obj.$;
    let top_score = diff_obj.HighScoreList[0].HighScore[0];

    let DateTime = top_score.DateTime[0];
    let Disqualified = top_score.Disqualified[0] == 0 ? false : true;
    // let Grade = top_score.Grade[0];
    let Grade = getDDRAGradeFromScore(+top_score.Score[0], top_score.Grade[0]);
    let MaxCombo = top_score.MaxCombo[0];
    let Modifiers = top_score.Modifiers;
    let PercentDP = top_score.PercentDP[0];
    let Score = +top_score.Score[0];
    let TapNoteScores = Object.entries(top_score.TapNoteScores[0]).reduce(
        (prev, cur, idx) => {
            let new_obj = {
                ...prev,
            };
            new_obj[cur[0]] = +cur[1][0];
            return new_obj;
        },
        {}
    );
    let OK = +top_score.HoldNoteScores[0].Held[0];
    return {
        Difficulty,
        DateTime,
        Disqualified,
        Grade,
        MaxCombo,
        Modifiers,
        PercentDP,
        Score,
        TapNoteScores,
        OK,
    };
};

const getDDRAGradeFromScore = (score, original_grade) => {
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
