const Category = require('../models/Category');

// ─── GET /api/categories ─── (public)
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .select('-__v');

    res.json({
      success: true,
      data: { categories },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/categories/:slug ─── (public)
const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: { category },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/admin/categories ─── (admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const category = await Category.create({ name, description, image });

    res.status(201).json({
      success: true,
      data: { category },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/admin/categories/:id ─── (admin)
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image, isActive } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: { category },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/admin/categories/:id ─── (admin)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      message: 'Category deleted',
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/categories ─── (admin — includes inactive)
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 })
      .select('-__v');

    res.json({
      success: true,
      data: { categories },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
};
