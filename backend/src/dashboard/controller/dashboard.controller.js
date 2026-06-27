// controllers/dashboard.controller.js
import dashboardService from "../service/dashboard.service.js";

/**
 * Get comprehensive dashboard data
 * Query params: period (today|week|month|year)
 */
export const getDashboardData = async (req, res) => {
  console.log('🎯 getDashboardData controller called');
  console.log('Query params:', req.query);
  console.log('Branch context:', req.branchContext);
  
  try {
    const { period = 'today' } = req.query;
    
    // Get branch_ids from branchContext (populated by authenticateBranch middleware)
    let branch_ids = [];
    
    if (req.branchContext) {
      if (req.branchContext.multipleBranches && req.branchContext.branches) {
        // User has multiple branches
        const userBranchIds = req.branchContext.branches.map(b => b.branchId);
        
        // If specific branch_id provided, validate and use only that branch
        if (req.query.branch_id) {
          if (userBranchIds.includes(req.query.branch_id)) {
            branch_ids = [req.query.branch_id];
          } else {
            console.log('❌ User does not have access to selected branch');
            return res.status(403).json({
              success: false,
              message: "You don't have access to the selected branch"
            });
          }
        } else {
          // No specific branch selected, use all user's branches
          branch_ids = userBranchIds;
        }
      } else if (req.branchContext.branchId) {
        // User has single branch
        branch_ids = [req.branchContext.branchId];
      }
    }
    
    console.log('Branch IDs to query:', branch_ids);
    
    if (!branch_ids || branch_ids.length === 0) {
      console.log('❌ No branches assigned to user');
      return res.status(403).json({
        success: false,
        message: "No branches assigned to user"
      });
    }

    // Validate period
    const validPeriods = ['today', 'yesterday', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      console.log('❌ Invalid period:', period);
      return res.status(400).json({
        success: false,
        message: "Invalid period. Must be: today, yesterday, week, month, or year"
      });
    }

    console.log('✅ Calling dashboard service with period:', period);
    const data = await dashboardService.getDashboardData(branch_ids, period);
    
    console.log('✅ Dashboard data retrieved successfully');
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error("❌ Dashboard data error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/**
 * Get dashboard summary (legacy - kept for backward compatibility)
 */
export const getDashboardSummary = async (req, res) => {
  try {
    // Get branch_ids from branchContext
    let branch_ids = [];
    
    if (req.branchContext) {
      if (req.branchContext.multipleBranches && req.branchContext.branches) {
        branch_ids = req.branchContext.branches.map(b => b.branchId);
      } else if (req.branchContext.branchId) {
        branch_ids = [req.branchContext.branchId];
      }
    }
    
    const summary = await dashboardService.getSummary(branch_ids);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRecentBills = async (req, res) => {
  try {
    // Get branch_ids from branchContext
    let branch_ids = [];
    
    if (req.branchContext) {
      if (req.branchContext.multipleBranches && req.branchContext.branches) {
        branch_ids = req.branchContext.branches.map(b => b.branchId);
      } else if (req.branchContext.branchId) {
        branch_ids = [req.branchContext.branchId];
      }
    }
    
    const bills = await dashboardService.getRecentBills(branch_ids);
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRevenueByDate = async (req, res) => {
  try {
    // Get branch_ids from branchContext
    let branch_ids = [];
    
    if (req.branchContext) {
      if (req.branchContext.multipleBranches && req.branchContext.branches) {
        branch_ids = req.branchContext.branches.map(b => b.branchId);
      } else if (req.branchContext.branchId) {
        branch_ids = [req.branchContext.branchId];
      }
    }
    
    const revenue = await dashboardService.getRevenueByDate(branch_ids);
    res.json(revenue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
