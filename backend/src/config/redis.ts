import { createClient } from 'redis';
import { env } from './env.config';

export const redisClient = createClient({
    username: 'default',
    password: env.REDIS_PASSWORD,
    socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

(async () => {
    await redisClient.connect();
    console.log('Redis connected');
})()
