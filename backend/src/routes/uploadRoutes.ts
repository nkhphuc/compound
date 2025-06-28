import { Router } from 'express';
import { uploadFile, uploadMultipleFiles } from '../controllers/uploadController';
import { validateFileUpload, validateMultipleFileUpload } from '../middleware/validation';

const router: Router = Router();

// POST /api/uploads - Upload a single file
router.post('/', validateFileUpload, (req, res, next) => { uploadFile(req, res).catch(next); });

// POST /api/uploads/multiple - Upload multiple files
router.post('/multiple', validateMultipleFileUpload, (req, res, next) => { uploadMultipleFiles(req, res).catch(next); });

export { router as uploadRoutes };
