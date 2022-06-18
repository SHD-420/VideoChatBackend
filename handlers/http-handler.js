const fs = require("node:fs/promises");
const path = require("node:path");
const { getAllRooms } = require("./redis-handler/helpers");

const clientDir = path.join(__dirname, "..", "client");
const { IncomingMessage, ServerResponse } = require("http");

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

  // Serve static content
  if (req.url.startsWith("/assets") || req.url === "favicon.ico") {
    fs.readFile(path.join(clientDir, req.url))
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
