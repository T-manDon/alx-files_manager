import { MongoClient } from 'mongodb';

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || 27017;
const DATABASE = process.env.DB_DATABASE || 'files_manager';

const url = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
    this.db = null;
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(DATABASE);
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  isAlive() {
    return this.client.topology && this.client.topology.isConnected();
  }

  async nbUsers() {
    if (!this.db) return 0;
    const users = this.db.collection('users');
    return users.countDocuments();
  }

  async nbFiles() {
    if (!this.db) return 0;
    const files = this.db.collection('files');
    return files.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;

