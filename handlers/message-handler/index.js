const WebSocket = require("ws");
const msgTypes = require("./message-types");
const handleRoomMsg = require("./room-handler");
const handleRTCMsg = require("./rtc-handler");

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
      // handle room oriented messages
      if (Object.values(msgTypes.incomming.ROOM).includes(data.type)) {
        const response = handleRoomMsg(data, socket.id);

        // HandleRoomMsg always returns a promise resolving to response
        if (response instanceof Promise)
          response.then((result) => sendResponse(result));
      } else if (Object.values(msgTypes.incomming.RTC).includes(data.type)) {
        const response = handleRTCMsg(data, socket.id);
        sendResponse(response);
      }
    }
  });
};
