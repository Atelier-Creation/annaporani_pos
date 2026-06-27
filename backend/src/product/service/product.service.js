// services/product.service.js
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.models.js";
import { Op } from "sequelize";
import { sequelize } from "../../db/index.js";

const productService = {
  async createProduct(data) {
    // ✅ Check if category exists (only if category_id is provided)
    if (data.category_id) {
      const categoryExists = await Category.findByPk(data.category_id);
      if (!categoryExists) {
        throw new Error("Category not found. Cannot create product.");
      }
    }

    // ✅ Check if subcategory exists (if provided)
    if (data.sub_category_id) {
      const subcategoryExists = await Subcategory.findByPk(data.sub_category_id);
      if (!subcategoryExists) {
        throw new Error("Subcategory not found. Cannot create product.");
      }

      // Optional: Check if subcategory belongs to the given category (only if category_id exists)
      if (data.category_id && subcategoryExists.category_id !== data.category_id) {
        throw new Error("Subcategory does not belong to the selected category.");
      }
    }

    // ✅ Create product
    return await Product.create(data);
  },

  // ✅ Get all products with filters, pagination, and exclude soft-deleted
  async getAllProducts({ filters = {}, limit = 10, offset = 0 } = {}) {
    const where = { is_active: true };

    // 🔎 global search on product_name OR product_code
    if (filters.search) {
      where[Op.or] = [
        { product_name: { [Op.like]: `%${filters.search}%` } },
        { product_code: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    // Exact match filter for product_name
    if (filters.product_name) {
      where.product_name = filters.product_name;
    }

    // Other filters
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.category_id) {
      where.category_id = filters.category_id;
    }
    if (filters.brand) {
      where.brand = { [Op.like]: `%${filters.brand}%` };
    }

    if (filters.startsWith) {
      query.product_name = {
        $regex: `^${filters.startsWith}`,
        $options: "i"
      };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    // Fetch category and subcategory names in bulk
    const categoryIds = [...new Set(rows.map(p => p.category_id))];
    const subcategoryIds = [...new Set(rows.map(p => p.sub_category_id).filter(Boolean))];

    const categories = await Category.findAll({ where: { id: categoryIds }, raw: true });
    const subcategories = await Subcategory.findAll({ where: { id: subcategoryIds }, raw: true });

    // Merge names into product data
    const dataWithNames = rows.map(p => {
      const category = categories.find(c => c.id === p.category_id);
      const subcategory = subcategories.find(s => s.id === p.sub_category_id);
      return {
        ...p.dataValues,
        category_name: category ? category.category_name : null,
        subcategory_name: subcategory ? subcategory.subcategory_name : null,
      };
    });

    return {
      total: count,
      page: Math.floor(offset / limit) + 1,
      limit,
      data: dataWithNames,
    };
  },

  async getProductById(id) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    const category = await Category.findByPk(product.category_id, { raw: true });
    let subcategory = null;
    if (product.sub_category_id) {
      subcategory = await Subcategory.findByPk(product.sub_category_id, { raw: true });
    }

    return {
      ...product.dataValues,
      category_name: category ? category.category_name : null,
      subcategory_name: subcategory ? subcategory.subcategory_name : null,
    };
  },

  async getProductByCode(product_code) {
    const product = await Product.findOne({ where: { product_code } });
    if (!product) throw new Error("Product not found");

    const category = await Category.findByPk(product.category_id, { raw: true });
    let subcategory = null;
    if (product.sub_category_id) {
      subcategory = await Subcategory.findByPk(product.sub_category_id, { raw: true });
    }
    return {
      ...product.dataValues,
      category_name: category ? category.category_name : null,
      subcategory_name: subcategory ? subcategory.subcategory_name : null,
    };
  },

  async updateProduct(id, data) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");
    await product.update(data);
    return product;
  },

  async deleteProduct(id) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    // Soft delete: mark as inactive
    product.is_active = false;
    await product.save();

    return { message: "Product soft deleted successfully" };
  },

  async findByCode(product_code) {
    return await Product.findOne({ where: { product_code } });
  },

  // Get the last product for auto product code generation
  // To avoid duplicates, we find the highest existing PNO product code
  // regardless of when it was created.
  async getLastProduct() {
    return await Product.findOne({
      where: {
        product_code: {
          [Op.like]: 'PNO%'
        }
      },
      order: [
        ["product_code", "DESC"]
      ],
    });
  },

  // Bulk upload products with category/subcategory/branch handling
  async bulkUploadProducts(productsArray, userInfo) {
    const results = [];
    const categoryCache = new Map();
    const subcategoryCache = new Map();
    const branchCache = new Map();

    // Import Branch model
    const Branch = (await import('../../user/models/branch.model.js')).default;

    // ✅ FIX: Get last product code *once* before the loop to avoid duplicate codes
    // caused by rapid insertions where "getLastProduct" might return the same result
    // or race conditions in DB visibility.
    const lastProduct = await this.getLastProduct();
    let lastNumber = 0;
    if (lastProduct && lastProduct.product_code) {
      const match = lastProduct.product_code.match(/PNO(\d+)/);
      if (match) lastNumber = parseInt(match[1]);
    }

    for (const productData of productsArray) {
      try {
        // Validate required fields
        if (!productData.product_name || productData.product_name.trim() === '') {
          throw new Error('Product name is required');
        }
        if (!productData.category_name || productData.category_name.trim() === '') {
          throw new Error('Category name is required');
        }

        // Check if product already exists (case-insensitive)
        const existingProduct = await Product.findOne({
          where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('product_name')),
            productData.product_name.trim().toLowerCase()
          )
        });

        if (existingProduct) {
          results.push({
            success: false,
            error: `Product already exists: "${existingProduct.product_name}"`,
            product_name: productData.product_name,
            skipped: true,
            existing_product_id: existingProduct.id
          });
          continue; // Skip this product
        }

        let categoryId = null;
        let subcategoryId = null;
        let branchId = null;

        // Handle Branch lookup
        if (productData.branch_name || productData.branch_code) {
          const branchKey = productData.branch_name || productData.branch_code;

          if (branchCache.has(branchKey)) {
            branchId = branchCache.get(branchKey);
          } else {
            let branch = null;

            if (productData.branch_name) {
              branch = await Branch.findOne({
                where: { branch_name: productData.branch_name, is_active: true }
              });
            } else if (productData.branch_code) {
              branch = await Branch.findOne({
                where: { branch_code: productData.branch_code, is_active: true }
              });
            }

            if (!branch) {
              throw new Error(`Branch not found: ${branchKey}`);
            }

            branchId = branch.id;
            branchCache.set(branchKey, branchId);
          }
        }

        // Handle Category (case-insensitive)
        if (productData.category_name) {
          const categoryNameLower = productData.category_name.trim().toLowerCase();

          if (categoryCache.has(categoryNameLower)) {
            categoryId = categoryCache.get(categoryNameLower);
          } else {
            // Case-insensitive search
            let category = await Category.findOne({
              where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('category_name')),
                categoryNameLower
              )
            });

            if (!category) {
              // Create with original case from Excel
              category = await Category.create({
                category_name: productData.category_name.trim(),
                is_active: true,
                created_by: userInfo?.id,
                created_by_name: userInfo?.username,
                created_by_email: userInfo?.email
              });
            }

            categoryId = category.id;
            categoryCache.set(categoryNameLower, categoryId);
          }
        }

        // Handle Subcategory (case-insensitive)
        if (productData.subcategory_name && categoryId) {
          const subcategoryNameLower = productData.subcategory_name.trim().toLowerCase();
          const subcategoryKey = `${categoryId}_${subcategoryNameLower}`;

          if (subcategoryCache.has(subcategoryKey)) {
            subcategoryId = subcategoryCache.get(subcategoryKey);
          } else {
            // Case-insensitive search within the category
            let subcategory = await Subcategory.findOne({
              where: {
                category_id: categoryId,
                [Op.and]: sequelize.where(
                  sequelize.fn('LOWER', sequelize.col('subcategory_name')),
                  subcategoryNameLower
                )
              }
            });

            if (!subcategory) {
              // Check if subcategory name exists globally (due to unique constraint)
              const existingSubcategory = await Subcategory.findOne({
                where: sequelize.where(
                  sequelize.fn('LOWER', sequelize.col('subcategory_name')),
                  subcategoryNameLower
                )
              });

              if (existingSubcategory && existingSubcategory.category_id !== categoryId) {
                // Subcategory name exists under different category
                // Get the category name for the modified subcategory name
                const category = await Category.findByPk(categoryId);
                const modifiedName = `${productData.subcategory_name.trim()} (${category.category_name})`;

                subcategory = await Subcategory.create({
                  subcategory_name: modifiedName,
                  category_id: categoryId,
                  is_active: true,
                  created_by: userInfo?.id,
                  created_by_name: userInfo?.username,
                  created_by_email: userInfo?.email
                });
              } else {
                // Create new subcategory normally with original case
                subcategory = await Subcategory.create({
                  subcategory_name: productData.subcategory_name.trim(),
                  category_id: categoryId,
                  is_active: true,
                  created_by: userInfo?.id,
                  created_by_name: userInfo?.username,
                  created_by_email: userInfo?.email
                });
              }
            }

            subcategoryId = subcategory.id;
            subcategoryCache.set(subcategoryKey, subcategoryId);
          }
        }

        // ✅ FIX: Increment local counter for each product
        lastNumber++;
        const newCodeNumber = lastNumber.toString().padStart(5, '0');
        const productCode = `PNO${newCodeNumber}`;

        // Prepare product data
        const newProductData = {
          product_name: productData.product_name.trim(),
          product_code: productCode,
          category_id: categoryId,
          sub_category_id: subcategoryId,
          brand: productData.brand || null,
          size: productData.size || null,
          color: productData.color || null,
          material: productData.material || null,
          style: productData.style || null,
          pattern: productData.pattern || null,
          sleeve_type: productData.sleeve_type || null,
          length: productData.length || null,
          occasion: productData.occasion || null,
          season: productData.season || null,
          gender: productData.gender || 'Women',
          unit: productData.unit || 'piece',
          purchase_price: productData.purchase_price || 0,
          selling_price: productData.selling_price || 0,
          mrp: productData.mrp || null,
          discount_percentage: productData.discount_percentage || 0,
          description: productData.description || null,
          care_instructions: productData.care_instructions || null,
          tax_percentage: productData.tax_percentage || 0,
          barcode: productData.barcode || null,
          sku: productData.sku || null,
          image_url: productData.image_url || null,
          status: productData.status || 'active',
          is_active: true,
          created_by: userInfo?.id,
          created_by_name: userInfo?.username,
          created_by_email: userInfo?.email
        };

        const product = await Product.create(newProductData);

        results.push({
          success: true,
          product,
          category_name: productData.category_name,
          subcategory_name: productData.subcategory_name,
          branch_id: branchId,
          stock_quantity: productData.stock_quantity || 0
        });

      } catch (error) {
        // Provide more detailed error message
        let errorMessage = error.message;

        if (error.name === 'SequelizeValidationError') {
          errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.name === 'SequelizeUniqueConstraintError') {
          errorMessage = `Duplicate entry: ${error.errors.map(e => e.path).join(', ')}`;
        }

        results.push({
          success: false,
          error: errorMessage,
          product_name: productData.product_name,
          row_data: productData
        });
      }
    }

    return results;
  }
};

export default productService;
