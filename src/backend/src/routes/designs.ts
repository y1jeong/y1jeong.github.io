import express, { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate, optionalAuth, requireOwnership } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AppError, ValidationError, NotFoundError } from '@/middleware/errorHandler';
import { Design, IDesign } from '@/models/Design';
import { logger } from '@/utils/logger';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for design operations
const designLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many design requests, please try again later',
    retryAfter: 15 * 60
  }
});

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 creates per hour
  message: {
    error: 'Too many design creation attempts, please try again later',
    retryAfter: 60 * 60
  }
});

/**
 * @route   POST /api/designs
 * @desc    Create a new design
 * @access  Private
 */
router.post('/', createLimiter, authenticate, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Design name must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('panelSize').isObject().withMessage('Panel size is required'),
  body('panelSize.width').isFloat({ min: 1, max: 120 }).withMessage('Panel width must be between 1 and 120 inches'),
  body('panelSize.height').isFloat({ min: 1, max: 120 }).withMessage('Panel height must be between 1 and 120 inches'),
  body('perforationSettings').isObject().withMessage('Perforation settings are required'),
  body('perforationSettings.minSize').isFloat({ min: 0.0625, max: 6 }).withMessage('Minimum size must be between 1/16 and 6 inches'),
  body('perforationSettings.maxSize').isFloat({ min: 0.0625, max: 6 }).withMessage('Maximum size must be between 1/16 and 6 inches'),
  body('perforationSettings.shape').isIn(['circle', 'square', 'rectangle', 'hexagon', 'triangle', 'custom']).withMessage('Invalid shape'),
  body('perforationSettings.pattern').isIn(['grid', 'staggered', 'random', 'radial', 'custom']).withMessage('Invalid pattern'),
  body('perforationSettings.spacing').isObject().withMessage('Spacing settings are required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ min: 1, max: 30 }).withMessage('Each tag must be between 1 and 30 characters')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const {
    name,
    description,
    panelSize,
    perforationSettings,
    imageProcessingSettings,
    exportSettings,
    tags,
    isPublic = false
  } = req.body;
  
  // Validate that maxSize >= minSize
  if (perforationSettings.maxSize < perforationSettings.minSize) {
    throw new ValidationError('Maximum size must be greater than or equal to minimum size');
  }
  
  logger.info('Design creation started', {
    name,
    userId: req.user!.id,
    panelSize,
    perforationSettings
  });
  
  try {
    const design = new Design({
      name,
      description,
      userId: req.user!.id,
      panelSize,
      perforationSettings,
      imageProcessingSettings: imageProcessingSettings || {},
      exportSettings: exportSettings || {},
      tags: tags || [],
      isPublic,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        status: 'draft'
      }
    });
    
    await design.save();
    
    logger.info('Design created successfully', {
      designId: design._id,
      name,
      userId: req.user!.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Design created successfully',
      data: design
    });
  } catch (error) {
    logger.error('Design creation failed', error as Error, {
      name,
      userId: req.user!.id
    });
    throw error;
  }
}));

/**
 * @route   GET /api/designs
 * @desc    Get user's designs with pagination and filtering
 * @access  Private
 */
router.get('/', designLimiter, authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters'),
  query('tags').optional().isString().withMessage('Tags must be a comma-separated string'),
  query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt', 'views', 'downloads']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const {
    page = 1,
    limit = 20,
    search,
    tags,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    status
  } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;
  
  // Build query
  const query: any = { userId: req.user!.id };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search as string, 'i')] } }
    ];
  }
  
  if (tags) {
    const tagArray = (tags as string).split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }
  
  if (status) {
    query['metadata.status'] = status;
  }
  
  // Build sort
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  try {
    const [designs, total] = await Promise.all([
      Design.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-perforationData -exportData') // Exclude large data fields
        .lean(),
      Design.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limitNum);
    
    logger.info('Designs retrieved', {
      userId: req.user!.id,
      total,
      page: pageNum,
      limit: limitNum
    });
    
    res.json({
      success: true,
      data: {
        designs,
        pagination: {
          current: pageNum,
          total: totalPages,
          limit: limitNum,
          totalItems: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve designs', error as Error, {
      userId: req.user!.id,
      query: req.query
    });
    throw error;
  }
}));

/**
 * @route   GET /api/designs/public
 * @desc    Get public designs
 * @access  Public
 */
router.get('/public', designLimiter, optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters'),
  query('tags').optional().isString().withMessage('Tags must be a comma-separated string'),
  query('sortBy').optional().isIn(['name', 'createdAt', 'views', 'downloads']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const {
    page = 1,
    limit = 20,
    search,
    tags,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;
  
  // Build query for public designs
  const query: any = { 
    isPublic: true,
    'metadata.status': 'published'
  };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search as string, 'i')] } }
    ];
  }
  
  if (tags) {
    const tagArray = (tags as string).split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }
  
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  try {
    const [designs, total] = await Promise.all([
      Design.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-perforationData -exportData -userId') // Exclude sensitive data
        .populate('userId', 'firstName lastName')
        .lean(),
      Design.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      success: true,
      data: {
        designs,
        pagination: {
          current: pageNum,
          total: totalPages,
          limit: limitNum,
          totalItems: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve public designs', error as Error, {
      query: req.query
    });
    throw error;
  }
}));

/**
 * @route   GET /api/designs/:id
 * @desc    Get design by ID
 * @access  Private (owner) or Public (if public design)
 */
router.get('/:id', designLimiter, optionalAuth, [
  param('id').isMongoId().withMessage('Invalid design ID')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { id } = req.params;
  
  try {
    const design = await Design.findById(id).populate('userId', 'firstName lastName');
    
    if (!design) {
      throw new NotFoundError('Design not found');
    }
    
    // Check access permissions
    const isOwner = req.user && design.userId.toString() === req.user.id;
    const isPublic = design.isPublic && design.metadata.status === 'published';
    
    if (!isOwner && !isPublic) {
      throw new NotFoundError('Design not found');
    }
    
    // Increment view count if not owner
    if (!isOwner) {
      await design.incrementViews();
    }
    
    logger.info('Design retrieved', {
      designId: id,
      userId: req.user?.id,
      isOwner,
      isPublic
    });
    
    res.json({
      success: true,
      data: design
    });
  } catch (error) {
    logger.error('Failed to retrieve design', error as Error, {
      designId: id,
      userId: req.user?.id
    });
    throw error;
  }
}));

/**
 * @route   PUT /api/designs/:id
 * @desc    Update design
 * @access  Private (owner only)
 */
router.put('/:id', designLimiter, authenticate, [
  param('id').isMongoId().withMessage('Invalid design ID'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Design name must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('panelSize').optional().isObject().withMessage('Panel size must be an object'),
  body('perforationSettings').optional().isObject().withMessage('Perforation settings must be an object'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ min: 1, max: 30 }).withMessage('Each tag must be between 1 and 30 characters')
], requireOwnership(Design), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { id } = req.params;
  const updateData = req.body;
  
  // Remove fields that shouldn't be updated directly
  delete updateData.userId;
  delete updateData.metadata;
  delete updateData.statistics;
  
  // Validate perforation settings if provided
  if (updateData.perforationSettings) {
    const { minSize, maxSize } = updateData.perforationSettings;
    if (minSize !== undefined && maxSize !== undefined && maxSize < minSize) {
      throw new ValidationError('Maximum size must be greater than or equal to minimum size');
    }
  }
  
  logger.info('Design update started', {
    designId: id,
    userId: req.user!.id,
    updateFields: Object.keys(updateData)
  });
  
  try {
    const design = await Design.findById(id);
    
    if (!design) {
      throw new NotFoundError('Design not found');
    }
    
    // Create new version if significant changes
    const significantFields = ['panelSize', 'perforationSettings', 'imageProcessingSettings'];
    const hasSignificantChanges = significantFields.some(field => updateData[field]);
    
    if (hasSignificantChanges) {
      await design.createVersion();
    }
    
    // Update design
    Object.assign(design, updateData);
    design.metadata.updatedAt = new Date();
    
    await design.save();
    
    logger.info('Design updated successfully', {
      designId: id,
      userId: req.user!.id,
      version: design.metadata.version
    });
    
    res.json({
      success: true,
      message: 'Design updated successfully',
      data: design
    });
  } catch (error) {
    logger.error('Design update failed', error as Error, {
      designId: id,
      userId: req.user!.id
    });
    throw error;
  }
}));

/**
 * @route   DELETE /api/designs/:id
 * @desc    Delete design
 * @access  Private (owner only)
 */
router.delete('/:id', designLimiter, authenticate, [
  param('id').isMongoId().withMessage('Invalid design ID')
], requireOwnership(Design), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { id } = req.params;
  
  logger.info('Design deletion started', {
    designId: id,
    userId: req.user!.id
  });
  
  try {
    const design = await Design.findById(id);
    
    if (!design) {
      throw new NotFoundError('Design not found');
    }
    
    await design.deleteOne();
    
    logger.info('Design deleted successfully', {
      designId: id,
      userId: req.user!.id
    });
    
    res.json({
      success: true,
      message: 'Design deleted successfully'
    });
  } catch (error) {
    logger.error('Design deletion failed', error as Error, {
      designId: id,
      userId: req.user!.id
    });
    throw error;
  }
}));

/**
 * @route   POST /api/designs/:id/duplicate
 * @desc    Duplicate design
 * @access  Private
 */
router.post('/:id/duplicate', createLimiter, authenticate, [
  param('id').isMongoId().withMessage('Invalid design ID'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Design name must be between 1 and 100 characters')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { id } = req.params;
  const { name } = req.body;
  
  try {
    const originalDesign = await Design.findById(id);
    
    if (!originalDesign) {
      throw new NotFoundError('Design not found');
    }
    
    // Check if user can access this design
    const isOwner = originalDesign.userId.toString() === req.user!.id;
    const isPublic = originalDesign.isPublic && originalDesign.metadata.status === 'published';
    
    if (!isOwner && !isPublic) {
      throw new NotFoundError('Design not found');
    }
    
    // Create duplicate
    const duplicateData = originalDesign.toObject();
    delete duplicateData._id;
    delete duplicateData.__v;
    
    const duplicate = new Design({
      ...duplicateData,
      name: name || `${originalDesign.name} (Copy)`,
      userId: req.user!.id,
      isPublic: false, // Duplicates are private by default
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        status: 'draft',
        originalDesignId: originalDesign._id
      },
      statistics: {
        views: 0,
        downloads: 0,
        likes: 0
      }
    });
    
    await duplicate.save();
    
    logger.info('Design duplicated successfully', {
      originalId: id,
      duplicateId: duplicate._id,
      userId: req.user!.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Design duplicated successfully',
      data: duplicate
    });
  } catch (error) {
    logger.error('Design duplication failed', error as Error, {
      designId: id,
      userId: req.user!.id
    });
    throw error;
  }
}));

/**
 * @route   POST /api/designs/:id/publish
 * @desc    Publish design (make public)
 * @access  Private (owner only)
 */
router.post('/:id/publish', designLimiter, authenticate, [
  param('id').isMongoId().withMessage('Invalid design ID')
], requireOwnership(Design), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { id } = req.params;
  
  try {
    const design = await Design.findById(id);
    
    if (!design) {
      throw new NotFoundError('Design not found');
    }
    
    design.isPublic = true;
    design.metadata.status = 'published';
    design.metadata.publishedAt = new Date();
    design.metadata.updatedAt = new Date();
    
    await design.save();
    
    logger.info('Design published successfully', {
      designId: id,
      userId: req.user!.id
    });
    
    res.json({
      success: true,
      message: 'Design published successfully',
      data: design
    });
  } catch (error) {
    logger.error('Design publishing failed', error as Error, {
      designId: id,
      userId: req.user!.id
    });
    throw error;
  }
}));

/**
 * @route   POST /api/designs/:id/unpublish
 * @desc    Unpublish design (make private)
 * @access  Private (owner only)
 */
router.post('/:id/unpublish', designLimiter, authenticate, [
  param('id').isMongoId().withMessage('Invalid design ID')
], requireOwnership(Design), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { id } = req.params;
  
  try {
    const design = await Design.findById(id);
    
    if (!design) {
      throw new NotFoundError('Design not found');
    }
    
    design.isPublic = false;
    design.metadata.status = 'draft';
    design.metadata.updatedAt = new Date();
    
    await design.save();
    
    logger.info('Design unpublished successfully', {
      designId: id,
      userId: req.user!.id
    });
    
    res.json({
      success: true,
      message: 'Design unpublished successfully',
      data: design
    });
  } catch (error) {
    logger.error('Design unpublishing failed', error as Error, {
      designId: id,
      userId: req.user!.id
    });
    throw error;
  }
}));

/**
 * @route   GET /api/designs/:id/versions
 * @desc    Get design version history
 * @access  Private (owner only)
 */
router.get('/:id/versions', designLimiter, authenticate, [
  param('id').isMongoId().withMessage('Invalid design ID')
], requireOwnership(Design), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { id } = req.params;
  
  try {
    const design = await Design.findById(id);
    
    if (!design) {
      throw new NotFoundError('Design not found');
    }
    
    const versions = design.versions || [];
    
    res.json({
      success: true,
      data: {
        currentVersion: design.metadata.version,
        versions: versions.map(version => ({
          version: version.version,
          createdAt: version.createdAt,
          changes: version.changes
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve design versions', error as Error, {
      designId: id,
      userId: req.user!.id
    });
    throw error;
  }
}));

/**
 * @route   GET /api/designs/stats/summary
 * @desc    Get user's design statistics
 * @access  Private
 */
router.get('/stats/summary', designLimiter, authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await Design.getUserStats(req.user!.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to retrieve design statistics', error as Error, {
      userId: req.user!.id
    });
    throw error;
  }
}));

export default router;