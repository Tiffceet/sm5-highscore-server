import * as cors from "cors";
import * as endpoints from "./endpoints/index.js";
import * as fs from "fs";
import express from "express";
import { dirname } from "./globals.js";
import bodyParser from "body-parser";
import * as favicon from "serve-favicon";

const PORT = process.env.PORT || 8765;
const app = express();
app.use(bodyParser.text({ type: "text/plain", limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }));
app.use(cors.default());
app.use(favicon.default(dirname + "favicon.ico"));

app.get("/", function (req, res) {
    fs.readFile(dirname + "/serve.html", function (err, data) {
        if (err) {
            res.send(404);
        } else {
            res.contentType("text/html");

            data = Buffer.from(
                data
                    .toString()
                    .replace(
                        /\{\{HOST\}\}/g,
                        process.env.HOST ?? "localhost:8765"
                    )
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
