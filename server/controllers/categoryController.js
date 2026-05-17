import Category from '../models/Category.js';

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const listCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json({ success: true, categories });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.json({ success: false, message: 'Category name is required' });
    }

    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      createdBy: req.user?.id,
    });

    return res.json({ success: true, message: 'Category created', category });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    if (!name) {
      return res.json({ success: false, message: 'Category name is required' });
    }

    const slug = slugify(name);
    const category = await Category.findById(id);
    if (!category) {
      return res.json({ success: false, message: 'Category not found' });
    }

    category.name = name.trim();
    category.slug = slug;
    if (typeof isActive === 'boolean') category.isActive = isActive;
    category.updatedAt = new Date();
    await category.save();

    return res.json({ success: true, message: 'Category updated', category });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.json({ success: false, message: 'Category not found' });
    }

    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const addSubcategory = async (req, res) => {
  try {
    const { categoryId, name } = req.body;
    if (!categoryId || !name) {
      return res.json({ success: false, message: 'Category and subcategory are required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.json({ success: false, message: 'Category not found' });
    }

    const slug = slugify(name);
    if (category.subcategories.some((item) => item.slug === slug)) {
      return res.json({ success: false, message: 'Subcategory already exists' });
    }

    category.subcategories.push({ name: name.trim(), slug });
    category.updatedAt = new Date();
    await category.save();

    return res.json({ success: true, message: 'Subcategory added', category });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.json({ success: false, message: 'Subcategory name is required' });
    }

    const category = await Category.findOne({ 'subcategories._id': id });
    if (!category) {
      return res.json({ success: false, message: 'Subcategory not found' });
    }

    const subcategory = category.subcategories.id(id);
    subcategory.name = name.trim();
    subcategory.slug = slugify(name);
    category.updatedAt = new Date();
    await category.save();

    return res.json({ success: true, message: 'Subcategory updated', category });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const removeSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ 'subcategories._id': id });
    if (!category) {
      return res.json({ success: false, message: 'Subcategory not found' });
    }

    category.subcategories = category.subcategories.filter((item) => item._id.toString() !== id);
    category.updatedAt = new Date();
    await category.save();

    return res.json({ success: true, message: 'Subcategory removed', category });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
