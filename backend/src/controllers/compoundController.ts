import { Request, Response } from 'express';
import { CompoundService } from '../services/compoundService.js';

const compoundService = new CompoundService();

export const getAllCompounds = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerm = req.query.searchTerm as string || '';

    const result = await compoundService.getCompounds({ page, limit, searchTerm });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting compounds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compounds'
    });
  }
};

export const getCompoundById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const compound = await compoundService.getCompoundById(id);

    if (!compound) {
      return res.status(404).json({
        success: false,
        error: 'Compound not found'
      });
    }

    res.json({
      success: true,
      data: compound
    });
  } catch (error) {
    console.error('Error getting compound by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compound'
    });
  }
};

export const createCompound = async (req: Request, res: Response) => {
  try {
    const compoundData = req.body;
    const newCompound = await compoundService.createCompound(compoundData);

    res.status(201).json({
      success: true,
      data: newCompound
    });
  } catch (error) {
    console.error('Error creating compound:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create compound'
    });
  }
};

export const updateCompound = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const compoundData = req.body;

    const updatedCompound = await compoundService.updateCompound(id, compoundData);

    if (!updatedCompound) {
      return res.status(404).json({
        success: false,
        error: 'Compound not found'
      });
    }

    res.json({
      success: true,
      data: updatedCompound
    });
  } catch (error) {
    console.error('Error updating compound:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update compound'
    });
  }
};

export const deleteCompound = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await compoundService.deleteCompound(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Compound not found'
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting compound:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete compound'
    });
  }
};

export const getNextSttHC = async (req: Request, res: Response) => {
  try {
    const nextSttHC = await compoundService.getNextSttHC();

    res.json({
      success: true,
      data: { nextSttHC }
    });
  } catch (error) {
    console.error('Error getting next SttHC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next SttHC'
    });
  }
};

export const getNextSttBang = async (req: Request, res: Response) => {
  try {
    const nextSttBang = await compoundService.getNextSttBang();

    res.json({
      success: true,
      data: { nextSttBang }
    });
  } catch (error) {
    console.error('Error getting next SttBang:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next SttBang'
    });
  }
};

// Metadata endpoints for dropdown values
export const getUniqueLoaiHCValues = async (req: Request, res: Response) => {
  try {
    const values = await compoundService.getUniqueLoaiHCValues();

    res.json({
      success: true,
      data: values
    });
  } catch (error) {
    console.error('Error getting unique loaiHC values:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unique loaiHC values'
    });
  }
};

export const getUniqueTrangThaiValues = async (req: Request, res: Response) => {
  try {
    const values = await compoundService.getUniqueTrangThaiValues();

    res.json({
      success: true,
      data: values
    });
  } catch (error) {
    console.error('Error getting unique trangThai values:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unique trangThai values'
    });
  }
};

export const getUniqueMauValues = async (req: Request, res: Response) => {
  try {
    const values = await compoundService.getUniqueMauValues();

    res.json({
      success: true,
      data: values
    });
  } catch (error) {
    console.error('Error getting unique mau values:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unique mau values'
    });
  }
};
