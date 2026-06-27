// controllers/report.controller.js
import reportService from "../service/report.service.js";

const VALID_PERIODS = ['today', 'yesterday', 'this_month', 'this_year', 'custom'];

// Shared branch resolution helper
function resolveBranches(req, branch_id) {
  let branch_ids = [];
  if (req.branchContext) {
    if (req.branchContext.multipleBranches && req.branchContext.branches) {
      const userBranchIds = req.branchContext.branches.map(b => b.branchId);
      if (branch_id) {
        if (!userBranchIds.includes(branch_id)) return { error: "You don't have access to the selected branch" };
        branch_ids = [branch_id];
      } else {
        branch_ids = userBranchIds;
      }
    } else if (req.branchContext.branchId) {
      branch_ids = [req.branchContext.branchId];
    }
  }
  if (!branch_ids.length) return { error: "No branches assigned to user" };
  return { branch_ids };
}

// Shared period validation
function validatePeriod(period, startDate, endDate) {
  if (!VALID_PERIODS.includes(period))
    return `Invalid period. Must be: ${VALID_PERIODS.join(', ')}`;
  if (period === 'custom') {
    if (!startDate || !endDate) return 'startDate and endDate are required for custom period';
    if (isNaN(new Date(startDate)) || isNaN(new Date(endDate))) return 'Invalid date format';
    if (new Date(startDate) > new Date(endDate)) return 'startDate cannot be after endDate';
  }
  return null;
}

const reportController = {
  async getSalesReport(req, res) {
    try {
      const { period = 'today', startDate, endDate, branch_id } = req.query;

      const { branch_ids, error: branchError } = resolveBranches(req, branch_id);
      if (branchError) return res.status(403).json({ success: false, message: branchError });

      const periodError = validatePeriod(period, startDate, endDate);
      if (periodError) return res.status(400).json({ success: false, message: periodError });

      const report = await reportService.getSalesReport({ period, startDate, endDate, branch_ids });
      return res.status(200).json({ success: true, data: report, message: "Sales report generated successfully" });
    } catch (error) {
      console.error("Error generating sales report:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to generate sales report" });
    }
  },

  async getSourceWiseReport(req, res) {
    try {
      const { period = 'today', startDate, endDate, branch_id } = req.query;

      const { branch_ids, error: branchError } = resolveBranches(req, branch_id);
      if (branchError) return res.status(403).json({ success: false, message: branchError });

      const periodError = validatePeriod(period, startDate, endDate);
      if (periodError) return res.status(400).json({ success: false, message: periodError });

      const report = await reportService.getSourceWiseReport({ period, startDate, endDate, branch_ids });
      return res.status(200).json({ success: true, data: report, message: "Source-wise report generated successfully" });
    } catch (error) {
      console.error("Error generating source-wise report:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to generate source-wise report" });
    }
  }
};

export default reportController;
