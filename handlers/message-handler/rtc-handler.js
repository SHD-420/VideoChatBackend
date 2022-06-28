const {
  incomming: { RTC_EVENT: incommingEvent },
  outgoing: { RTC_EVENT: outgoingEvent },
} = require("./message-types");

module.exports = function (message, socketId) {
  function response(type, additionalData) {
    return {
      message: { type, data: { source: socketId, ...additionalData } },
      targets: [message.data.target],
    };
  }

  switch (message.type) {
    case incommingEvent:
      return response(outgoingEvent, {
        candidate: message.data.candidate,
        description: message.data.description,
      });
    default:
      return null;
  }
};
