const { Server: WebSocketServer } = require("ws");
const crypto = require("crypto");
const handleMessages = require("./handlers/message-handler");
const { incomming } = require("./handlers/message-handler/message-types");

const PORT = 8000;
const server = new WebSocketServer({
  port: PORT,
});

server.on("connection", (socket) => {
  const socketId = crypto.randomBytes(12).toString("hex");
  socket.id = socketId;
  handleMessages({ socket, server });
  socket.on("close", () => {
    socket.emit(
      "message",
      JSON.stringify({ type: incomming.ROOM.USER_DISCONNECTED })
    );
  });
});
