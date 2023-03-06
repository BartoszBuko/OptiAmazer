// Description: This is the main file for the application

// express setup
const express = require("express");
const bodyParser = require("body-parser");
const CheetahO = require("cheetaho-node");
const crypto = require("crypto");
const mime = require("mime");
const multer = require("multer");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

const storage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      crypto.pseudoRandomBytes(16, function (err, raw) {
        cb(
          null,
          raw.toString("hex") +
            "OptiAmazed" +
            "." +
            mime.extension(file.mimetype)
        );
      });
    },
  }),
});
const upload = multer(storage);

const cheetaho = new CheetahO({
  api_key: process.env.CHEETAHO_API_KEY,
});

const optSettings = {
  file: "",
  compression: "lossy",
  keep_exif: 0,
};

// view enine setup
app.set("view engine", "ejs");

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// static files
app.use(express.static("public"));

// routes
app.get("/", (req, res) => {
  res.render("index", { rendered: false, imageData: false, name: false });
});

app.post("/", upload.single("image"), async (req, res) => {
  const file = req.file;
  optSettings.file = file.path;
  let data;
  const customPromise = new Promise((resolve, reject) => {
    cheetaho.optimizeUpload(optSettings, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

  data = await customPromise;
  await fs.unlink(file.path, (err) => {
    if (err) {
      console.log(err);
    }
  });

  res.render("index", {
    rendered: true,
    imageData: data.data.item,
    name: file.originalname,
  });
});

app.listen(port);
