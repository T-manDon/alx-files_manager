import { createClient } from 'redis';
import { promisify } from 'util';

// this class defines the redis comands often used

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.log(`Redis client not connected to server: ${error}`);
    });
  }

  // this function checks the connection and gives feedback
  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  // acquire value from the key
  async get(key) {
    const redisGet = promisify(this.client.get).bind(this.client);
    const value = await redisGet(key);
    return value;
  }

  // align the key values to redis server
  async set(key, value, time) {
    const redisSet = promisify(this.client.set).bind(this.client);
    await redisSet(key, value);
    await this.client.expire(key, time);
  }

  //this function deletes the keys from the redis server
  async del(key) {
    const redisDel = promisify(this.client.del).bind(this.client);
    await redisDel(key);
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
