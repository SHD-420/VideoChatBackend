const msgTypes = require("./message-types");
const redis = require("../redis-handler/helpers");

module.exports = function (message, socketId) {
  function response(type, data = null, targets = [socketId]) {
    return { message: { type, data }, targets };
  }
  async function createRoom() {
    try {
      const roomId = await redis.createRoom(socketId);
      return response(msgTypes.outgoing.ROOM.CREATED, roomId);
    } catch {
      return response(msgTypes.outgoing.ROOM.CREATE_ERROR);
    }
  }

  async function joinRoom() {
    try {
      const roomOwner = await redis.getOwner(message.data.roomId.toUpperCase());
      return response(
        msgTypes.outgoing.ROOM.JOIN_REQ,
        { ...message.data.user, socketId },
        [roomOwner]
      );
    } catch {
      return response(msgTypes.outgoing.ROOM.JOIN_ERROR);
    }
  }
  async function acceptJoinReq() {
    try {
      const { socketId: joinee, roomId } = message.data;
      const roomMembers = await redis.getAllMembers(roomId);
      await redis.addMember(roomId, joinee);
      return [
        response(msgTypes.outgoing.ROOM.JOINED, roomId, [joinee]),
        response(msgTypes.outgoing.ROOM.NEW_MEMBER, joinee, roomMembers),
      ];
    } catch (error) {
      console.log(error);
    }
  }

  async function removeMember() {
    try {
      const { socketId: member, roomId } = message.data;
      const owner = await redis.getOwner(roomId);
      if (owner === socketId) {
        await redis.removeMember(roomId, member);
        const remainingMembers = await redis.getAllMembers(roomId);
        return [
          response(
            msgTypes.outgoing.ROOM.MEMBER_GOT_REMOVED,
            member,
            remainingMembers
          ),
          response(msgTypes.outgoing.ROOM.YOU_GOT_REMOVED, null, member),
        ];
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function handleUserDisconnect() {
    const { destryedRooms, leftRooms } = await redis.disconnectUser(socketId);
    const destroyedTargets = destryedRooms.map((room) => room.members).flat();
    const leftTargets = leftRooms
      .map((room) => [...room.members, room.owner])
      .flat();
    return [
      response(msgTypes.outgoing.ROOM.DESTROYED, null, destroyedTargets),
      response(msgTypes.outgoing.ROOM.MEMBER_LEFT, socketId, leftTargets),
    ];
  }

  switch (message.type) {
    case msgTypes.incomming.ROOM.CREATE:
      return createRoom();
    case msgTypes.incomming.ROOM.JOIN:
      return joinRoom();
    case msgTypes.incomming.ROOM.ACCEPT_JOIN_REQ:
      return acceptJoinReq();
    case msgTypes.incomming.ROOM.REMOVE:
      return removeMember();
    case msgTypes.incomming.ROOM.USER_DISCONNECTED:
      return handleUserDisconnect();
  }
};
