import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';
import { validateFileUpload } from '../middleware/validation';

const router: Router = Router();

// POST /api/uploads - Upload a file
router.post('/', validateFileUpload, (req, res, next) => { uploadFile(req, res).catch(next); });

export { router as uploadRoutes };
