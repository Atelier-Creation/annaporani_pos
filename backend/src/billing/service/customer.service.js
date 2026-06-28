import Customer from '../models/customer.model.js';
import Billing from '../models/billing.models.js';
import BillingItem from '../models/billingiteam.models.js';
import Product from '../../product/models/product.model.js';
import { Op } from 'sequelize';
import { sequelize } from '../../db/index.js';

const customerService = {
    // Create or get customer by phone
    async findOrCreateCustomer(customerData, created_by, options = {}) {
        const { customer_phone, customer_name, customer_email, source } = customerData;
        const queryOptions = options.transaction ? { transaction: options.transaction } : {};

        // Check if customer exists by phone
        let customer = await Customer.findOne({
            where: { customer_phone },
            ...queryOptions
        });

        if (customer) {
            // Update customer fields if provided and different
            const updates = {};
            if (customer_name && customer.customer_name !== customer_name) updates.customer_name = customer_name;
            if (customer_email && customer.customer_email !== customer_email) updates.customer_email = customer_email;
            if (source && customer.source !== source) updates.source = source;

            if (Object.keys(updates).length > 0) {
                await customer.update({ ...updates, updated_by: created_by }, queryOptions);
            }
            return customer;
        }

        // Create new customer
        try {
            customer = await Customer.create({
                customer_name: customer_name || 'Guest',
                customer_phone,
                customer_email,
                source,
                created_by
            }, queryOptions);
        } catch (err) {
            if (err.name !== 'SequelizeUniqueConstraintError') {
                throw err;
            }

            customer = await Customer.findOne({
                where: { customer_phone },
                ...queryOptions
            });
            if (!customer) throw err;
        }

        return customer;
    },

    // Create customer
    async createCustomer(data, created_by) {
        const exists = await Customer.findOne({
            where: { customer_phone: data.customer_phone }
        });

        if (exists) {
            throw new Error('Customer with this phone number already exists');
        }

        return await Customer.create({
            ...data,
            created_by
        });
    },

    // Bulk create customers from uploaded data
    async bulkCreateCustomers(rows, created_by) {
        const results = { success: [], skipped: [], failed: [] };

        for (const [index, row] of rows.entries()) {
            const rowNum = index + 2; // Excel row number (1=header)
            try {
                const phone = String(row.customer_phone || '').trim();
                const name  = String(row.customer_name  || '').trim();

                if (!phone || !name) {
                    results.failed.push({ row: rowNum, name, phone, reason: 'Name and Phone are required' });
                    continue;
                }
                if (!/^\d{10}$/.test(phone)) {
                    results.failed.push({ row: rowNum, name, phone, reason: 'Phone must be 10 digits' });
                    continue;
                }

                const existing = await Customer.findOne({ where: { customer_phone: phone } });
                if (existing) {
                    results.skipped.push({ row: rowNum, name, phone, reason: 'Phone already exists' });
                    continue;
                }

                await Customer.create({
                    customer_name:    name,
                    customer_phone:   phone,
                    customer_email:   row.customer_email  ? String(row.customer_email).trim()  : null,
                    address:          row.address         ? String(row.address).trim()         : null,
                    city:             row.city            ? String(row.city).trim()            : null,
                    state:            row.state           ? String(row.state).trim()           : null,
                    pincode:          row.pincode         ? String(row.pincode).trim()         : null,
                    gender:           ['Male','Female','Other'].includes(row.gender) ? row.gender : null,
                    source:           row.source          ? String(row.source).trim()          : null,
                    notes:            row.notes           ? String(row.notes).trim()           : null,
                    created_by,
                });
                results.success.push({ row: rowNum, name, phone });
            } catch (err) {
                results.failed.push({ row: rowNum, name: row.customer_name, phone: row.customer_phone, reason: err.message });
            }
        }
        return results;
    },

    // Get all customers
    async getAllCustomers(filters = {}) {
        const where = { is_active: true };

        if (filters.search) {
            where[Op.or] = [
                { customer_phone: { [Op.like]: `%${filters.search}%` } },
                { customer_name: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        if (filters.phone) {
            where.customer_phone = { [Op.like]: `%${filters.phone}%` };
        }

        if (filters.name) {
            where.customer_name = { [Op.like]: `%${filters.name}%` };
        }

        if (filters.email) {
            where.customer_email = { [Op.like]: `%${filters.email}%` };
        }

        const queryOptions = {
            where,
            order: [['createdAt', 'DESC']]
        };

        if (filters.limit) {
            queryOptions.limit = parseInt(filters.limit) || 5;
        }

        return await Customer.findAll(queryOptions);
    },

    // Get customer by ID
    async getCustomerById(id) {
        const customer = await Customer.findByPk(id);
        if (!customer) {
            throw new Error('Customer not found');
        }
        return customer;
    },

    // Get customer by phone
    async getCustomerByPhone(phone) {
        const customer = await Customer.findOne({
            where: { customer_phone: phone }
        });
        return customer;
    },

    // Update customer
    async updateCustomer(id, data, updated_by) {
        const customer = await Customer.findByPk(id);
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Check if phone is being changed and if it already exists
        if (data.customer_phone && data.customer_phone !== customer.customer_phone) {
            const exists = await Customer.findOne({
                where: { 
                    customer_phone: data.customer_phone,
                    id: { [Op.ne]: id }
                }
            });

            if (exists) {
                throw new Error('Customer with this phone number already exists');
            }
        }

        return await customer.update({
            ...data,
            updated_by
        });
    },

    // Soft delete customer
    async deleteCustomer(id) {
        const customer = await Customer.findByPk(id);
        if (!customer) {
            throw new Error('Customer not found');
        }

        await customer.update({ is_active: false });
        return true;
    },

    // Get customer purchase history
    async getCustomerHistory(customerId) {
        const customer = await Customer.findByPk(customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Get all billings for this customer using phone number
        const billings = await Billing.findAll({
            where: { 
                customer_phone: customer.customer_phone,
                is_active: true 
            },
            include: [
                {
                    model: BillingItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'product_name', 'product_code']
                        }
                    ]
                }
            ],
            order: [['billing_date', 'DESC']]
        });

        // Calculate statistics
        const totalPurchases = billings.length;
        const totalAmount = billings.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
        
        // Get last purchase
        const lastPurchase = billings.length > 0 ? {
            date: billings[0].billing_date,
            amount: billings[0].total_amount,
            billing_no: billings[0].billing_no
        } : null;

        // Get top products
        const productMap = {};
        billings.forEach(billing => {
            billing.items.forEach(item => {
                const productId = item.product_id;
                if (!productMap[productId]) {
                    productMap[productId] = {
                        product_id: productId,
                        product_name: item.product?.product_name || 'Unknown',
                        product_code: item.product?.product_code || 'N/A',
                        total_quantity: 0,
                        total_amount: 0,
                        purchase_count: 0
                    };
                }
                productMap[productId].total_quantity += item.quantity;
                productMap[productId].total_amount += parseFloat(item.total_price);
                productMap[productId].purchase_count += 1;
            });
        });

        const topProducts = Object.values(productMap)
            .sort((a, b) => b.total_amount - a.total_amount)
            .slice(0, 10);

        // Get size and color preferences
        const sizeMap = {};
        const colorMap = {};
        billings.forEach(billing => {
            billing.items.forEach(item => {
                if (item.size) {
                    sizeMap[item.size] = (sizeMap[item.size] || 0) + item.quantity;
                }
                if (item.color) {
                    colorMap[item.color] = (colorMap[item.color] || 0) + item.quantity;
                }
            });
        });

        const preferredSizes = Object.entries(sizeMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([size, count]) => ({ size, count }));

        const preferredColors = Object.entries(colorMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([color, count]) => ({ color, count }));

        return {
            customer: {
                id: customer.id,
                name: customer.customer_name,
                phone: customer.customer_phone,
                email: customer.customer_email,
                address: customer.address,
                city: customer.city,
                state: customer.state,
                gender: customer.gender,
                date_of_birth: customer.date_of_birth,
                anniversary_date: customer.anniversary_date
            },
            statistics: {
                total_purchases: totalPurchases,
                total_amount: parseFloat(totalAmount.toFixed(2)),
                average_purchase_value: totalPurchases > 0 ? parseFloat((totalAmount / totalPurchases).toFixed(2)) : 0,
                last_purchase: lastPurchase
            },
            top_products: topProducts,
            preferences: {
                sizes: preferredSizes,
                colors: preferredColors
            },
            recent_purchases: billings.slice(0, 10).map(bill => ({
                id: bill.id,
                billing_no: bill.billing_no,
                billing_date: bill.billing_date,
                total_amount: bill.total_amount,
                total_quantity: bill.total_quantity,
                payment_method: bill.payment_method,
                status: bill.status,
                items_count: bill.items.length,
                items: bill.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    product_name: item.product?.product_name || 'Unknown',
                    product_code: item.product?.product_code || 'N/A',
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                    discount_amount: item.discount_amount,
                    tax_amount: item.tax_amount
                }))
            }))
        };
    },

    // Get customer analytics
    async getCustomerAnalytics(customerId, startDate, endDate) {
        const customer = await Customer.findByPk(customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }

        const where = {
            customer_phone: customer.customer_phone,
            is_active: true
        };

        if (startDate && endDate) {
            where.billing_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const billings = await Billing.findAll({
            where,
            include: [
                {
                    model: BillingItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ]
        });

        // Monthly spending
        const monthlySpending = {};
        billings.forEach(bill => {
            const month = new Date(bill.billing_date).toISOString().slice(0, 7); // YYYY-MM
            monthlySpending[month] = (monthlySpending[month] || 0) + parseFloat(bill.total_amount);
        });

        return {
            customer_id: customerId,
            period: { start_date: startDate, end_date: endDate },
            total_purchases: billings.length,
            total_spent: billings.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0),
            monthly_spending: Object.entries(monthlySpending).map(([month, amount]) => ({
                month,
                amount: parseFloat(amount.toFixed(2))
            }))
        };
    }
};

export default customerService;
