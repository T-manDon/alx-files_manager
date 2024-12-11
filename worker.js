// Importing necessary modules
import Queue from 'bull'; // Queue library for handling background job processing with Redis
import imageThumbnail from 'image-thumbnail'; // Image processing library to generate thumbnails
import { promises as fs } from 'fs'; // Using promises-based fs module for file system operations
import { ObjectID } from 'mongodb'; // MongoDB ObjectID for database operations
import dbClient from './utils/db'; // Database client for connecting to MongoDB

// Initialize two Redis-backed job queues: one for file processing, one for user-related tasks
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379'); // Queue for file jobs
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379'); // Queue for user jobs

// Helper function to generate a thumbnail for a given image at a specific width
async function thumbNail(width, localPath) {
  const thumbnail = await imageThumbnail(localPath, { width }); // Create thumbnail with given width
  return thumbnail; // Return the thumbnail data
}

// Process jobs for fileQueue: Handle file-related processing (thumbnail generation)
fileQueue.process(async (job, done) => {
  console.log('Processing...'); // Log when processing starts

  const { fileId } = job.data; // Retrieve fileId from the job data
  if (!fileId) {
    done(new Error('Missing fileId')); // If fileId is missing, throw an error
  }

  const { userId } = job.data; // Retrieve userId from the job data
  if (!userId) {
    done(new Error('Missing userId')); // If userId is missing, throw an error
  }

  console.log(fileId, userId); // Log the fileId and userId

  // Access MongoDB collection for files
  const files = dbClient.db.collection('files');
  const idObject = new ObjectID(fileId); // Convert fileId to MongoDB ObjectID
  files.findOne({ _id: idObject }, async (err, file) => {
    if (!file) {
      console.log('Not found'); // Log if file is not found in the database
      done(new Error('File not found')); // Throw an error if file not found
    } else {
      const fileName = file.localPath; // Get the local path of the file

      // Generate thumbnails with different widths (500px, 250px, 100px)
      const thumbnail500 = await thumbNail(500, fileName);
      const thumbnail250 = await thumbNail(250, fileName);
      const thumbnail100 = await thumbNail(100, fileName);

      console.log('Writing files to system'); // Log that the thumbnails are being written

      // Define file paths for the thumbnails
      const image500 = `${file.localPath}_500`;
      const image250 = `${file.localPath}_250`;
      const image100 = `${file.localPath}_100`;

      // Write the thumbnail images to the file system
      await fs.writeFile(image500, thumbnail500);
      await fs.writeFile(image250, thumbnail250);
      await fs.writeFile(image100, thumbnail100);

      done(); // Mark the job as done
    }
  });
});

// Process jobs for userQueue: Handle user-related tasks (e.g., logging user activity)
userQueue.process(async (job, done) => {
  const { userId } = job.data; // Retrieve userId from the job data
  if (!userId) done(new Error('Missing userId')); // If userId is missing, throw an error

  // Access MongoDB collection for users
  const users = dbClient.db.collection('users');
  const idObject = new ObjectID(userId); // Convert userId to MongoDB ObjectID
  const user = await users.findOne({ _id: idObject }); // Find user in the database

  if (user) {
    console.log(`Welcome ${user.email}!`); // Log a welcome message if the user is found
  } else {
    done(new Error('User not found')); // If the user is not found, throw an error
  }
});
