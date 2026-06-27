// services/report.service.js
import { Op, fn, col, literal } from "sequelize";
import { sequelize } from "../../db/index.js";
import Billing from "../models/billing.models.js";
import Branch from "../../user/models/branch.model.js";
import Customer from "../models/customer.model.js";

const reportService = {

  // ── Shared date filter builder ────────────────────────────────────────────
  _buildDateFilter(period, startDate, endDate) {
    const now = new Date();
    let s, e;

    if (period === 'today') {
      s = new Date(now); s.setHours(0,0,0,0);
      e = new Date(now); e.setHours(23,59,59,999);
    } else if (period === 'yesterday') {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      s = new Date(y); s.setHours(0,0,0,0);
      e = new Date(y); e.setHours(23,59,59,999);
    } else if (period === 'this_month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'this_year') {
      s = new Date(now.getFullYear(), 0, 1);
      e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (period === 'custom' && startDate && endDate) {
      s = new Date(startDate);
      e = new Date(endDate);
    } else {
      // default to today
      s = new Date(now); s.setHours(0,0,0,0);
      e = new Date(now); e.setHours(23,59,59,999);
    }

    return {
      sequelizeFilter: { billing_date: { [Op.between]: [s, e] } },
      startDate: s,
      endDate: e,
    };
  },
  /**
   * Get sales report with payment method breakdown
   * @param {Object} params - { period, startDate, endDate, branch_ids }
   * @returns {Object} Sales report data
   */
  async getSalesReport({ period, startDate, endDate, branch_ids }) {
    const { sequelizeFilter: dateFilter, startDate: sqlStart, endDate: sqlEnd } = this._buildDateFilter(period, startDate, endDate);

    // Build where clause
    const where = {
      ...dateFilter,
      status: { [Op.in]: ['paid', 'partially_paid'] }, // Only count paid bills
      is_active: true
    };

    // Add branch filter
    if (branch_ids && branch_ids.length > 0) {
      where.branch_id = { [Op.in]: branch_ids };
    }

    // 1. Get total sales amount
    const totalSales = await Billing.sum('total_amount', { where });

    // 2. Get total bills count
    const totalBills = await Billing.count({ where });

    // 3. Get payment method breakdown — only count due_amount for non-fully-paid bills
    const paymentMethodBreakdown = await Billing.findAll({
      attributes: [
        'payment_method',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total_amount')), 'total_amount'],
        [fn('SUM', col('paid_amount')), 'paid_amount'],
        [fn('SUM', col('due_amount')), 'due_amount']
      ],
      where,
      group: ['payment_method'],
      raw: true
    });

    // 3b. Handle split payments - get all split payment bills and break them down
    const splitPaymentBills = await Billing.findAll({
      attributes: ['id', 'payment_details', 'total_amount', 'paid_amount', 'due_amount'],
      where: {
        ...where,
        payment_method: 'split',
        payment_details: { [Op.ne]: null }
      },
      raw: true
    });

    // Create a map to accumulate split payment amounts by method
    const splitPaymentMap = {};
    
    splitPaymentBills.forEach(bill => {
      if (bill.payment_details) {
        const details = typeof bill.payment_details === 'string' 
          ? JSON.parse(bill.payment_details) 
          : bill.payment_details;
        
        if (Array.isArray(details)) {
          details.forEach(payment => {
            const method = payment.method;
            const amount = parseFloat(payment.amount || 0);
            
            if (!splitPaymentMap[method]) {
              splitPaymentMap[method] = {
                count: 0,
                total_amount: 0,
                paid_amount: 0,
                due_amount: 0
              };
            }
            
            splitPaymentMap[method].count += 1;
            splitPaymentMap[method].total_amount += amount;
            splitPaymentMap[method].paid_amount += amount;
            // Split payments are always paid, so due_amount = 0
          });
        }
      }
    });

    // 4. Get branch-wise breakdown (if multiple branches)
    let branchBreakdown = [];
    if (!branch_ids || branch_ids.length > 1) {
      branchBreakdown = await Billing.findAll({
        attributes: [
          'branch_id',
          [fn('COUNT', col('Billing.id')), 'count'],
          [fn('SUM', col('total_amount')), 'total_amount'],
          [fn('SUM', col('paid_amount')), 'paid_amount']
        ],
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['branch_name', 'branch_code']
          }
        ],
        where,
        group: ['branch_id', 'branch.id'],
        raw: false
      });
    }

    // 5. Get daily sales trend (for charts)
    const dailySales = await Billing.findAll({
      attributes: [
        [fn('DATE', col('billing_date')), 'date'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total_amount')), 'total_amount']
      ],
      where,
      group: [fn('DATE', col('billing_date'))],
      order: [[fn('DATE', col('billing_date')), 'ASC']],
      raw: true
    });

    // 6. Get top selling days
    const topDays = await Billing.findAll({
      attributes: [
        [fn('DATE', col('billing_date')), 'date'],
        [fn('COUNT', col('id')), 'bills_count'],
        [fn('SUM', col('total_amount')), 'total_amount']
      ],
      where,
      group: [fn('DATE', col('billing_date'))],
      order: [[fn('SUM', col('total_amount')), 'DESC']],
      limit: 5,
      raw: true
    });

    // 7. Calculate averages
    const avgBillValue = totalBills > 0 ? totalSales / totalBills : 0;

    // 8. Merge split payment data with regular payment methods
    // Create a comprehensive payment method map
    const paymentMethodMap = {};
    
    // Add regular payment methods
    paymentMethodBreakdown.forEach(pm => {
      const method = pm.payment_method;
      paymentMethodMap[method] = {
        method: method,
        count: parseInt(pm.count),
        total_amount: parseFloat(pm.total_amount || 0),
        paid_amount: parseFloat(pm.paid_amount || 0),
        due_amount: parseFloat(pm.due_amount || 0)
      };
    });
    
    // Add/merge split payment breakdown
    Object.keys(splitPaymentMap).forEach(method => {
      if (paymentMethodMap[method]) {
        // Method already exists, add split amounts
        paymentMethodMap[method].count += splitPaymentMap[method].count;
        paymentMethodMap[method].total_amount += splitPaymentMap[method].total_amount;
        paymentMethodMap[method].paid_amount += splitPaymentMap[method].paid_amount;
        paymentMethodMap[method].due_amount += splitPaymentMap[method].due_amount;
      } else {
        // New method from split payments
        paymentMethodMap[method] = {
          method: method,
          count: splitPaymentMap[method].count,
          total_amount: splitPaymentMap[method].total_amount,
          paid_amount: splitPaymentMap[method].paid_amount,
          due_amount: splitPaymentMap[method].due_amount
        };
      }
    });

    // Format payment method breakdown with percentages — exclude 'split' row (already broken into sub-methods)
    // percentage is based on paid_amount (actual money collected per method)
    const totalPaid = Object.values(paymentMethodMap)
      .filter(pm => pm.method !== 'split')
      .reduce((s, pm) => s + pm.paid_amount, 0);

    const formattedPaymentMethods = Object.values(paymentMethodMap).filter(pm => pm.method !== 'split').map(pm => ({
      method: pm.method,
      count: pm.count,
      total_amount: pm.total_amount,
      paid_amount: pm.paid_amount,
      due_amount: pm.due_amount,
      percentage: totalPaid > 0 ? ((pm.paid_amount / totalPaid) * 100).toFixed(2) : 0
    }));

    // Format branch breakdown
    const formattedBranches = branchBreakdown.map(b => ({
      branch_id: b.branch_id,
      branch_name: b.branch?.branch_name || 'Unknown',
      branch_code: b.branch?.branch_code || 'N/A',
      count: parseInt(b.get('count')),
      total_amount: parseFloat(b.get('total_amount') || 0),
      paid_amount: parseFloat(b.get('paid_amount') || 0),
      percentage: totalSales > 0 ? ((parseFloat(b.get('total_amount') || 0) / totalSales) * 100).toFixed(2) : 0
    }));

    return {
      period,
      date_range: { start: sqlStart, end: sqlEnd },
      summary: {
        total_sales: parseFloat(totalSales || 0).toFixed(2),
        total_bills: totalBills,
        average_bill_value: parseFloat(avgBillValue).toFixed(2)
      },
      payment_methods: formattedPaymentMethods,
      branches: formattedBranches,
      daily_sales: dailySales.map(ds => ({
        date: ds.date,
        count: parseInt(ds.count),
        total_amount: parseFloat(ds.total_amount || 0)
      })),
      top_days: topDays.map(td => ({
        date: td.date,
        bills_count: parseInt(td.bills_count),
        total_amount: parseFloat(td.total_amount || 0)
      }))
    };
  },

  /**
   * Get source-wise billing report
   * @param {Object} params - { period, startDate, endDate, branch_ids }
   * @returns {Object} Source-wise report data
   */
  async getSourceWiseReport({ period, startDate, endDate, branch_ids }) {
    const { sequelizeFilter: dateFilter, startDate: sqlStart, endDate: sqlEnd } = this._buildDateFilter(period, startDate, endDate);

    // Build where clause
    const where = {
      ...dateFilter,
      status: { [Op.in]: ['paid', 'partially_paid'] },
      is_active: true
    };

    // Add branch filter
    if (branch_ids && branch_ids.length > 0) {
      where.branch_id = { [Op.in]: branch_ids };
    }

    // Get total sales for percentage calculation
    const totalSales = await Billing.sum('total_amount', { where });
    const totalBills = await Billing.count({ where });

    // Get source-wise breakdown — use b.source only (stored at billing time)
    // Old bills with NULL source are shown as 'Walk-in'
    const sourceBreakdown = await sequelize.query(`
      SELECT 
        COALESCE(b.source, 'Walk-in') as source,
        COUNT(b.id) as bills_count,
        SUM(b.total_amount) as total_amount,
        SUM(b.paid_amount) as paid_amount,
        SUM(b.due_amount) as due_amount,
        AVG(b.total_amount) as avg_bill_value,
        COUNT(DISTINCT b.customer_phone) as unique_customers
      FROM billing b
      WHERE b.billing_date BETWEEN :startDate AND :endDate
        AND b.status IN ('paid', 'partially_paid')
        AND b.is_active = 1
        ${branch_ids && branch_ids.length > 0 ? `AND b.branch_id IN (:branch_ids)` : ''}
      GROUP BY COALESCE(b.source, 'Walk-in')
      ORDER BY total_amount DESC
    `, {
      replacements: {
        startDate: sqlStart,
        endDate: sqlEnd,
        branch_ids: branch_ids || []
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Get top customers by source — use b.source only
    const topCustomersBySource = await sequelize.query(`
      SELECT 
        COALESCE(b.source, 'Walk-in') as source,
        COALESCE(c.customer_name, b.customer_name) as customer_name,
        b.customer_phone,
        COUNT(b.id) as bills_count,
        SUM(b.total_amount) as total_spent
      FROM billing b
      LEFT JOIN customers c ON b.customer_phone = c.customer_phone
      WHERE b.billing_date BETWEEN :startDate AND :endDate
        AND b.status IN ('paid', 'partially_paid')
        AND b.is_active = 1
        ${branch_ids && branch_ids.length > 0 ? `AND b.branch_id IN (:branch_ids)` : ''}
      GROUP BY COALESCE(b.source, 'Walk-in'), b.customer_phone, COALESCE(c.customer_name, b.customer_name)
      ORDER BY total_spent DESC
      LIMIT 10
    `, {
      replacements: {
        startDate: sqlStart,
        endDate: sqlEnd,
        branch_ids: branch_ids || []
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Format source breakdown with percentages
    const formattedSources = sourceBreakdown.map(s => ({
      source: s.source || 'Walk-in',
      bills_count: parseInt(s.bills_count),
      total_amount: parseFloat(s.total_amount || 0),
      paid_amount: parseFloat(s.paid_amount || 0),
      due_amount: parseFloat(s.due_amount || 0),
      avg_bill_value: parseFloat(s.avg_bill_value || 0),
      unique_customers: parseInt(s.unique_customers),
      percentage: totalSales > 0 ? ((parseFloat(s.total_amount || 0) / totalSales) * 100).toFixed(2) : 0
    }));

    // Format top customers
    const formattedTopCustomers = topCustomersBySource.map(c => ({
      source: c.source || 'Walk-in',
      customer_name: c.customer_name || 'Unknown',
      customer_phone: c.customer_phone,
      bills_count: parseInt(c.bills_count),
      total_spent: parseFloat(c.total_spent || 0)
    }));

    return {
      period,
      date_range: { start: sqlStart, end: sqlEnd },
      summary: {
        total_sales: parseFloat(totalSales || 0).toFixed(2),
        total_bills: totalBills,
        total_sources: formattedSources.length,
        average_bill_value: totalBills > 0 ? parseFloat(totalSales / totalBills).toFixed(2) : 0
      },
      sources: formattedSources,
      top_customers: formattedTopCustomers
    };
  }
};

export default reportService;
