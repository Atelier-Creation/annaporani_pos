// services/stock.service.js
import Stock from "../models/stock.models.js";
import Product from "../../product/models/product.model.js";
import Branch from "../../user/models/branch.model.js";
import { Op } from "sequelize";

const stockService = {
    // ✅ Add new stock
    async addStock(data) {
        // Check if product exists
        const product = await Product.findByPk(data.product_id);
        if (!product) throw new Error("Product not found. Cannot add stock.");

        // Optional: check if batch exists for same product (only if batch_number is provided)
        if (data.batch_number) {
            const existingStock = await Stock.findOne({
                where: {
                    product_id: data.product_id,
                    batch_number: data.batch_number,
                },
            });

            if (existingStock) {
                // Update quantity if same batch exists
                existingStock.quantity += data.quantity;
                await existingStock.save();
                return existingStock;
            }
        } else {
            // Check for existing stock by product, branch, size, and color
            const whereClause = {
                product_id: data.product_id,
                branch_id: data.branch_id,
            };
            
            if (data.size) whereClause.size = data.size;
            if (data.color) whereClause.color = data.color;

            const existingStock = await Stock.findOne({ where: whereClause });

            if (existingStock) {
                // Update quantity if same product/branch/size/color exists
                existingStock.quantity += data.quantity;
                existingStock.inward_quantity += data.quantity;
                await existingStock.save();
                return existingStock;
            }
        }

        // Create new stock record
        return await Stock.create(data);
    },

   async addBulkStock(stockArray) {
    const results = [];

    for (let data of stockArray) {
        try {
            // 1. Check if product exists by name
            const product = await Product.findOne({
                where: { product_name: data.product_name }
            });

            if (!product) {
                results.push({
                    success: false,
                    error: `Product not found: ${data.product_name}`,
                    data
                });
                continue;
            }

            // 2. Replace product_name with product_id
            const stockData = {
                product_id: product.id,
                quantity: data.quantity,
                unit: data.unit,
                cost_price: data.cost_price,
                selling_price: data.selling_price,
                created_by: data.created_by,
                created_by_name: data.created_by_name,
                created_by_email: data.created_by_email,
            };

            // 3. Reuse single stock function
            const stock = await this.addStock(stockData);

            results.push({ success: true, stock });

        } catch (err) {
            results.push({
                success: false,
                error: err.message,
                data
            });
        }
    }

    return results;
},


// 🔍 Helper function to get product by name
async findProductByName(name) {
    return await Product.findOne({ where: { product_name: name } });
},



    // ✅ Get all stock records with filters & pagination
    async getAllStock({ filters = {}, limit = 10, offset = 0 } = {}) {
        const where = { is_active: true };

        // Filter by branch_id or branch_ids
        if (filters.branch_id) {
            where.branch_id = filters.branch_id;
        } else if (filters.branch_ids && filters.branch_ids.length > 0) {
            where.branch_id = { [Op.in]: filters.branch_ids };
        }
        
        if (filters.product_id) where.product_id = filters.product_id;
        if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
        if (filters.batch_number) where.batch_number = { [Op.like]: `%${filters.batch_number}%` };
        if (filters.supplier) where.supplier = { [Op.like]: `%${filters.supplier}%` };

        const { count, rows } = await Stock.findAndCountAll({
            where,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                { 
                    model: Product, 
                    as: "product", 
                    attributes: ["product_name", "product_code", "unit"] 
                },
                {
                    model: Branch,
                    as: "branch",
                    attributes: ["id", "branch_name", "branch_code", "city"],
                },
            ],
        });

        return {
            total: count,
            page: Math.floor(offset / limit) + 1,
            limit,
            data: rows,
        };
    },

    // ✅ Get stock by ID
    async getStockById(id) {
        const stock = await Stock.findByPk(id, {
            include: [
                { 
                    model: Product, 
                    as: "product", 
                    attributes: ["product_name", "product_code", "unit"] 
                },
                {
                    model: Branch,
                    as: "branch",
                    attributes: ["id", "branch_name", "branch_code", "city"],
                },
            ],
        });
        if (!stock) throw new Error("Stock record not found");
        return stock;
    },

    // ✅ Update stock
    async updateStock(id, data) {
        const stock = await Stock.findByPk(id);
        if (!stock) throw new Error("Stock record not found");

        await stock.update(data);
        return stock;
    },

    // ✅ Soft delete stock
    async deleteStock(id) {
        const stock = await Stock.findByPk(id);
        if (!stock) throw new Error("Stock record not found");

        stock.is_active = false;
        await stock.save();
        return { message: "Stock record soft deleted successfully" };
    },
};

export default stockService;
