import sha1 from 'sha1'; // Module to hash passwords securely
import { v4 as uuidv4 } from 'uuid'; // Generates unique identifiers for authentication tokens
import dbClient from '../utils/db'; // Database client utility
import redisClient from '../utils/redis'; // Redis client utility

class AuthController {
  // Handles user authentication and token generation
  static async getConnect(request, response) {
    const authData = request.header('Authorization'); // Retrieves the Authorization header
    if (!authData) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Decodes Base64-encoded email and password
    let userEmail = authData.split(' ')[1];
    const buff = Buffer.from(userEmail, 'base64');
    userEmail = buff.toString('ascii');
    const data = userEmail.split(':'); // Splits email and password

    if (data.length !== 2) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hashedPassword = sha1(data[1]); // Hashes the password using SHA-1
    const users = dbClient.db.collection('users'); // Access the 'users' collection in the database

    // Searches for a user with the provided email and hashed password
    users.findOne({ email: data[0], password: hashedPassword }, async (err, user) => {
      if (user) {
        // Generates a unique token and stores it in Redis with an expiration of 24 hours
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24);

        response.status(200).json({ token }); // Responds with the token
      } else {
        response.status(401).json({ error: 'Unauthorized' }); // Unauthorized response if user not found
      }
    });
  }

  // Handles user logout by removing the authentication token from Redis
  static async getDisconnect(request, response) {
    const token = request.header('X-Token'); // Retrieves the token from the X-Token header
    const key = `auth_${token}`;
    const id = await redisClient.get(key); // Checks if the token exists in Redis

    if (id) {
      await redisClient.del(key); // Deletes the token from Redis
      response.status(204).json({}); // Responds with no content on successful logout
    } else {
      response.status(401).json({ error: 'Unauthorized' }); // Unauthorized response if token not found
    }
  }
}

module.exports = AuthController; // Exports the AuthController class for use in routing
