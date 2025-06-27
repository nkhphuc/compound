import { Router } from 'express';
import {
  getUniqueLoaiHCValues,
  getUniqueTrangThaiValues,
  getUniqueMauValues
} from '../controllers/compoundController';

const router: Router = Router();

// GET /api/meta/loai-hc - Get all unique loaiHC values
router.get('/loai-hc', getUniqueLoaiHCValues);

// GET /api/meta/trang-thai - Get all unique trangThai values
router.get('/trang-thai', getUniqueTrangThaiValues);

// GET /api/meta/mau - Get all unique mau values
router.get('/mau', getUniqueMauValues);

export { router as metadataRoutes };
