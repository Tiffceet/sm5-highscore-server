import * as xml2js from "xml2js";
import * as fs from "fs";
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import { countReset } from "console";

const app = express();
app.use(bodyParser.text({ type: "*/*" }));

// curl -H "Content-Type: text/plain; charset=UTF-8" --data-binary "@Stats.xml" localhost:3000/submitScore
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

// curl localhost:3000/getScores?username=Controller
app.get("/getScores", async function (req, res) {
    if (req.query.username) {
        // Do filtering
    }
    let dirname = path.resolve(path.dirname("")) + path.sep;
    let scores = {};

    fs.readdir(`${dirname}${path.sep}scores`, function (err, filenames) {
        if (err) {
            onError(err);
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
        res.json(scores);
    });
});

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
    };
};

app.listen(8765);
