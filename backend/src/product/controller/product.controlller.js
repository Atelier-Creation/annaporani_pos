// controllers/product.controller.js
import productService from "../service/product.service.js";
import { createProductSchema, updateProductSchema } from "../dto/product.dto.js";

const productController = {
  // ✅ Create Product
  async create(req, res) {
  try {
    const validatedData = createProductSchema.parse(req.body);

    // Attach user info from token
    console.log('User info from token:', req.user); // Debugging line
    if (req.user) {
      validatedData.created_by = req.user.id;
      validatedData.created_by_name = req.user.username;
      validatedData.created_by_email = req.user.email;
    }

    // Auto-generate product code
    const lastProduct = await productService.getLastProduct(); // new service function
    let lastNumber = 0;
    if (lastProduct && lastProduct.product_code) {
      const match = lastProduct.product_code.match(/PNO(\d+)/);
      if (match) lastNumber = parseInt(match[1]);
    }
    const newCodeNumber = (lastNumber + 1).toString().padStart(5, '0');
    validatedData.product_code = `PNO${newCodeNumber}`;

    const product = await productService.createProduct(validatedData);
    return res.status(201).json(product);
  } catch (err) {
    return res.status(400).json({
      error: err.errors || err.message,
    });
  }
},



  // ✅ Get All Products
  async getAll(req, res) {
  try {
    let { 
      page = 1, 
      limit = 10, 
      search, 
      product_name, 
      status, 
      category_id, 
      brand, 
      product_code ,
      startsWith 
    } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    // Build filters
    const filters = {};
    if (search) filters.search = search; // handled in service
    if (product_name) filters.product_name = product_name; // exact match
    if (status) filters.status = status;
    if (category_id) filters.category_id = category_id;
    if (brand) filters.brand = brand;
    if (product_code) filters.product_code = product_code; // ✅ NEW
if (startsWith) filters.startsWith = startsWith;
    const result = await productService.getAllProducts({ filters, limit, offset });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
},


  // ✅ Get Product by ID
  async getById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.json(product);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async getByCode(req, res) {
    try {
      const { code } = req.params; // from /:code in route
      if (!code) {
        return res.status(400).json({ message: "Product code is required" });
      }

      const product = await productService.getProductByCode(code);
      return res.json(product);
    } catch (err) {
      console.error("Error fetching product by code:", err.message);
      return res.status(404).json({ message: err.message || "Product not found" });
    }
  },

  // ✅ Update Product
  async update(req, res) {
  try {
    const validatedData = updateProductSchema.parse(req.body);

    // Attach updater info from token
    if (req.user) {
      validatedData.updated_by = req.user.id;
      validatedData.updated_by_name = req.user.name;
      validatedData.updated_by_email = req.user.email;
    }

    // Check if product code exists and belongs to another product
    if (validatedData.product_code) {
      const existing = await productService.findByCode(validatedData.product_code);
      if (existing && existing.id !== req.params.id) {
        return res.status(400).json({ error: "Product code already exists" });
      }
    }

    const product = await productService.updateProduct(req.params.id, validatedData);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(product);
  } catch (err) {
    return res.status(400).json({
      error: err.errors || err.message,
    });
  }
},


  // ✅ Delete Product
  async delete(req, res) {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Prepare data for soft delete
    const updateData = {
      is_active: false,
      deleted_by: req.user?.id || null,
      deleted_by_name: req.user?.name || null,
      deleted_by_email: req.user?.email || null,
    };

    // Use the correct service function
    await productService.updateProduct(req.params.id, updateData);

    return res.json({ message: "Product soft deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
},

  // ✅ Bulk Upload Products
  async bulkUpload(req, res) {
    try {
      const { products, branch_id } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "Products array is required" });
      }

      const userInfo = req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      } : null;

      // Process products with category/subcategory/branch handling
      const productResults = await productService.bulkUploadProducts(products, userInfo);

      // Process stock for successfully created products
      const stockService = (await import('../../stock/service/stock.service.js')).default;
      const stockResults = [];

      for (const result of productResults) {
        if (result.success && result.stock_quantity > 0) {
          try {
            // Use branch_id from Excel data or fallback to request body
            const stockBranchId = result.branch_id || branch_id;
            
            if (!stockBranchId) {
              stockResults.push({
                success: false,
                product_name: result.product.product_name,
                error: 'Branch not specified for stock creation'
              });
              continue;
            }

            const stockData = {
              branch_id: stockBranchId,
              product_id: result.product.id,
              quantity: result.stock_quantity,
              inward_quantity: result.stock_quantity,
              unit: result.product.unit || 'piece',
              cost_price: result.product.purchase_price,
              selling_price: result.product.selling_price,
              mrp: result.product.mrp,
              size: result.product.size,
              color: result.product.color,
              barcode: result.product.barcode,
              sku: result.product.sku,
              is_active: true
            };

            const stock = await stockService.addStock(stockData);
            stockResults.push({
              success: true,
              product_name: result.product.product_name,
              stock
            });
          } catch (stockError) {
            stockResults.push({
              success: false,
              product_name: result.product.product_name,
              error: stockError.message
            });
          }
        }
      }

      const successCount = productResults.filter(r => r.success).length;
      const failureCount = productResults.filter(r => !r.success).length;

      return res.status(201).json({
        message: `Bulk upload completed: ${successCount} products created, ${failureCount} failed`,
        summary: {
          total: products.length,
          success: successCount,
          failed: failureCount
        },
        products: productResults,
        stock: stockResults
      });

    } catch (err) {
      console.error('Bulk upload error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

};

export default productController;
