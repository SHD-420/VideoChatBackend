const IORedis = require("ioredis");

const redisUser = "default";
const redisPassword = "Mg6bh6JCsZFXvAHpvjHwA6IflWJaZaOy";
const redisDB = "redis-17351.c1.ap-southeast-1-1.ec2.cloud.redislabs.com:17351";
const redisURL = `redis://${redisUser}:${redisPassword}@${redisDB}`;
const redis = new IORedis(redisURL);
module.exports.redis = redis;

module.exports.isRedisConnected = () => redis.status == "ready";
