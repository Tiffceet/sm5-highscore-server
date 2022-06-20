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
    Failed: "E (Failed)",
};

const app = express();
app.use(bodyParser.text({ type: "text/plain", limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }));
app.use(cors.default());

app.get("/getPackAliases", function (req, res) {
    let dirname = path.resolve(path.dirname("")) + path.sep;

    let aliases = {};
    try {
        aliases = JSON.parse(fs.readFileSync(dirname + "alias.json"));
    } catch (e) {}

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
            let c = JSON.parse(content);
            let k = Object.keys(c)[0];
            if (!aliases[k]) {
                aliases[k] = {};
            }
            c[k].forEach((s) => {
                if (!aliases[k][s.pack]) {
                    aliases[k][s.pack] = false;
                }
            });
        }
        res.json(aliases);
    });
});

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
    res.status(200);
    res.end();
});

// curl -X POST --data "player=Looz (Controller)&pack=DDR 2014 (AC) (Japan)&song=EGOISM 440&Difficulty=Hard&DateTime=2022-06-18 21:10:53&Disqualified=false&Grade=Tier07&MaxCombo=88&Modifiers=Overhead, Ddrx-note&PercentDP=0.577&Score=999999&HitMine=0&AvoidMine=0&CheckpointMiss=0&Miss=0&W5=0&W4=0&W3=0&W2=0&W1=0&CheckpointHit=0&OK=0" localhost:8765/submitScoreIndividual
/**
 *
 */
app.post("/submitScoreIndividual", function (req, res) {
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
    Modifiers = Modifiers.split(",");
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

    let score_obj = {};
    try {
        score_obj = JSON.parse(
            fs.readFileSync(
                `${path.resolve(path.dirname(""))}${path.sep}scores${
                    path.sep
                }${player}.json`
            )
        );
    } catch (e) {
        // This is a new player
        score_obj = {};
        score_obj[player] = [];
    }

    let player_key = Object.keys(score_obj)[0];
    let scores_arr = score_obj[player_key];
    let found_song = [false, -1];
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
    let found_diff = [false, -1];
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

const verifyIndividualScoreBody = (body) => {
    console.log("Debug: ");
    console.log(JSON.stringify(body));
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
                    Difficulty:
                        typeof DIFF_MAP[diff.Difficulty] === "undefined"
                            ? diff.Difficulty
                            : DIFF_MAP[diff.Difficulty],
                    Grade:
                        typeof TIER_MAP[diff.Grade] === "undefined"
                            ? diff.Grade
                            : TIER_MAP[diff.Grade],
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

app.listen(8765);
