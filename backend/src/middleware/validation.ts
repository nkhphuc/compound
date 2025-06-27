import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Validation schemas that mirror frontend validation exactly

// UVSKLM data validation (boolean fields)
const uvSklmSchema = Joi.object({
  nm254: Joi.boolean().default(false),
  nm365: Joi.boolean().default(false)
}).default({ nm254: false, nm365: false });

// NMR Signal validation
const nmrSignalSchema = Joi.object({
  id: Joi.string().optional(),
  viTri: Joi.string().allow('').default(''),
  scab: Joi.string().allow('').default(''),
  shacJHz: Joi.string().allow('').default('')
});

// NMR Condition validation
const nmrConditionSchema = Joi.object({
  id: Joi.string().optional(),
  dmNMR: Joi.string().allow('').default(''),
  tanSo13C: Joi.string().allow('').default(''),
  tanSo1H: Joi.string().allow('').default('')
});

// NMR Data Block validation
const nmrDataBlockSchema = Joi.object({
  id: Joi.string().optional(),
  sttBang: Joi.string().allow('').default(''),
  nmrConditions: nmrConditionSchema.default({}),
  signals: Joi.array().items(nmrSignalSchema).default([]),
  luuYNMR: Joi.string().allow('').default(''),
  tltkNMR: Joi.string().allow('').default('')
});

// Spectral Record validation (all fields are optional strings)
const spectralRecordSchema = Joi.object({
  '1h': Joi.string().allow('').default(''),
  '13c': Joi.string().allow('').default(''),
  dept: Joi.string().allow('').default(''),
  hsqc: Joi.string().allow('').default(''),
  hmbc: Joi.string().allow('').default(''),
  cosy: Joi.string().allow('').default(''),
  noesy: Joi.string().allow('').default(''),
  roesy: Joi.string().allow('').default(''),
  hrms: Joi.string().allow('').default(''),
  lrms: Joi.string().allow('').default(''),
  ir: Joi.string().allow('').default(''),
  uv_pho: Joi.string().allow('').default(''),
  cd: Joi.string().allow('').default('')
}).default({});

// URL validation helper
const urlValidation = (value: string) => {
  if (!value || value === '') return true; // Empty is allowed
  return value.startsWith('http');
};

// Main compound validation schema - mirrors frontend validation exactly
export const compoundValidationSchema = Joi.object({
  // ID is optional for creation, required for updates
  id: Joi.string().optional(),

  // Required fields (mirror frontend validation)
  tenHC: Joi.string().trim().required().messages({
    'string.empty': 'Compound Name is required.',
    'any.required': 'Compound Name is required.'
  }),

  status: Joi.string().valid('Mới', 'Đã biết', '').required().messages({
    'any.only': 'Status must be one of: Mới, Đã biết',
    'any.required': 'Compound Status is required.'
  }),

  loaiHC: Joi.string().trim().required().messages({
    'string.empty': 'Compound Type is required.',
    'any.required': 'Compound Type is required.'
  }),

  trangThai: Joi.string().trim().required().messages({
    'string.empty': 'State/Phase is required.',
    'any.required': 'State/Phase is required.'
  }),

  mau: Joi.string().trim().required().messages({
    'string.empty': 'Color is required.',
    'any.required': 'Color is required.'
  }),

  // Optional fields
  sttHC: Joi.number().integer().min(0).default(0),
  tenHCKhac: Joi.string().allow('', null).default(''),
  tenLatin: Joi.string().allow('', null).default(''),
  tenTA: Joi.string().allow('', null).default(''),
  tenTV: Joi.string().allow('', null).default(''),
  bpnc: Joi.string().allow('', null).default(''),
  diemNongChay: Joi.string().allow('', null).default(''),
  alphaD: Joi.string().allow('', null).default(''),
  dungMoiHoaTanTCVL: Joi.string().allow('', null).default(''),
  ctpt: Joi.string().allow('').default(''),
  klpt: Joi.string().allow('', null).default(''),
  smiles: Joi.string().allow('', null).default(''),
  dmNMRGeneral: Joi.string().allow('', null).default(''),
  cartCoor: Joi.string().allow('', null).default(''),
  imgFreq: Joi.string().allow('', null).default(''),
  te: Joi.string().allow('', null).default(''),

  // Boolean fields (mirror frontend validation)
  cauHinhTuyetDoi: Joi.boolean().default(false),
  uvSklm: uvSklmSchema,

  // URL validation for structure image (mirror frontend validation)
  hinhCauTruc: Joi.string().custom((value, helpers) => {
    if (!urlValidation(value)) {
      return helpers.error('any.invalid', { message: 'Please enter a valid HTTP/S URL for the image.' });
    }
    return value;
  }).allow('').default(''),

  // Spectral data validation (mirror frontend validation)
  pho: spectralRecordSchema,

  // NMR data validation
  nmrData: nmrDataBlockSchema.default({})
});

// Validation middleware
export const validateCompound = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = compoundValidationSchema.validate(req.body, {
    abortEarly: false, // Return all validation errors
    allowUnknown: true, // Allow unknown fields (they'll be ignored)
    stripUnknown: true  // Remove unknown fields
  });

  if (error) {
    const errorMessages: Record<string, string> = {};

    error.details.forEach((detail) => {
      const field = detail.path.join('.');
      errorMessages[field] = detail.message;
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      validationErrors: errorMessages
    });
    return;
  }

  // Replace req.body with validated data
  req.body = value;
  next();
};

// Query parameter validation for pagination and search
export const validateQueryParams = (req: Request, res: Response, next: NextFunction): void => {
  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    searchTerm: Joi.string().allow('').default('')
  });

  const { error, value } = querySchema.validate(req.query, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      validationErrors: error.details.map(detail => detail.message)
    });
    return;
  }

  req.query = value;
  next();
};

// ID parameter validation
export const validateId = (req: Request, res: Response, next: NextFunction): void => {
  const idSchema = Joi.object({
    id: Joi.string().uuid().required()
  });

  const { error } = idSchema.validate({ id: req.params.id });

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
    return;
  }

  next();
};

// File upload validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
    return;
  }

  const uploadedFile = req.files.file as any;
  if (Array.isArray(uploadedFile)) {
    res.status(400).json({
      success: false,
      error: 'Only single file uploads are supported'
    });
    return;
  }

  // File size validation (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (uploadedFile.size > maxSize) {
    res.status(400).json({
      success: false,
      error: 'File size exceeds 50MB limit'
    });
    return;
  }

  // File type validation (images and documents)
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
    res.status(400).json({
      success: false,
      error: 'File type not allowed. Please upload images, PDFs, or documents.'
    });
    return;
  }

  next();
};
