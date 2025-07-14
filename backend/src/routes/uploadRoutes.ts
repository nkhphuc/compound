import { Router } from 'express';
import { uploadFile, uploadMultipleFiles, deleteFile } from '../controllers/uploadController.js';
import { validateFileUpload, validateMultipleFileUpload } from '../middleware/validation.js';

const router: Router = Router();

// POST /api/uploads - Upload a single file
router.post('/', validateFileUpload, (req, res, next) => { uploadFile(req, res).catch(next); });

// POST /api/uploads/multiple - Upload multiple files
router.post('/multiple', validateMultipleFileUpload, (req, res, next) => { uploadMultipleFiles(req, res).catch(next); });

// DELETE /api/uploads - Delete a file
router.delete('/', (req, res, next) => { deleteFile(req, res).catch(next); });

export { router as uploadRoutes };
