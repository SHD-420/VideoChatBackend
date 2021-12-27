const msgTypes = require("./message-types");
const crypto = require("crypto");
const ROOMS = new Map();

function getRandomRoomId() {
  const gen = () => crypto.randomBytes(3).toString("hex").toUpperCase();
  let roomId;
  do roomId = gen();
  while (ROOMS.has(roomId));
  return roomId;
}

module.exports = function (message, socketId) {
  function response(type, data = null, targets = [socketId]) {
    return { message: { type, data }, targets };
  }
  function createRoom() {
    if (Array.from(ROOMS.values()).some((r) => r.owner === socketId)) {
      return response(msgTypes.outgoing.ROOM.CREATE_ERROR);
    }
    const roomId = getRandomRoomId();
    ROOMS.set(roomId, {
      owner: socketId,
      members: [],
    });
    return response(msgTypes.outgoing.ROOM.CREATED, roomId);
  }
  function joinRoom() {
    const targetRoom = ROOMS.get(message.data.roomId);
    if (targetRoom)
      return response(
        msgTypes.outgoing.ROOM.JOIN_REQ,
        { ...message.data.user, socketId },
        [targetRoom.owner]
      );
    else return response(msgTypes.outgoing.ROOM.JOIN_ERROR);
  }
  function acceptJoinReq() {
    const { socketId: joinee, roomId } = message.data;
    const targetRoom = ROOMS.get(roomId);
    if (targetRoom) {
      const targetRoomMembers = [...targetRoom.members, targetRoom.owner];
      targetRoom.members.push(joinee);
      return [
        response(msgTypes.outgoing.ROOM.JOINED, roomId, [joinee]),
        response(msgTypes.outgoing.ROOM.NEW_MEMBER, joinee, targetRoomMembers),
      ];
    }
  }
  function handleUserDisconnect() {
    const roomVals = Array.from(ROOMS.values());
    const ownedRoom = roomVals.find((r) => r.owner === socketId);
    if (ownedRoom) {
      ROOMS.delete(socketId);
      return response(
        msgTypes.outgoing.ROOM.DESTROYED,
        null,
        ownedRoom.members
      );
    }
    const joinedRoom = roomVals.find((r) => r.members.includes(socketId));
    if (joinedRoom) {
      // TODO: remove member from joinedRoom.members
      return response(msgTypes.outgoing.ROOM.MEMBER_LEFT, socketId, [
        ...joinedRoom.members,
        joinedRoom.owner,
      ]);
    }
  }

  switch (message.type) {
    case msgTypes.incomming.ROOM.CREATE:
      return createRoom();
    case msgTypes.incomming.ROOM.JOIN:
      return joinRoom();
    case msgTypes.incomming.ROOM.ACCEPT_JOIN_REQ:
      return acceptJoinReq();
    case msgTypes.incomming.ROOM.USER_DISCONNECTED:
      return handleUserDisconnect();
  }
};
