// controllers/inward.controller.js
import inwardService from "../service/inward.service.js";

const inwardController = {
  // ✅ Create new Inward with items
  async create(req, res) {
    try {
      const data = req.body;

      // Get branch_id from branchContext (set by authenticateBranch middleware)
      const branchId = req.branchContext?.branchId || req.body.branch_id;
      
      if (!branchId) {
        return res.status(400).json({ error: "Branch ID is required" });
      }

      // Attach branch and user info
      data.branch_id = branchId;
      if (req.user) {
        data.created_by = req.user.id;
        data.created_by_name = req.user.username || req.user.name;
        data.created_by_email = req.user.email;
      }

      const inward = await inwardService.createInwardWithItems(data);
      return res.status(201).json({
        message: "Inward created successfully",
        data: inward,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Get all inwards with filters + pagination
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

      const result = await inwardService.getAllInwards({
        filters,
        limit,
        offset,
      });

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Get inward by ID (with items)
  async getById(req, res) {
    try {
      const inward = await inwardService.getInwardById(req.params.id);
      if (!inward) {
        return res.status(404).json({ error: "Inward not found" });
      }
      return res.json(inward);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Update inward (and items if provided)
  async update(req, res) {
    try {
      const data = req.body;

      // Get branch_id from branchContext
      const branchId = req.branchContext?.branchId || req.body.branch_id;
      if (branchId) {
        data.branch_id = branchId;
      }

      // Attach updater info
      if (req.user) {
        data.updated_by = req.user.id;
        data.updated_by_name = req.user.username || req.user.name;
        data.updated_by_email = req.user.email;
      }

      const inward = await inwardService.updateInwardWithItems(
        req.params.id,
        data
      );

      if (!inward) {
        return res.status(404).json({ error: "Inward not found" });
      }

      return res.json({
        message: "Inward updated successfully",
        data: inward,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ Delete inward (soft delete inward + items)
  async delete(req, res) {
    try {
      const inward = await inwardService.getInwardById(req.params.id);
      if (!inward) {
        return res.status(404).json({ error: "Inward not found" });
      }

      const result = await inwardService.deleteInwardWithItems(
        req.params.id,
        req.user || {}
      );

      return res.json({
        message: "Inward deleted successfully",
        data: result,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};

export default inwardController;
