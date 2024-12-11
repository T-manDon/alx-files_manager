import redisClient from '../utils/redis'; // Utility for interacting with Redis, used to check Redis status.
import dbClient from '../utils/db'; // Utility for interacting with the database, used to check DB status and statistics.

class AppController {
  // Method to get the status of the application by checking Redis and DB connections
  static getStatus(request, response) {
    response.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  // Method to get statistics from the database: number of users and files
  static async getStats(request, response) {
    const usersNum = await dbClient.nbUsers(); // Fetches the total number of users in the database
    const filesNum = await dbClient.nbFiles(); // Fetches the total number of files in the database
    response.status(200).json({ users: usersNum, files: filesNum });
  }
}

module.exports = AppController; // Exports the AppController class for use in other routes or modules.
