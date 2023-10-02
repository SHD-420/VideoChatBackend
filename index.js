const http = require("http");
const crypto = require("crypto");

// load .env files into process.ENV and export it
require("dotenv").config();

const { cleanEnv, str, port } = require("envalid");
const env = cleanEnv(process.env, {
  REDIS_USER: str(),
  REDIS_PASSWORD: str(),
  REDIS_HOST: str(),
  REDIS_PORT: port(),
});

module.exports = { env };

const handleMessages = require("./handlers/message-handler");
const { incomming } = require("./handlers/message-handler/message-types");
const { httpRequestListener } = require("./handlers/http-handler");

const PORT = 8000;

// HTTP Server
const httpServer = http.createServer(httpRequestListener);
httpServer.listen(PORT, () => console.log(`Listening on port:${PORT}`));

// Websocket server
const { Server: WebSocketServer } = require("ws");
const wsServer = new WebSocketServer({ server: httpServer });

wsServer.on("connection", (socket) => {
  const socketId = crypto.randomBytes(12).toString("hex");
  socket.id = socketId;
  handleMessages({ socket, server: wsServer });
  socket.on("close", () => {
    socket.emit(
      "message",
      JSON.stringify({ type: incomming.ROOM.USER_DISCONNECTED })
    );
  });
});
