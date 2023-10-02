const IORedis = require("ioredis");
const { env } = require("../../.");

const redisURL = `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`;
const redis = new IORedis(redisURL);

module.exports.redis = redis;

module.exports.isRedisConnected = () => redis.status == "ready";
