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

const MAX_SIZE = 4 * 1024 * 1024;
//  add error handling for file size
const fileSizeLimitErrorHandler = (err, req, res, next) => {
  if (err) {
    res.sendStatus(413);
  } else {
    next();
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "tmp/");
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(
        null,
        raw.toString("hex") + "OptiAmazed" + "." + mime.extension(file.mimetype)
      );
    });
  },
});

const upload = multer({ storage: storage, limits: { fileSize: MAX_SIZE } });

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

app.post(
  "/",
  upload.single("image"),
  fileSizeLimitErrorHandler,
  async (req, res) => {
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
  }
);

app.all("*", (req, res) => {
  res.status(404).render("404");
});

app.listen(port);
