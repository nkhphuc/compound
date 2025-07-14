import { Router } from 'express';
import {
  getAllCompounds,
  getCompoundById,
  createCompound,
  updateCompound,
  deleteCompound,
  getNextSttHC,
  getNextSttBang,
} from '../controllers/compoundController.js';
import {
  validateCompound,
  validateQueryParams,
  validateId
} from '../middleware/validation.js';

const router: Router = Router();

// GET /api/compounds - Get all compounds with pagination and search
router.get('/', validateQueryParams, (req, res, next) => { getAllCompounds(req, res).catch(next); });

// GET /api/compounds/next-stt-hc - Get next available serial number
router.get('/next-stt-hc', (req, res, next) => { getNextSttHC(req, res).catch(next); });

// GET /api/compounds/next-stt-bang - Get next available table number
router.get('/next-stt-bang', (req, res, next) => { getNextSttBang(req, res).catch(next); });

// GET /api/compounds/:id - Get compound by ID
router.get('/:id', validateId, (req, res, next) => { getCompoundById(req, res).catch(next); });

// POST /api/compounds - Create new compound
router.post('/', validateCompound, (req, res, next) => { createCompound(req, res).catch(next); });

// PUT /api/compounds/:id - Update compound
router.put('/:id', validateId, validateCompound, (req, res, next) => { updateCompound(req, res).catch(next); });

// DELETE /api/compounds/:id - Delete compound
router.delete('/:id', validateId, (req, res, next) => { deleteCompound(req, res).catch(next); });

export { router as compoundRoutes };
