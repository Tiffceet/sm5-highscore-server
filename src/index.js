import * as cors from "cors";
import * as endpoints from "./endpoints/index.js";
import express from "express";
import { dirname } from "./globals.js";
import bodyParser from "body-parser";
const app = express();
app.use(bodyParser.text({ type: "text/plain", limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }));
app.use(cors.default());

app.get("/", function (req, res) {
    res.sendFile(dirname + "/serve.html");
});

Object.entries(endpoints).forEach(([_,{ method, endpoint, handler }]) => {
    if (method === "get") {
        app.get(endpoint, handler);
    }
    if (method === "post") {
        app.post(endpoint, handler);
    }
});

app.listen(8765);
