// services/subcategory.service.js
import Subcategory from "../models/subcategory.models.js";
import Category from "../models/category.model.js";
import { Op } from "sequelize";

const subcategoryService = {
  // ✅ Create a new subcategory
  async createSubcategory(data) {
    // ✅ Check if category_id exists
    const categoryExists = await Category.findByPk(data.category_id);
    if (!categoryExists) {
      throw new Error("Category not found. Cannot create subcategory.");
    }

    // Create subcategory
    return await Subcategory.create(data);
  },

  // ✅ Get all subcategories with filters, pagination, and exclude soft-deleted
  async getAllSubcategories({ filters = {}, limit = 10, offset = 0 } = {}) {
    const where = { is_active: true };

    if (filters.search) {
      where[Op.or] = [
        { subcategory_name: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.subcategory_name) where.subcategory_name = filters.subcategory_name;
    if (filters.category_id) where.category_id = filters.category_id;
    if (filters.status !== undefined) where.is_active = filters.status;

    const { count, rows } = await Subcategory.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // Fetch category names separately and merge
    const categoryIds = [...new Set(rows.map(r => r.category_id))];
    const categories = await Category.findAll({
      where: { id: categoryIds },
      attributes: ["id", "category_name"],
      raw: true,
    });

    const dataWithCategoryName = rows.map(sub => {
      const category = categories.find(c => c.id === sub.category_id);
      return {
        ...sub,
        category_name: category ? category.category_name : null,
      };
    });

    return {
      total: count,
      page: Math.floor(offset / limit) + 1,
      limit,
      data: dataWithCategoryName,
    };
  },

  // Get subcategory by ID with category name (without associations)
  async getSubcategoryById(id) {
    const subcategory = await Subcategory.findByPk(id, { raw: true });
    if (!subcategory) throw new Error("Subcategory not found");

    const category = await Category.findByPk(subcategory.category_id, {
      attributes: ["category_name"],
      raw: true,
    });

    return {
      ...subcategory,
      category_name: category ? category.category_name : null,
    };
  },

  // ✅ Update subcategory
  async updateSubcategory(id, data) {
    const subcategory = await Subcategory.findByPk(id);
    if (!subcategory) throw new Error("Subcategory not found");
    await subcategory.update(data);
    return subcategory;
  },

  // ✅ Soft delete subcategory
  async deleteSubcategory(id) {
    const subcategory = await Subcategory.findByPk(id);
    if (!subcategory) throw new Error("Subcategory not found");

    subcategory.is_active = false;
    await subcategory.save();

    return { message: "Subcategory soft deleted successfully" };
  },

  // ✅ Find by name (optional utility)
  async findByName(subcategory_name) {
    return await Subcategory.findOne({ where: { subcategory_name } });
  },

  // ✅ Get last created subcategory (optional for auto code generation)
  async getLastSubcategory() {
    return await Subcategory.findOne({
      order: [["createdAt", "DESC"]],
    });
  },
};

export default subcategoryService;
