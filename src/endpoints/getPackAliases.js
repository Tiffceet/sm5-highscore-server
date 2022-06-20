import { dirname } from "../globals.js";
import * as fs from "fs";
import path from "path";
const getPackAliases = {
    method: "get",
    endpoint: "/getPackAliases",
    handler: function (req, res) {
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
    },
};

export { getPackAliases };
