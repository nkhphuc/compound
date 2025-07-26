import { Router } from 'express';
import {
  getUniqueLoaiHCValues,
  getUniqueTrangThaiValues,
  getUniqueMauValues,
  getUniqueNmrSolventValues
} from '../controllers/compoundController.js';

const router: Router = Router();

// GET /api/meta/loai-hc - Get all unique loaiHC values
router.get('/loai-hc', getUniqueLoaiHCValues);

// GET /api/meta/trang-thai - Get all unique trangThai values
router.get('/trang-thai', getUniqueTrangThaiValues);

// GET /api/meta/mau - Get all unique mau values
router.get('/mau', getUniqueMauValues);

// GET /api/meta/nmr-solvent - Get all unique NMR solvent values
router.get('/nmr-solvent', getUniqueNmrSolventValues);

export { router as metadataRoutes };
