// controllers/stock.controller.js
import stockService from "../service/stock.service.js";
import { createStockSchema, updateStockSchema } from "../dto/stock.dto.js"; // create DTOs for validation

const stockController = {
  // ✅ Add single Stock
  async create(req, res) {
    try {
      const validatedData = createStockSchema.parse(req.body);

      // Attach user info from token
      if (req.user) {
        validatedData.created_by = req.user.id;
        validatedData.created_by_name = req.user.username || req.user.name;
        validatedData.created_by_email = req.user.email;
      }

      const stock = await stockService.addStock(validatedData);
      return res.status(201).json(stock);
    } catch (err) {
      return res.status(400).json({
        error: err.errors || err.message,
      });
    }
  },

  // ✅ Bulk Add Stock
  async createBulk(req, res) {
    try {
      const stockArray = req.body;

      if (!Array.isArray(stockArray) || stockArray.length === 0) {
        return res.status(400).json({ error: "Request body must be a non-empty array" });
      }

      // Attach user info to each stock object
      const userInfo = req.user
        ? {
            created_by: req.user.id,
            created_by_name: req.user.username || req.user.name,
            created_by_email: req.user.email,
          }
        : {};

      const dataWithUser = stockArray.map(item => ({ ...item, ...userInfo }));

      const results = await stockService.addBulkStock(dataWithUser);
      return res.status(201).json(results);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Get All Stock
  async getAll(req, res) {
    try {
      let { page = 1, limit = 10, product_id, warehouse_id, batch_number, supplier, ...filters } = req.query;

      // Handle branch filtering
      if (req.branchContext) {
        if (req.branchContext.multipleBranches) {
          // User has multiple branches
          if (filters.branch_id) {
            // User selected a specific branch to filter
            // Verify they have access to this branch
            const hasAccess = req.branchContext.branches.some(
              b => b.branchId === filters.branch_id
            );
            if (!hasAccess) {
              return res.status(403).json({ 
                error: "You don't have access to this branch" 
              });
            }
          } else {
            // No branch selected, fetch from all their branches
            filters.branch_ids = req.branchContext.branches.map(b => b.branchId);
          }
        } else if (req.branchContext.branchId) {
          // User has single branch or specific branch selected
          filters.branch_id = req.branchContext.branchId;
        }
      }

      page = parseInt(page, 10);
      limit = parseInt(limit, 10);
      const offset = (page - 1) * limit;

      if (product_id) filters.product_id = product_id;
      if (warehouse_id) filters.warehouse_id = warehouse_id;
      if (batch_number) filters.batch_number = batch_number;
      if (supplier) filters.supplier = supplier;

      const result = await stockService.getAllStock({ filters, limit, offset });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Get Stock by ID
  async getById(req, res) {
    try {
      const stock = await stockService.getStockById(req.params.id);
      if (!stock) return res.status(404).json({ error: "Stock record not found" });
      return res.json(stock);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Update Stock
  async update(req, res) {
    try {
      const validatedData = updateStockSchema.parse(req.body);

      // Attach updater info from token
      if (req.user) {
        validatedData.updated_by = req.user.id;
        validatedData.updated_by_name = req.user.username || req.user.name;
        validatedData.updated_by_email = req.user.email;
      }

      const stock = await stockService.updateStock(req.params.id, validatedData);
      if (!stock) return res.status(404).json({ error: "Stock record not found" });

      return res.json(stock);
    } catch (err) {
      return res.status(400).json({
        error: err.errors || err.message,
      });
    }
  },

  // ✅ Delete Stock (Soft Delete)
  async delete(req, res) {
    try {
      const stock = await stockService.getStockById(req.params.id);
      if (!stock) return res.status(404).json({ error: "Stock record not found" });

      // Soft delete: mark as inactive
      const updateData = {
        is_active: false,
        deleted_by: req.user?.id || null,
        deleted_by_name: req.user?.username || req.user?.name || null,
        deleted_by_email: req.user?.email || null,
      };

      await stockService.updateStock(req.params.id, updateData);

      return res.json({ message: "Stock record soft deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};

export default stockController;
