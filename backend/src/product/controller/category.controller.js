// controllers/category.controller.js
import categoryService from "../service/category.service.js";
import { createCategorySchema, updateCategorySchema } from "../dto/category.dto.js";

const categoryController = {
  // ✅ Create Category
  async create(req, res) {
    try {
      const validatedData = createCategorySchema.parse(req.body);

      // Attach user info from token
      if (req.user) {
        validatedData.created_by = req.user.id;
        validatedData.created_by_name = req.user.username || req.user.name;
        validatedData.created_by_email = req.user.email;
      }

      const category = await categoryService.createCategory(validatedData);
      return res.status(201).json(category);
    } catch (err) {
      return res.status(400).json({
        error: err.errors || err.message,
      });
    }
  },

  // ✅ Get All Categories
  async getAll(req, res) {
    try {
      let { page = 1, limit = 10, search, category_name, status } = req.query;

      page = parseInt(page, 10);
      limit = parseInt(limit, 10);
      const offset = (page - 1) * limit;

      const filters = {};
      if (search) filters.search = search;
      if (category_name) filters.category_name = category_name;
      if (status !== undefined) filters.status = status;

      const result = await categoryService.getAllCategories({ filters, limit, offset });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Get Category by ID
  async getById(req, res) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      return res.json(category);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Update Category
  async update(req, res) {
    try {
      const validatedData = updateCategorySchema.parse(req.body);

      // Attach updater info from token
      if (req.user) {
        validatedData.updated_by = req.user.id;
        validatedData.updated_by_name = req.user.username || req.user.name;
        validatedData.updated_by_email = req.user.email;
      }

      const category = await categoryService.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      return res.json(category);
    } catch (err) {
      return res.status(400).json({
        error: err.errors || err.message,
      });
    }
  },

  // ✅ Delete Category (soft delete)
  async delete(req, res) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Soft delete: mark as inactive
      category.is_active = false;

      // Attach deleted_by info from token
      if (req.user) {
        category.deleted_by = req.user.id;
        category.deleted_by_name = req.user.username || req.user.name;
        category.deleted_by_email = req.user.email;
      }

      await category.save();

      return res.json({ message: "Category soft deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};

export default categoryController;
