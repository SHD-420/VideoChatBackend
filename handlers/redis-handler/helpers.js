const { redis, isRedisConnected } = require(".");
const { ERROR_CODES } = require("./error-codes");
const crypto = require("crypto");

function _generateRoomId() {
  function generateId() {
    return new Promise((resolve) => {
      const roomId = crypto.randomBytes(3).toString("hex").toUpperCase();

      redis.exists(`ROOM:${roomId}`).then((result) => {
        const exists = Boolean(result);
        if (exists) generateId().then(resolve);
        else resolve(roomId);
      });
    });
  }

  return generateId();
}

async function _removeMember(roomKey, member) {
  const memberIndex = await redis.send_command(
    "JSON.arrindex",
    roomKey,
    "..members",
    `"${member}"`
  );
  if (memberIndex === -1) throw new Error(ERROR_CODES.MEMBER_NOT_FOUND);
  await redis.send_command("JSON.arrpop", roomKey, "..members", memberIndex);
}

async function _deleteRoom(roomKey, owner) {
  await redis.srem("ALL_OWNERS", `"${owner}"`);
  await redis.del(roomKey);
}

/**
 *
 * @param {string} owner SocketID of the room owner
 * @returns {Promise<string>} Promise resolving to the id of newly created room
 */
module.exports.createRoom = async function (owner) {
  if (isRedisConnected()) {
    const ownerAlreadyHasRoom = Boolean(
      await redis.sismember("ALL_OWNERS", owner)
    );
    if (ownerAlreadyHasRoom) throw new Error(ERROR_CODES.USER_HAS_ROOM);
    const roomId = await _generateRoomId();
    const roomData = JSON.stringify({ owner, members: [] });
    await redis.sadd("ALL_OWNERS", `"${owner}"`);
    await redis.send_command("JSON.set", `ROOM:${roomId}`, ".", roomData);
    return roomId;
  }
};

/**
 *
 * @param {string} roomId Id of the target room
 * @param {string} newMember SocketID of the new menber
 * @returns {Promise<void>} Promise which is resolved after the member gets added.
 */
module.exports.addMember = async function (roomId, newMember) {
  try {
    await redis.send_command(
      "JSON.arrappend",
      `ROOM:${roomId}`,
      "..members",
      `"${newMember}"`
    );
  } catch {
    throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
  }
};

/**
 *
 * @param {string} roomId
 * @returns {Promise<string[]>} Promise resolving to all members including the owner
 */
module.exports.getAllMembers = async function (roomId) {
  if (isRedisConnected()) {
    const data = await redis.send_command("JSON.get", `ROOM:${roomId}`, ".");
    if (!data) throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
    const room = JSON.parse(data);
    return [...room.members, room.owner];
  }
};

/**
 *
 * @param {string} roomId RoomId of the target room
 * @returns {Promise<string>} SocketId of the owner
 */
module.exports.getOwner = async function (roomId) {
  if (isRedisConnected()) {
    const owner = (
      await redis.send_command("JSON.mget", `ROOM:${roomId}`, "..owner")
    )[0];
    if (!owner) throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
    return JSON.parse(owner);
  }
};

/**
 *
 * @param {string} roomId RoomId of the room in which member exists
 * @param {string} member SocketId of the member to remove
 */
module.exports.removeMember = async function (roomId, member) {
  if (isRedisConnected()) {
    try {
      await _removeMember(`ROOM:${roomId}`, member);
    } catch (error) {
      throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
    }
  }
};

/**
 *
 * @param {string} roomId RoomId of the room to delete
 */
module.exports.deleteRoom = async function (roomId) {
  try {
    const roomKey = `ROOM:${roomId}`;
    const owner = (
      await redis.send_command("JSON.mget", roomKey, "..owner")
    )[0];
    if (!owner) throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
    await _deleteRoom(roomKey, JSON.parse(owner));
  } catch (error) {
    throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
  }
};

/**
 * Remove 'user' from all rooms he/she's part of and delete
 * the rooms owned by her/him
 * @param {string} user SocketId of the target user
 */
module.exports.disconnectUser = async function (user) {
  if (isRedisConnected()) {
    const roomKeys = await redis.keys("ROOM:*");
    const disconnectionEffects = {
      destryedRooms: [],
      leftRooms: [],
    };
    for (const key of roomKeys) {
      const data = await redis.send_command("JSON.get", key);
      const { owner, members } = JSON.parse(data);
      if (owner === user) {
        await _deleteRoom(key, owner);
        disconnectionEffects.destryedRooms.push({ owner, members });
      }
      if (members.includes(user)) {
        await _removeMember(key, user);
        disconnectionEffects.leftRooms.push({ members, owner });
      }
    }

    return disconnectionEffects;
  }
};

module.exports.getAllRooms = async function () {
  const roomKeys = await redis.keys("ROOM:*");
  const rooms = [];
  for (let key of roomKeys) {
    const data = await redis.send_command("JSON.get", key, ".");
    rooms.push(JSON.parse(data));
  }
  return rooms;
};
