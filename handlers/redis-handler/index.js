const IORedis = require("ioredis");

const redisUser = "default";
const redisPassword = "wonJBdaIL334zXrbShTobRla6cxAOtpk";
const redisDB = "redis-12923.c1.ap-southeast-1-1.ec2.cloud.redislabs.com:12923";
const redisURL = `redis://${redisUser}:${redisPassword}@${redisDB}`;
const redis = new IORedis(redisURL);
module.exports.redis = redis;

module.exports.isRedisConnected = () => redis.status == "ready";
