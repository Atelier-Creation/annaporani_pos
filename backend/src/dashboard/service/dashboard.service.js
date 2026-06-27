// services/dashboard.service.js
import { Op, fn, col } from "sequelize";
import Billing from "../../billing/models/billing.models.js";
import BillingItem from "../../billing/models/billingiteam.models.js";
import Product from "../../product/models/product.model.js";
import User from "../../user/models/user.model.js";
import Customer from "../../billing/models/customer.model.js";
import Stock from "../../stock/models/stock.models.js";
import Inward from "../../inward/models/inward.model.js";
import "../../billing/models/associations.js";

class DashboardService {
  /**
   * Get comprehensive dashboard data
   * @param {Array} branch_ids - Array of branch IDs user has access to
   * @param {String} period - 'today' | 'week' | 'month' | 'year'
   */
  async getDashboardData(branch_ids, period = 'today') {
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'yesterday': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        startDate = new Date(y.setHours(0, 0, 0, 0));
        endDate   = new Date(y.setHours(23, 59, 59, 999));
        break;
      }
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
    }

    const where = {
      branch_id: { [Op.in]: branch_ids },
      is_active: true
    };

    const periodWhere = {
      ...where,
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    // Parallel queries for better performance
    let [
      // Summary counts
      totalBills,
      totalUsers,
      totalProducts,
      totalCustomers,
      totalRevenue,
      
      // Period-specific data
      periodBills,
      periodRevenue,
      
      // Recent data
      recentBills,
      recentInwards,
      
      // Top products
      topProducts,
      
      // Low stock alerts
      lowStockProducts,
      
      // Payment method breakdown
      paymentMethods,
      
      // Daily revenue trend (last 7 days)
      dailyRevenue,
      
      // Stock summary
      totalStockValue,
      totalStockQuantity
    ] = await Promise.all([
      // Summary counts
      Billing.count({ where }),
      User.count(),
      Product.count({ where: { is_active: true } }),
      Customer.count({ where: { is_active: true } }),
      Billing.sum("total_amount", { where: { ...where, status: { [Op.in]: ['paid', 'partially_paid'] } } }),
      
      // Period-specific
      Billing.count({ where: periodWhere }),
      Billing.sum("total_amount", { where: { ...periodWhere, status: { [Op.in]: ['paid', 'partially_paid'] } } }),
      
      // Recent bills (last 10)
      Billing.findAll({
        where,
        limit: 10,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: BillingItem,
            as: "items",
            limit: 3,
            include: [{ model: Product, as: "product", attributes: ['product_name', 'product_code'] }]
          }
        ],
        attributes: ['id', 'billing_no', 'customer_name', 'customer_phone', 'total_amount', 'payment_method', 'status', 'createdAt']
      }),
      
      // Recent inwards (last 10)
      Inward.findAll({
        where: { branch_id: { [Op.in]: branch_ids } },
        limit: 10,
        order: [["createdAt", "DESC"]],
        attributes: ['id', 'inward_no', 'supplier_name', 'total_amount', 'status', 'createdAt']
      }),
      
      // Top 10 selling products
      BillingItem.findAll({
        attributes: [
          'product_id',
          [fn('SUM', col('quantity')), 'total_quantity'],
          [fn('SUM', col('total_price')), 'total_revenue'],
          [fn('COUNT', col('BillingItem.id')), 'order_count']
        ],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_name', 'product_code', 'selling_price']
          },
          {
            model: Billing,
            as: 'billing',
            where: { branch_id: { [Op.in]: branch_ids } },
            attributes: []
          }
        ],
        group: ['product_id', 'product.id'],
        order: [[fn('SUM', col('total_price')), 'DESC']],
        limit: 10,
        raw: false
      }),
      
      // Low stock products (quantity < 10)
      Stock.findAll({
        where: {
          branch_id: { [Op.in]: branch_ids },
          quantity: { [Op.lt]: 10 }
        },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_name', 'product_code']
          }
        ],
        order: [['quantity', 'ASC']],
        limit: 10
      }),
      
      // Payment method breakdown
      Billing.findAll({
        attributes: [
          'payment_method',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        where: periodWhere,
        group: ['payment_method'],
        raw: true
      }),
      
      // Daily revenue trend (last 7 days)
      Billing.findAll({
        attributes: [
          [fn('DATE', col('billing_date')), 'date'],
          [fn('COUNT', col('id')), 'bills_count'],
          [fn('SUM', col('total_amount')), 'revenue']
        ],
        where: {
          branch_id: { [Op.in]: branch_ids },
          billing_date: {
            [Op.between]: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]
          }
        },
        group: [fn('DATE', col('billing_date'))],
        order: [[fn('DATE', col('billing_date')), 'ASC']],
        raw: true
      }),
      
      // Stock value and quantity
      Stock.sum('quantity', { where: { branch_id: { [Op.in]: branch_ids } } }),
      Stock.count({ where: { branch_id: { [Op.in]: branch_ids } } })
    ]);

    // Fallback if no payment methods found for the selected period
    if (paymentMethods.length === 0) {
      paymentMethods = await Billing.findAll({
        attributes: [
          'payment_method',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        where,
        group: ['payment_method'],
        raw: true
      });
    }

    // Fallback if no daily revenue found for the selected period
    if (dailyRevenue.length === 0) {
      const latestBill = await Billing.findOne({
        where,
        order: [['billing_date', 'DESC']],
        attributes: ['billing_date']
      });
      
      if (latestBill && latestBill.billing_date) {
        const latestDate = new Date(latestBill.billing_date);
        const sevenDaysBeforeLatest = new Date(latestDate);
        sevenDaysBeforeLatest.setDate(latestDate.getDate() - 7);
        
        dailyRevenue = await Billing.findAll({
          attributes: [
            [fn('DATE', col('billing_date')), 'date'],
            [fn('COUNT', col('id')), 'bills_count'],
            [fn('SUM', col('total_amount')), 'revenue']
          ],
          where: {
            ...where,
            billing_date: {
              [Op.between]: [sevenDaysBeforeLatest, latestDate]
            }
          },
          group: [fn('DATE', col('billing_date'))],
          order: [[fn('DATE', col('billing_date')), 'ASC']],
          raw: true
        });
      }
    }

    return {
      summary: {
        totalBills,
        totalUsers,
        totalProducts,
        totalCustomers,
        totalRevenue: parseFloat(totalRevenue || 0).toFixed(2),
        periodBills,
        periodRevenue: parseFloat(periodRevenue || 0).toFixed(2),
        totalStockQuantity: totalStockQuantity || 0,
        lowStockCount: lowStockProducts.length
      },
      recentBills: recentBills.map(bill => ({
        id: bill.id,
        billing_no: bill.billing_no,
        customer_name: bill.customer_name,
        customer_phone: bill.customer_phone,
        total_amount: parseFloat(bill.total_amount).toFixed(2),
        payment_method: bill.payment_method,
        status: bill.status,
        items_count: bill.items?.length || 0,
        createdAt: bill.createdAt
      })),
      recentInwards: recentInwards.map(inward => ({
        id: inward.id,
        inward_no: inward.inward_no,
        supplier_name: inward.supplier_name,
        total_amount: parseFloat(inward.total_amount).toFixed(2),
        status: inward.status,
        createdAt: inward.createdAt
      })),
      topProducts: topProducts.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.product_name || 'Unknown',
        product_code: item.product?.product_code || 'N/A',
        total_quantity: parseInt(item.get('total_quantity')),
        total_revenue: parseFloat(item.get('total_revenue')).toFixed(2),
        order_count: parseInt(item.get('order_count'))
      })),
      lowStockProducts: lowStockProducts.map(stock => ({
        product_id: stock.product_id,
        product_name: stock.product?.product_name || 'Unknown',
        product_code: stock.product?.product_code || 'N/A',
        quantity: stock.quantity,
        size: stock.size,
        color: stock.color
      })),
      paymentMethods: paymentMethods.map(pm => ({
        method: pm.payment_method,
        count: parseInt(pm.count),
        total_amount: parseFloat(pm.total_amount || 0).toFixed(2)
      })),
      dailyRevenue: dailyRevenue.map(dr => ({
        date: dr.date,
        bills_count: parseInt(dr.bills_count),
        revenue: parseFloat(dr.revenue || 0).toFixed(2)
      })),
      period,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  }

  /**
   * Get summary counts for dashboard (legacy - kept for backward compatibility)
   */
  async getSummary(branch_ids) {
    const where = branch_ids ? { branch_id: { [Op.in]: branch_ids } } : {};
    
    const [totalBills, totalUsers, totalProducts, totalRevenue] = await Promise.all([
      Billing.count({ where }),
      User.count(),
      Product.count(),
      Billing.sum("total_amount", { where }),
    ]);

    return {
      totalBills,
      totalUsers,
      totalProducts,
      totalRevenue: totalRevenue || 0,
    };
  }

  /**
   * Get recent 5 bills with items (legacy)
   */
  async getRecentBills(branch_ids) {
    const where = branch_ids ? { branch_id: { [Op.in]: branch_ids } } : {};
    
    const bills = await Billing.findAll({
      where,
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: BillingItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
            },
          ],
        },
      ],
    });
    return bills;
  }

  /**
   * Get revenue grouped by date (last 7 days) (legacy)
   */
  async getRevenueByDate(branch_ids) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const where = {
      createdAt: {
        [Op.between]: [sevenDaysAgo, today],
      }
    };
    
    if (branch_ids) {
      where.branch_id = { [Op.in]: branch_ids };
    }

    const revenue = await Billing.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("SUM", col("total_amount")), "totalRevenue"],
      ],
      where,
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
    });

    return revenue;
  }
}

export default new DashboardService();
