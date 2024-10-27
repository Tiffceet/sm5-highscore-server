import cors from "cors";
import * as endpoints from "./endpoints/index.js";
import * as fs from "node:fs";
import express, { Request, Response } from "express";
import { dirname } from "./globals.js";
import bodyParser from "body-parser";
import favicon from "serve-favicon";

const PORT = process.env.PORT || 8765;
const app = express();
app.use(bodyParser.text({ type: "text/plain", limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }));
app.use(cors());
app.use(favicon(dirname + "favicon.ico"));

app.get("/", function (req: Request, res: Response) {
  fs.readFile(dirname + "/serve.html", function (err, data) {
    if (err) {
      res.send(404);
    } else {
      res.contentType("text/html");

      data = Buffer.from(
        data
          .toString()
          .replace(/\{\{HOST\}\}/g, process.env.HOST ?? "localhost:8765")
      );

      res.send(data);
    }
  });
  // res.sendFile(dirname + "/serve.html");
});

Object.entries(endpoints).forEach(([_, { method, endpoint, handler }]) => {
  if (method === "get") {
    app.get(endpoint, handler);
  }
  if (method === "post") {
    app.post(endpoint, handler);
  }
});

app.listen(PORT, () => {
  console.log(`Server had started at port ${PORT}`);
});
