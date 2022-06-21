const {
  incomming: { RTC: inMsg },
  outgoing: { RTC: outMsg },
} = require("./message-types");

module.exports = function (message, socketId) {
  function response(type, additionalData) {
    return {
      message: { type, data: { source: socketId, ...additionalData } },
      targets: [message.data.target],
    };
  }

  switch (message.type) {
    case inMsg.OFFER:
      return response(outMsg.OFFER, {
        offer: message.data.offer,
        sourceUser: message.data.identity,
      });
    case inMsg.ANS:
      return response(outMsg.ANS, {
        answer: message.data.answer,
        sourceUser: message.data.identity,
      });
    case inMsg.ICE_CANDIDATE:
      return response(outMsg.ICE_CANDIDATE, {
        candidate: message.data.candidate,
      });
    default:
      return null;
  }
};
