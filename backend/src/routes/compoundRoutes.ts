import { Router } from 'express';
import {
  getAllCompounds,
  getCompoundById,
  createCompound,
  updateCompound,
  deleteCompound,
  getNextSttHC
} from '../controllers/compoundController';

const router = Router();

// GET /api/compounds - Get all compounds with pagination and search
router.get('/', getAllCompounds);

// GET /api/compounds/next-stt-hc - Get next available serial number
router.get('/next-stt-hc', getNextSttHC);

// GET /api/compounds/:id - Get compound by ID
router.get('/:id', getCompoundById);

// POST /api/compounds - Create new compound
router.post('/', createCompound);

// PUT /api/compounds/:id - Update compound
router.put('/:id', updateCompound);

// DELETE /api/compounds/:id - Delete compound
router.delete('/:id', deleteCompound);

export { router as compoundRoutes };
