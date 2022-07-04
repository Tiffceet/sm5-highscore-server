import * as xml2js from "xml2js";
import * as fs from "fs";
import path from "path";

let old = fs.readFileSync("old.xml");
let current = fs.readFileSync("current.xml");

const insertScore = (h1, p_score) => {
    let pp_score = +p_score.Score;
    let insert_idx = 0;
    if (typeof h1[0].HighScore === "undefined") {
        h1[0].HighScore = [];
    }
    for (let idx = 0; idx < h1[0].HighScore.length; idx++) {
        const score = h1[0].HighScore[idx];
        let sc = +score.Score;
        if (pp_score > sc) {
            break;
        }
        insert_idx++;
    }
    h1[0].HighScore.splice(insert_idx, 0, p_score);
    return h1;
};

const combinehsl = (h1, h2) => {
    if (typeof h2[0].HighScore === "undefined") {
        return h1;
    }
    h2[0].HighScore.forEach((score) => {
        h1 = insertScore(h1, score);
    });
    return h1;
};

const findSong = (current, p_song_name) => {
    let songs = current.Stats.SongScores[0].Song;
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        if (song.$.Dir.includes("StepMania 5")) {
            continue;
        }
        let song_name = song.$.Dir.slice(0, -1);
        song_name = song_name.slice(song_name.lastIndexOf("/") + 1);
        if (song_name == p_song_name) {
            return { status: true, idx: i };
        }
    }
    return { status: false };
};

const findDiff = (current, p_song_name, p_diff) => {
    let songs = current.Stats.SongScores[0].Song;
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        if (song.$.Dir.includes("StepMania 5")) {
            continue;
        }
        let song_name = song.$.Dir.slice(0, -1);
        song_name = song_name.slice(song_name.lastIndexOf("/") + 1);
        if (song_name != p_song_name) {
            continue;
        }
        let steps = song.Steps;
        for (let j = 0; j < steps.length; j++) {
            const step = steps[j];
            let diff = step.$.Difficulty;
            let hsl = step.HighScoreList;
            if (diff != p_diff) {
                continue;
            }
            return { hsl, i, j };
        }
    }
    return {};
};

const cleanStepmania5 = (current) => {
    let songs = current.Stats.SongScores[0].Song;
    let to_remove = [];
    songs.forEach((song, idx) => {
        let song_name = song.$.Dir.slice(0, -1);
        song_name = song_name.slice(song_name.lastIndexOf("/") + 1);
        if (song.$.Dir.includes("StepMania 5")) {
            let { status: sstatus, idx: sidx } = findSong(current, song_name);
            if (!sstatus) {
                console.log(song_name);
                return;
            }
            to_remove.push(idx);
            let steps = song.Steps;
            for (let op = 0; op < steps.length; op++) {
                const step = steps[op];
                let diff = step.$.Difficulty;
                let hsl = step.HighScoreList;
                let {
                    hsl: foundhsl,
                    i,
                    j,
                } = findDiff(current, song_name, diff);
                if (!foundhsl) {
                    current.Stats.SongScores[0].Song[sidx].Steps.push(step);
                } else {
                    current.Stats.SongScores[0].Song[i].Steps[j].HighScoreList =
                        combinehsl(hsl, foundhsl);
                }
            }
        }
    });

    for (let i = to_remove.length - 1; i > -1; i--) {
        const element = to_remove[i];
        current.Stats.SongScores[0].Song.splice(element, 1)
    }

    songs.forEach((song, idx) => {
        let song_dir = song.$.Dir
        song_dir = song_dir.replace("Songs/DDR X3 VS 2nd mix", "Songs/DDR X3 VS 2ndMIX (AC) (Japan)")
        song_dir = song_dir.replace("Songs/DDR Extreme 2013", "Songs/DDR Extreme")
        song_dir = song_dir.replace("Songs/Supernova2", "Songs/DDR SuperNOVA2")
        song_dir = song_dir.replace("Songs/Supernova", "Songs/DDR SuperNOVA (AC) (International)")
        song_dir = song_dir.replace("Songs/DDR X", "Songs/DDR X (AC) (Japan)")
        song_dir = song_dir.replace("Songs/2014", "Songs/DDR 2014 (AC) (Japan)")
        song_dir = song_dir.replace("Songs/X2", "Songs/DDR X2 (AC)")
        current.Stats.SongScores[0].Song[idx].$.Dir = song_dir
    })
    return current
};

const fuckme = (old, current) => {
    let songs = old.Stats.SongScores[0].Song;
    songs.forEach((song) => {
        let song_name = song.$.Dir.slice(0, -1);
        song_name = song_name.slice(song_name.lastIndexOf("/") + 1);

        let { status: sstatus, idx: sidx } = findSong(current, song_name);
        if (!sstatus) {
            current.Stats.SongScores[0].Song.push(song);
            return;
        }

        let steps = song.Steps;
        for (let op = 0; op < steps.length; op++) {
            const step = steps[op];
            let diff = step.$.Difficulty;
            let hsl = step.HighScoreList;
            let { hsl: foundhsl, i, j } = findDiff(current, song_name, diff);
            if (!foundhsl) {
                current.Stats.SongScores[0].Song[sidx].Steps.push(step);
            } else {
                current.Stats.SongScores[0].Song[i].Steps[j].HighScoreList =
                    combinehsl(hsl, foundhsl);
            }
        }
    });
    current = cleanStepmania5(current);
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(current);
    return xml;
};


function verifyOutput() {
    xml2js.parseString(fs.readFileSync("out.xml"), (err, out_result) => {
        out_result.Stats.SongScores[0].Song.forEach(song => {
            song.Steps.forEach(step => {
                let cur_score = 9999999999
                if(typeof step.HighScoreList[0].HighScore === 'undefined') {
                    step.HighScoreList[0].HighScore = []
                }
                for (let i = 0; i < step.HighScoreList[0].HighScore.length; i++) {
                    const element = step.HighScoreList[0].HighScore[i];
                    // if(typeof element.Score[0] === "undefined") {
                    //     console.log("stop");
                    // }
                    if(cur_score < +element.Score[i]) {
                        throw "Bad output"
                    }
                    cur_score = +element.Score[i]
                }
            })
        })
    });
}

xml2js.parseString(old, (err, old_result) => {
    xml2js.parseString(current, (err, current_result) => {
        fs.writeFileSync("out.xml", fuckme(old_result, current_result));
        console.log("Done");
        verifyOutput();
    });
});

