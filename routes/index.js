// Importing necessary modules
import { Router } from 'express'; // Express Router for route handling
import AppController from '../controllers/AppController'; // App-specific controller
import UsersController from '../controllers/UsersController'; // Users-related actions controller
import AuthController from '../controllers/AuthController'; // Authentication-related actions controller
import FilesController from '../controllers/FilesController'; // File handling actions controller

// Initialize the router object to handle routes
const router = Router();

// Route to check the status of the app (GET request)
router.get('/status', AppController.getStatus); // Calls getStatus method from AppController

// Route to retrieve app statistics (GET request)
router.get('/stats', AppController.getStats); // Calls getStats method from AppController

// Route to create a new user (POST request)
router.post('/users', UsersController.postNew); // Calls postNew method from UsersController to create a new user

// Route to authenticate and connect (GET request)
router.get('/connect', AuthController.getConnect); // Calls getConnect method from AuthController

// Route to disconnect or log out (GET request)
router.get('/disconnect', AuthController.getDisconnect); // Calls getDisconnect method from AuthController

// Route to get the currently authenticated user's information (GET request)
router.get('/users/me', UsersController.getMe); // Calls getMe method from UsersController to get user data

// Route to upload a file (POST request)
router.post('/files', FilesController.postUpload); // Calls postUpload method from FilesController to upload a file

// Route to get a specific file by its ID (GET request)
router.get('/files/:id', FilesController.getShow); // Calls getShow method from FilesController to retrieve a file by ID

// Route to get the list of all files (GET request)
router.get('/files', FilesController.getIndex); // Calls getIndex method from FilesController to list all files

// Route to publish a file by ID (PUT request)
router.put('/files/:id/publish', FilesController.putPublish); // Calls putPublish method from FilesController to publish a file

// Route to unpublish a file by ID (PUT request)
router.put('/files/:id/unpublish', FilesController.putUnpublish); // Calls putUnpublish method from FilesController to unpublish a file

// Route to get the data of a file by its ID (GET request)
router.get('/files/:id/data', FilesController.getFile); // Calls getFile method from FilesController to fetch the file data

// Export the router to be used in the main app
module.exports = router; // Exports the configured router
