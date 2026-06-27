// controllers/subcategory.controller.js
import subcategoryService from "../service/subcategory.service.js";
import { createSubcategorySchema, updateSubcategorySchema } from "../dto/subcategory.dto.js";

const subcategoryController = {
  // ✅ Create Subcategory
  async create(req, res) {
    try {
      const validatedData = createSubcategorySchema.parse(req.body);

      // Attach user info from token
      if (req.user) {
        validatedData.created_by = req.user.id;
        validatedData.created_by_name = req.user.username || req.user.name;
        validatedData.created_by_email = req.user.email;
      }

      const subcategory = await subcategoryService.createSubcategory(validatedData);
      return res.status(201).json(subcategory);
    } catch (err) {
      return res.status(400).json({
        error: err.errors || err.message,
      });
    }
  },

  // ✅ Get All Subcategories
  async getAll(req, res) {
    try {
      let { page = 1, limit = 10, search, subcategory_name, category_id, status } = req.query;

      page = parseInt(page, 10);
      limit = parseInt(limit, 10);
      const offset = (page - 1) * limit;

      const filters = {};
      if (search) filters.search = search;
      if (subcategory_name) filters.subcategory_name = subcategory_name;
      if (category_id) filters.category_id = category_id;
      if (status !== undefined) filters.status = status;

      const result = await subcategoryService.getAllSubcategories({ filters, limit, offset });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Get Subcategory by ID
  async getById(req, res) {
    try {
      const subcategory = await subcategoryService.getSubcategoryById(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      return res.json(subcategory);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Update Subcategory
  async update(req, res) {
    try {
      const validatedData = updateSubcategorySchema.parse(req.body);

      // Attach updater info from token
      if (req.user) {
        validatedData.updated_by = req.user.id;
        validatedData.updated_by_name = req.user.username || req.user.name;
        validatedData.updated_by_email = req.user.email;
      }

      const subcategory = await subcategoryService.updateSubcategory(req.params.id, validatedData);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      return res.json(subcategory);
    } catch (err) {
      return res.status(400).json({
        error: err.errors || err.message,
      });
    }
  },

  // ✅ Delete Subcategory (soft delete)
  async delete(req, res) {
    try {
      const subcategory = await subcategoryService.getSubcategoryById(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }

      // Soft delete
      subcategory.is_active = false;

      // Attach deleted_by info from token
      if (req.user) {
        subcategory.deleted_by = req.user.id;
        subcategory.deleted_by_name = req.user.username || req.user.name;
        subcategory.deleted_by_email = req.user.email;
      }

      await subcategory.save();

      return res.json({ message: "Subcategory soft deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};

export default subcategoryController;
