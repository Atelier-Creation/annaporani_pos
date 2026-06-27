// controllers/billing.controller.js
import billingService from "../service/billing.service.js";

const billingController = {
  // ✅ Create new Billing with items
  async create(req, res) {
    try {
      const data = req.body;

      // Attach user info from token
      if (req.user) {
        data.created_by = req.user.id;
        data.created_by_name = req.user.username || req.user.name;
        data.created_by_email = req.user.email;
      }

      const billing = await billingService.createBillingWithItems(data);
      return res.status(201).json({
        message: "Billing created successfully",
        data: billing,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Get all Billings with filters + pagination
  async getAll(req, res) {
    try {
      let { page = 1, limit = 10, ...filters } = req.query;

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

      const result = await billingService.getAllBillings({
        filters,
        limit,
        offset,
      });

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Get Billing by ID (with items)
  async getById(req, res) {
    try {
      const billing = await billingService.getBillingById(req.params.id);
      if (!billing) {
        return res.status(404).json({ error: "Billing not found" });
      }
      return res.json(billing);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Update Billing (and items if provided)
  async update(req, res) {
    try {
      const data = req.body;

      // Attach updater info
      if (req.user) {
        data.updated_by = req.user.id;
        data.updated_by_name = req.user.username || req.user.name;
        data.updated_by_email = req.user.email;
      }

      const billing = await billingService.updateBillingWithItems(
        req.params.id,
        data
      );

      if (!billing) {
        return res.status(404).json({ error: "Billing not found" });
      }

      return res.json({
        message: "Billing updated successfully",
        data: billing,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Delete Billing (soft delete billing + items)
  async delete(req, res) {
    try {
      const billing = await billingService.getBillingById(req.params.id);
      if (!billing) {
        return res.status(404).json({ error: "Billing not found" });
      }

      const result = await billingService.deleteBillingWithItems(
        req.params.id,
        req.user || {}
      );

      return res.json({
        message: "Billing deleted successfully",
        data: result,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};

export default billingController;
