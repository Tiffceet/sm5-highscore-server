import { dirname } from "../globals.js";
import * as fs from "node:fs";
import path from "path";
import { Request, Response } from "express";
import { PackAliases } from "../interface/types/PackAliases.js";
import { PlayerProfile } from "../interface/PlayerProfile.js";
const getPackAliases = {
  method: "get",
  endpoint: "/getPackAliases",
  handler: function (req: Request, res: Response) {
    let packAliases: PackAliases = {};
    try {
      packAliases = JSON.parse(
        fs.readFileSync(dirname + "alias.json", { encoding: "utf-8" })
      );
    } catch (e) {}

    const aliases: Record<
      string,
      Record<string, boolean | string>
    > = packAliases;

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
        // let key = Object.keys(content)[0];
        // if (!aliases[key]) {
        //   aliases[key] = {};
        // }
        let username = content.username;
        if (!aliases[username]) {
          aliases[username] = {};
        }
        content[username].forEach((s: { pack: string }) => {
          if (!packAliases[username][s.pack]) {
            aliases[username][s.pack] = false;
          }
        });
      }
      res.json(packAliases);
    });
  },
};

export { getPackAliases };
