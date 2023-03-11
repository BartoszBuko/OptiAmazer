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
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).send({
        message: "File size is too large. Max limit is 4MB",
      });
    } else {
      res.status(500).send({
        message: "Something went wrong",
      });
    }
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
        raw.toString("hex") +
          "OptiAmazed" +
          Date.now() +
          "." +
          mime.extension(file.mimetype)
      );
    });
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_SIZE },
});

const cheetaho = new CheetahO({
  api_key: process.env.CHEETAHO_API_KEY,
});

let optSettings = {
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
  res.render("index", { rendered: false, imageData: false, names: false });
});

app.post(
  "/",
  upload.array("image", 3),
  fileSizeLimitErrorHandler,
  async (req, response) => {
    let data = [];
    let count = 0;
    const fileNames = [];

    const files = req.files;

    for (let i = 0; i < files.length; i++) {
      fileNames.push(files[i].originalname);
      optSettings.file = files[i].path;
      const promiseForUpload = new Promise((resolve, reject) => {
        cheetaho.optimizeUpload(optSettings, (err, res) => {
          if (err) {
            reject(err);
          } else {
            fs.unlink(files[i].path, (err) => {
              if (err) {
                console.log(err);
              }
            });

            resolve(res.data.item);
          }
        });
      }).then((res) => {
        data.push(res);
        count++;
        if (count === files.length) {
          response.render("index", {
            rendered: true,
            imageData: data,
            names: fileNames,
          });
        }
      });
    }
  }
);

app.all("*", (req, res) => {
  res.status(404).render("404");
});

app.listen(port);
