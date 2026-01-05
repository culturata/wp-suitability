const redis = require('redis');
require('dotenv').config();

let redisClient = null;

const initRedis = async () => {
  if (!process.env.REDIS_HOST) {
    console.warn('⚠️  Redis not configured, caching disabled');
    return null;
  }

  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: false // Disable automatic reconnection
      },
      password: process.env.REDIS_PASSWORD || undefined
    });

    // Only log the first error, then suppress
    let errorLogged = false;
    redisClient.on('error', (err) => {
      if (!errorLogged) {
        console.warn('⚠️  Redis connection failed (caching disabled)');
        errorLogged = true;
      }
    });

    await redisClient.connect();
    console.log('✅ Redis connected successfully');
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis connection failed (caching disabled)');
    console.warn('   Landing page and API will still work');
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { initRedis, getRedisClient };
