import { dirname } from "../globals.js";
import * as fs from "node:fs";
import * as path from "path";
import { Request, Response } from "express";

export interface UploadSongIndexesRequestBody {
  username: string;
  songs: {
    map_name: string;
    pack_name: string;
    difficulties: {
      difficulty_name: string;
      meter: number;
      chart_mode: "dance-single";
    }[];
  }[];
}

const uploadSongIndexes = {
  method: "post",
  endpoint: "/uploadSongIndexes",
  handler: function (req: Request, res: Response) {
    let body: UploadSongIndexesRequestBody = req.body;
    debugger;
    if (!fs.existsSync(dirname + "song_indexes")) {
        fs.mkdirSync(dirname + "song_indexes", { recursive: true });
    }
    fs.writeFileSync(
      `${dirname}song_indexes${path.sep}${body.username}.json`,
      JSON.stringify(body)
    );
    res.status(200);
    res.end();
  },
};
export { uploadSongIndexes };
