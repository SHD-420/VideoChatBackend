const WebSocket = require("ws");
const msgTypes = require("./message-types");
const handleRoomMsg = require("./room-handler");

module.exports = function ({ socket, server }) {
  socket.send(
    JSON.stringify({
      type: msgTypes.outgoing.CONNECTION_SUCCESS,
      data: socket.id,
    })
  );
  function parseMessage(message) {
    try {
      const jsonMessage = JSON.parse(message);
      return jsonMessage;
    } catch (error) {
      if (error instanceof SyntaxError) return null;
    }
  }

  function sendResponse(response) {
    function broadcastMessage(data, targetIds) {
      for (client of server.clients) {
        if (
          targetIds.includes(client.id) &&
          client.readyState === WebSocket.OPEN
        )
          client.send(JSON.stringify(data));
      }
    }
    if (response) {
      // support multiple responses
      if (Array.isArray(response))
        for (let responseItem of response)
          broadcastMessage(responseItem.message, responseItem.targets);
      else broadcastMessage(response.message, response.targets);
    }
  }

  socket.on("message", (message) => {
    const data = parseMessage(message);

    if (data) {
      // RTC messages (message type "0")
      // dont need processing, just forwarding
      if (data.type === "0") {
        const { target, ...rtcData } = data.data;
        return sendResponse({
          message: { type: "0", data: { source: socket.id, ...rtcData } },
          targets: [target],
        });
      }

      const roomMsgResponse = handleRoomMsg(data, socket.id);
      if (roomMsgResponse instanceof Promise)
        roomMsgResponse.then((result) => sendResponse(result));
    }
  });
};
