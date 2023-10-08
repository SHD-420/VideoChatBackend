const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const { getAllRooms } = require("./redis-handler/helpers");

const clientDir = path.join(__dirname, "..", "client");
const { IncomingMessage, ServerResponse } = require("http");

//
// Read ../client directory and store all possible paths in "clientFiles";
//
//

/** @var {string[]} */
const clientFiles = [];

function readDirectory(parentDir) {
  // using fs "sync" functions is fine because this code is evaluated
  const items = fsSync.readdirSync(parentDir);
  items.forEach((item) => {
    // don't include index.html in listing
    if (item === "index.html") return;
    const dir = path.join(parentDir, item);
    if (fsSync.lstatSync(dir).isDirectory()) readDirectory(dir);
    clientFiles.push(dir);
  });
}
readDirectory(clientDir);

/**
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 */
module.exports.httpRequestListener = (req, res) => {
  if (req.url === "/api/rooms") {
    getAllRooms().then((rooms) => {
      res.end(JSON.stringify(rooms));
    });
    return;
  }

  // serve statically if requested url exists in client directory
  const urlPath = path.join(clientDir, req.url);
  if (clientFiles.includes(urlPath)) {
    fs.readFile(urlPath)
      .then((data) => {
        res.statusCode = 200;
        res.setHeader("content-type", getMimetype(req.url));
        res.end(data);
      })
      .catch(() => {
        res.statusCode = 404;
        res.end();
      });
    return;
  }

  // Serve index.html (wildcard)
  fs.readFile(path.join(clientDir, "index.html")).then((data) => {
    res.statusCode = 200;
    res.setHeader("content-type", "text/html");
    res.write(data);
    res.end();
  });
};

function getMimetype(filePath) {
  const extension = path.extname(filePath);
  switch (extension) {
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    case ".ico":
      return "image/vnd.microsoft.icon";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
