import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';

const router: Router = Router();

// POST /api/uploads - Upload a file
router.post('/', (req, res, next) => { uploadFile(req, res).catch(next); });

export { router as uploadRoutes };
