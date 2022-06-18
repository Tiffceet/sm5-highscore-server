import * as xml2js from "xml2js";
import * as fs from "fs";
import * as cors from "cors";
import express from "express";
import path from "path";
import bodyParser from "body-parser";

const DIFF_MAP = {
    Novice: "Beginner",
    Easy: "Basic",
    Medium: "Difficult",
    Hard: "Expert",
    Expert: "Challenge",
};

const TIER_MAP = {
    Tier01: "AAA+",
    Tier02: "AAA",
    Tier03: "AA+",
    Tier04: "AA",
    Tier05: "AA-",
    Tier06: "A+",
    Tier07: "A",
    Tier08: "A-",
    Tier09: "B+",
    Tier10: "B",
    Tier11: "B-",
    Tier12: "C+",
    Tier13: "C",
    Tier14: "C-",
    Tier15: "D+",
    Tier16: "D",
    Tier17: "D",
    Failed: "Failed",
};

const app = express();
app.use(bodyParser.text({ type: "*/*" }));
app.use(cors.default());

// curl -H "Content-Type: text/plain; charset=UTF-8" --data-binary "@Stats.xml" konishi.tk:8765/submitScore
app.post("/submitScore", function (req, res) {
    // console.log(req.body);
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
    res.send("Done !");
});

app.get("/", function (req, res) {
    res.sendFile(path.join(path.resolve(path.dirname("")), "/serve.html"));
});

// curl localhost:3000/getScores?username=Controller
app.get("/getScores", async function (req, res) {
    if (req.query.username) {
        // Do filtering
    }
    let dirname = path.resolve(path.dirname("")) + path.sep;
    let scores = {};

    fs.readdir(`${dirname}${path.sep}scores`, function (err, filenames) {
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
        res.json(convertScoreIntoDataRow(scores));
    });
});

const convertScoreIntoDataRow = (scores) => {
    let datarows = [];
    scores = Object.entries(scores);
    scores.forEach(([player, songs]) => {
        songs.forEach((song) => {
            song.diffs.forEach((diff) => {
                datarows.push({
                    DateTime: diff.DateTime,
                    PlayerName: player,
                    SongPack: song.pack,
                    SongName: song.song,
                    Difficulty: diff.Difficulty,
                    Grade: TIER_MAP[diff.Grade],
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

const parseSong = (song_obj) => {
    let diffs = [];
    let [_, pack, song] = song_obj.$.Dir.split("/");
    song_obj.Steps.forEach((diff_obj) => {
        diffs.push(parseDiff(diff_obj));
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
    let Grade = top_score.Grade[0];
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

app.listen(8765);
// convertScoreIntoDataRow({});
