import sha1 from 'sha1'; // Library for hashing strings (used to hash passwords securely)
import { ObjectID } from 'mongodb'; // MongoDB ObjectID for handling document IDs
import Queue from 'bull'; // Task queue library for background job processing
import dbClient from '../utils/db'; // Database client utility for interacting with MongoDB
import redisClient from '../utils/redis'; // Redis client utility for caching and authentication

// Initialize a queue for handling background user-related tasks
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  // Handles user registration
  static postNew(request, response) {
    const { email } = request.body; // Extract email from the request body
    const { password } = request.body; // Extract password from the request body

    // Validate that email is provided
    if (!email) {
      response.status(400).json({ error: 'Missing email' });
      return;
    }

    // Validate that password is provided
    if (!password) {
      response.status(400).json({ error: 'Missing password' });
      return;
    }

    const users = dbClient.db.collection('users'); // Reference to the users collection in the database

    // Check if a user with the provided email already exists
    users.findOne({ email }, (err, user) => {
      if (user) {
        // If a user already exists, return an error response
        response.status(400).json({ error: 'Already exist' });
      } else {
        // Hash the password for secure storage
        const hashedPassword = sha1(password);

        // Insert the new user into the database
        users.insertOne(
          {
            email,
            password: hashedPassword,
          },
        ).then((result) => {
          // Respond with the newly created user ID and email
          response.status(201).json({ id: result.insertedId, email });

          // Add a background job to the user queue for further processing
          userQueue.add({ userId: result.insertedId });
        }).catch((error) => console.log(error)); // Log any errors during database insertion
      }
    });
  }

  // Handles retrieval of the current user's information based on authentication token
  static async getMe(request, response) {
    const token = request.header('X-Token'); // Extract authentication token from the request header
    const key = `auth_${token}`; // Construct the Redis key for the token
    const userId = await redisClient.get(key); // Retrieve the user ID associated with the token from Redis

    if (userId) {
      const users = dbClient.db.collection('users'); // Reference to the users collection in the database
      const idObject = new ObjectID(userId); // Convert the user ID to a MongoDB ObjectID

      // Find the user in the database by their ID
      users.findOne({ _id: idObject }, (err, user) => {
        if (user) {
          // If the user is found, return their ID and email
          response.status(200).json({ id: userId, email: user.email });
        } else {
          // If the user is not found, return an unauthorized error
          response.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      // If the token is not found in Redis, return an unauthorized error
      console.log('Hupatikani!'); // Log a message ("Not found" in Swahili)
      response.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = UsersController;
