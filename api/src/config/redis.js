const redis = require('redis');
require('dotenv').config();

let redisClient = null;

const initRedis = async () => {
  if (!process.env.REDIS_HOST) {
    console.warn('Redis not configured, caching disabled');
    return null;
  }

  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log('Redis connected successfully');
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { initRedis, getRedisClient };
