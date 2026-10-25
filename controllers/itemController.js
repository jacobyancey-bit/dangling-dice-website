import Item from '../models/Item.js';

/**
 * @desc    Fetch all studio resources (with optional category filtering)
 * @route   GET /api/items
 * @access  Public
 */
export const getItems = async (req, res, next) => {
  try {
    const { category, featured } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const items = await Item.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch a single resource by ID
 * @route   GET /api/items/:id
 * @access  Public
 */
export const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('user', 'name email');

    if (!item) {
      res.status(404);
      throw new Error(`Resource not found with id: ${req.params.id}`);
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new studio resource (Coding Tutorial, Beat, Game)
 * @route   POST /api/items
 * @access  Private (Requires valid JWT)
 */
export const createItem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      mediaUrl,
      imageUrl,
      tags,
      price,
      isFeatured,
      isAvailable,
    } = req.body;

    if (!title || !description) {
      res.status(400);
      throw new Error('Please provide at least a title and description');
    }

    const item = await Item.create({
      user: req.user._id,
      title,
      description,
      category: category || 'Coding Tutorials',
      mediaUrl: mediaUrl || '',
      imageUrl: imageUrl || '/images/banner.jpg',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []),
      price: price !== undefined ? Number(price) : 0,
      isFeatured: Boolean(isFeatured),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a studio resource
 * @route   PUT /api/items/:id
 * @access  Private (Requires ownership)
 */
export const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error(`Resource not found with id: ${req.params.id}`);
    }

    // Verify creator ownership
    if (item.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('User not authorized to update this resource');
    }

    // If tags passed as string, format to array
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map((t) => t.trim());
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a studio resource
 * @route   DELETE /api/items/:id
 * @access  Private (Requires ownership)
 */
export const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error(`Resource not found with id: ${req.params.id}`);
    }

    // Verify creator ownership
    if (item.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('User not authorized to delete this resource');
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resource successfully deleted',
      deletedId: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};
