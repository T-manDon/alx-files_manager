import { v4 as uuidv4 } from 'uuid'; // Generates unique identifiers
import { promises as fs } from 'fs'; // File system promises for asynchronous file handling
import { ObjectID } from 'mongodb'; // MongoDB ObjectID for handling document IDs
import mime from 'mime-types'; // MIME type handling for file content
import Queue from 'bull'; // Task queue library
import dbClient from '../utils/db'; // Database client utility
import redisClient from '../utils/redis'; // Redis client utility

// Initialize a queue for processing files
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  // Retrieves the user associated with the provided authentication token
  static async getUser(request) {
    const token = request.header('X-Token'); // Extracts the token from the request header
    const key = `auth_${token}`;
    const userId = await redisClient.get(key); // Fetches user ID from Redis
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);
      const user = await users.findOne({ _id: idObject }); // Finds the user in the database
      return user || null;
    }
    return null;
  }

  // Handles file upload requests
  static async postUpload(request, response) {
    const user = await FilesController.getUser(request); // Authenticate the user
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Extract file data from the request body
    const { name, type, parentId, data } = request.body;
    const isPublic = request.body.isPublic || false;

    // Validate request data
    if (!name) return response.status(400).json({ error: 'Missing name' });
    if (!type) return response.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return response.status(400).json({ error: 'Missing data' });

    const files = dbClient.db.collection('files');

    // Validate parent folder if specified
    if (parentId) {
      const idObject = new ObjectID(parentId);
      const file = await files.findOne({ _id: idObject, userId: user._id });
      if (!file) return response.status(400).json({ error: 'Parent not found' });
      if (file.type !== 'folder') return response.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      // Create a new folder entry in the database
      files.insertOne({ userId: user._id, name, type, parentId: parentId || 0, isPublic })
        .then((result) => response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        }))
        .catch(console.log);
    } else {
      // Save non-folder files to the file system
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');

      try {
        await fs.mkdir(filePath, { recursive: true }); // Ensure the directory exists
        await fs.writeFile(fileName, buff, 'utf-8'); // Write the file to disk
      } catch (error) {
        console.log(error);
      }

      // Insert file metadata into the database
      files.insertOne({
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
        localPath: fileName,
      }).then((result) => {
        response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
        if (type === 'image') {
          fileQueue.add({ userId: user._id, fileId: result.insertedId }); // Add image to processing queue
        }
      }).catch(console.log);
    }
  }

  // Retrieve metadata for a specific file
  static async getShow(request, response) {
    const user = await FilesController.getUser(request); // Authenticate the user
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const fileId = request.params.id; // Extract the file ID from request parameters
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(fileId);
    const file = await files.findOne({ _id: idObject, userId: user._id }); // Query for the file

    if (!file) return response.status(404).json({ error: 'Not found' });
    return response.status(200).json(file); // Return the file metadata
  }

  // Retrieves a paginated list of files for a user
  static async getIndex(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const { parentId, page = 0 } = request.query; // Extract query parameters
    const query = parentId ? { userId: user._id, parentId: ObjectID(parentId) } : { userId: user._id };

    const files = dbClient.db.collection('files');
    files.aggregate([
      { $match: query },
      { $sort: { _id: -1 } },
      { $facet: { 
          metadata: [{ $count: 'total' }, { $addFields: { page: parseInt(page, 10) } }],
          data: [{ $skip: 20 * parseInt(page, 10) }, { $limit: 20 }],
        } 
      }
    ]).toArray((err, result) => {
      if (result) {
        const final = result[0].data.map((file) => ({
          ...file,
          id: file._id,
          localPath: undefined, // Hide the local path
        }));
        return response.status(200).json(final);
      }
      return response.status(404).json({ error: 'Not found' });
    });
  }

  // Makes a file publicly accessible
  static async putPublish(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const idObject = new ObjectID(request.params.id);
    const files = dbClient.db.collection('files');
    files.findOneAndUpdate(
      { _id: idObject, userId: user._id },
      { $set: { isPublic: true } },
      { returnOriginal: false },
      (err, file) => {
        if (!file.lastErrorObject.updatedExisting) return response.status(404).json({ error: 'Not found' });
        return response.status(200).json(file.value);
      }
    );
  }

  // Makes a file private
  static async putUnpublish(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const idObject = new ObjectID(request.params.id);
    const files = dbClient.db.collection('files');
    files.findOneAndUpdate(
      { _id: idObject, userId: user._id },
      { $set: { isPublic: false } },
      { returnOriginal: false },
      (err, file) => {
        if (!file.lastErrorObject.updatedExisting) return response.status(404).json({ error: 'Not found' });
        return response.status(200).json(file.value);
      }
    );
  }

  // Retrieves the actual content of a file
  static async getFile(request, response) {
    const { id } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);

    files.findOne({ _id: idObject }, async (err, file) => {
      if (!file) return response.status(404).json({ error: 'Not found' });

      if (file.isPublic) {
        if (file.type === 'folder') return response.status(400).json({ error: "A folder doesn't have content" });
        try {
          const data = await fs.readFile(file.localPath);
          return response.header('Content-Type', mime.contentType(file.name)).status(200).send(data);
        } catch {
          return response.status(404).json({ error: 'Not found' });
        }
      }

      const user = await FilesController.getUser(request);
      if (!user || file.userId.toString() !== user._id.toString()) return response.status(404).json({ error: 'Not found' });

      if (file.type === 'folder') return response.status(400).json({ error: "A folder doesn't have content" });

      try {
        const data = await fs.readFile(file.localPath);
        return response.header('Content-Type', mime.contentType(file.name)).status(200).send(data);
      } catch {
        return response.status(404).json({ error: 'Not found' });
      }
    });
  }
}

module.exports = FilesController;
