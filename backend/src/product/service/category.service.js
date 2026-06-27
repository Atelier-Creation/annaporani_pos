// services/category.service.js
import Category from "../models/category.model.js";
import { Op } from "sequelize";

const categoryService = {
  // ✅ Create a new category
  async createCategory(data) {
    return await Category.create(data);
  },

  // ✅ Get all categories with filters, pagination, and exclude soft-deleted
  async getAllCategories({ filters = {}, limit = 10, offset = 0 } = {}) {
    const where = { is_active: true };

    // 🔎 global search on category_name or description
    if (filters.search) {
      where[Op.or] = [
        { category_name: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    // Exact match filters
    if (filters.category_name) {
      where.category_name = filters.category_name;
    }
    if (filters.status !== undefined) {
      where.is_active = filters.status;
    }

    const { count, rows } = await Category.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      total: count,
      page: Math.floor(offset / limit) + 1,
      limit,
      data: rows,
    };
  },

  // ✅ Get a category by ID
  async getCategoryById(id) {
    const category = await Category.findByPk(id);
    if (!category) throw new Error("Category not found");
    return category;
  },

  // ✅ Update a category
  async updateCategory(id, data) {
    const category = await Category.findByPk(id);
    if (!category) throw new Error("Category not found");
    await category.update(data);
    return category;
  },

  // ✅ Soft delete a category
  async deleteCategory(id) {
    const category = await Category.findByPk(id);
    if (!category) throw new Error("Category not found");

    category.is_active = false;
    await category.save();

    return { message: "Category soft deleted successfully" };
  },

  // ✅ Find category by name (optional utility)
  async findByName(category_name) {
    return await Category.findOne({ where: { category_name } });
  },

  // ✅ Get the last category (optional for auto ID/code generation)
  async getLastCategory() {
    return await Category.findOne({
      order: [["createdAt", "DESC"]],
    });
  },
};

export default categoryService;
