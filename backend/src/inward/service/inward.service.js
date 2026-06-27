// services/inward.service.js
import { Op } from "sequelize";
import { sequelize } from "../../db/index.js";
import Inward from "../models/inward.model.js";
import InwardItem from "../models/inwarditeam.model.js";
import Product from '../../product/models/product.model.js';
import Stock from '../../stock/models/stock.models.js';
import Branch from '../../user/models/branch.model.js';
// Import associations to ensure they're loaded
import '../models/index.js';

const inwardService = {
 async createInwardWithItems(data) {
  return await sequelize.transaction(async (t) => {
    try {
      console.log("=== CREATE INWARD WITH ITEMS START ===");
      console.log("Input data:", JSON.stringify(data, null, 2));
      
      // Validate branch_id
      if (!data.branch_id) {
        throw new Error("Branch ID is required");
      }

      // 1️⃣ Generate inward_no automatically (GLOBAL across all branches)
      const lastInward = await Inward.findOne({
        order: [["createdAt", "DESC"]], // Remove branch_id filter for global sequence
        transaction: t,
      });
      const lastNo = lastInward
        ? parseInt(lastInward.inward_no.split("-")[1])
        : 1000;
      const inwardNo = `INV-${lastNo + 1}`;
      
      console.log("Generated inward_no (global):", inwardNo);

    // 2️⃣ Validate products and prepare items
    let totalAmount = 0;
    let totalQuantity = 0;
    const itemsToCreate = [];

    if (!data.items || data.items.length === 0) {
      throw new Error("Inward must have at least one item");
    }

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];

      // Check if product exists
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} does not exist`);
      }

      // Auto-generate batch_number if not provided
      const batchNumber =
        item.batch_number || `BATCH-${String(i + 1).padStart(3, "0")}`;

      const quantity = item.quantity || 0;
      const unitPrice = item.unit_price || 0;
      const totalPrice = item.total_price || quantity * unitPrice;

      totalAmount += totalPrice;
      totalQuantity += quantity;

      const itemData = {
        product_id: item.product_id,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        unit: item.unit || product.unit || "piece",
        batch_number: batchNumber,
      };
      
      // Only add optional fields if they exist
      if (item.size) itemData.size = item.size;
      if (item.color) itemData.color = item.color;
      if (item.barcode) itemData.barcode = item.barcode;
      if (item.expiry_date) itemData.expiry_date = item.expiry_date;
      
      itemsToCreate.push(itemData);

      // 3️⃣ Update Stock Table (with branch_id)
      const stock = await Stock.findOne({
        where: { 
          product_id: item.product_id,
          branch_id: data.branch_id 
        },
        transaction: t,
      });

      if (stock) {
        // If stock exists → increment quantities
        stock.quantity += quantity;
        stock.inward_quantity += quantity;
        await stock.save({ transaction: t });
      } else {
        // If stock doesn't exist → create new stock record
        await Stock.create(
          {
            branch_id: data.branch_id,
            product_id: product.id,
            unit: product.unit,
            cost_price: product.purchase_price,
            selling_price: product.selling_price,
            quantity: quantity,
            inward_quantity: quantity,
            billing_quantity: 0,
            customer_billing_quantity: 0,
          },
          { transaction: t }
        );
      }
    }

    // 4️⃣ Create Inward (with branch_id)
    console.log("=== CREATING INWARD RECORD ===");
    const inwardData = {
      branch_id: data.branch_id,
      inward_no: inwardNo,
      supplier_name: data.supplier_name,
      supplier_invoice: data.supplier_invoice || null,
      status: data.status || "pending",
      received_date: data.received_date || new Date(),
      total_amount: totalAmount,
      total_quantity: totalQuantity,
      created_by: data.created_by,
      created_by_name: data.created_by_name,
      created_by_email: data.created_by_email,
    };
    console.log("Inward data to create:", JSON.stringify(inwardData, null, 2));
    
    const inward = await Inward.create(inwardData, { transaction: t });
    console.log("Inward created successfully with ID:", inward.id);

    // 5️⃣ Create Inward Items
    const itemsWithInwardId = itemsToCreate.map((item) => ({
      ...item,
      inward_id: inward.id,
    }));
    
    console.log("=== CREATING INWARD ITEMS ===");
    console.log("Items to create:", JSON.stringify(itemsWithInwardId, null, 2));
    
    try {
      await InwardItem.bulkCreate(itemsWithInwardId, { transaction: t });
    } catch (itemError) {
      console.error("=== INWARD ITEM CREATION ERROR ===");
      console.error("Error name:", itemError.name);
      console.error("Error message:", itemError.message);
      console.error("Validation errors:", itemError.errors);
      console.error("Full error:", JSON.stringify(itemError, null, 2));
      throw itemError;
    }

    // 6️⃣ Return the inward with items
    return await Inward.findByPk(inward.id, {
      include: [{ model: InwardItem, as: "items" }],
      transaction: t,
    });
    } catch (error) {
      console.error("=== CREATE INWARD WITH ITEMS ERROR ===");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      if (error.errors) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
      }
      console.error("Error stack:", error.stack);
      throw error;
    }
  });
},

  // ✅ Get All Inwards with Filters + Pagination
  async getAllInwards({ filters = {}, limit = 10, offset = 0 } = {}) {
    const where = {};

    // Filter by branch_id or branch_ids
    if (filters.branch_id) {
      where.branch_id = filters.branch_id;
    } else if (filters.branch_ids && filters.branch_ids.length > 0) {
      where.branch_id = { [Op.in]: filters.branch_ids };
    }

    if (filters.inward_no) {
      where.inward_no = { [Op.like]: `%${filters.inward_no}%` };
    }
    if (filters.supplier_name) {
      where.supplier_name = { [Op.like]: `%${filters.supplier_name}%` };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.received_date) {
      where.received_date = filters.received_date;
    }

    const { count, rows } = await Inward.findAndCountAll({
      where,
      distinct: true,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: InwardItem,
          as: "items",
          attributes: [
            "id",
            "product_id",
            "quantity",
            "unit_price",
            "total_price",
            "unit",
            "size",
            "color",
            "barcode",
            "expiry_date",
            "batch_number",
          ],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "product_name", "product_code", "unit", "purchase_price", "selling_price"],
            },
          ],
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

  // ✅ Get Inward by ID
  async getInwardById(id) {
    return await Inward.findByPk(id, {
      include: [
        {
          model: InwardItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "product_name", "product_code", "unit", "purchase_price", "selling_price"],
            },
          ],
        },
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "branch_name", "branch_code", "city"],
        },
      ],
    });
  },

  // ✅ Update Inward with Items
  async updateInwardWithItems(id, data) {
    return await sequelize.transaction(async (t) => {
      const inward = await Inward.findByPk(id, { 
        include: [{ model: InwardItem, as: "items" }],
        transaction: t 
      });
      
      if (!inward) return null;

      console.log("=== UPDATE INWARD WITH ITEMS START ===");
      console.log("Inward ID:", id);
      console.log("Old items:", JSON.stringify(inward.items, null, 2));
      console.log("New items:", JSON.stringify(data.items, null, 2));

      // 1. Update Inward header
      await inward.update(
        {
          supplier_name: data.supplier_name || inward.supplier_name,
          supplier_invoice: data.supplier_invoice || inward.supplier_invoice,
          status: data.status || inward.status,
          received_date: data.received_date || inward.received_date,
          updated_by: data.updated_by,
          updated_by_name: data.updated_by_name,
          updated_by_email: data.updated_by_email,
        },
        { transaction: t }
      );

      // 2. If items exist → adjust stock and replace items
      if (data.items && data.items.length > 0) {
        // Step A: Calculate net changes for each product
        console.log("=== CALCULATING NET STOCK CHANGES ===");
        const stockChanges = new Map(); // product_id -> { netChange, oldQty, newQty }
        
        // Collect old quantities
        for (const oldItem of inward.items) {
          stockChanges.set(oldItem.product_id, { 
            oldQty: oldItem.quantity, 
            newQty: 0,
            netChange: 0
          });
        }
        
        // Collect new quantities and calculate net changes
        for (const newItem of data.items) {
          const existing = stockChanges.get(newItem.product_id);
          const newQty = newItem.quantity || 0;
          
          if (existing) {
            existing.newQty = newQty;
            existing.netChange = newQty - existing.oldQty;
          } else {
            stockChanges.set(newItem.product_id, { 
              oldQty: 0, 
              newQty: newQty,
              netChange: newQty
            });
          }
        }
        
        // Step B: Validate and apply stock changes
        console.log("=== VALIDATING AND APPLYING STOCK CHANGES ===");
        for (const [productId, change] of stockChanges.entries()) {
          const stock = await Stock.findOne({
            where: { 
              product_id: productId,
              branch_id: inward.branch_id 
            },
            transaction: t,
          });
          
          if (stock) {
            const newQuantity = stock.quantity + change.netChange;
            const newInwardQuantity = stock.inward_quantity + change.netChange;
            
            console.log(`Product ${productId}:`);
            console.log(`  Old inward: ${change.oldQty}, New inward: ${change.newQty}, Net change: ${change.netChange}`);
            console.log(`  Current stock: ${stock.quantity}, After adjustment: ${newQuantity}`);
            console.log(`  Current inward_qty: ${stock.inward_quantity}, After adjustment: ${newInwardQuantity}`);
            
            // Validate before applying
            if (newQuantity < 0) {
              const product = await Product.findByPk(productId, { transaction: t });
              const productName = product ? product.product_name : productId;
              
              throw new Error(
                `Cannot reduce inward quantity for "${productName}". ` +
                `Current available stock: ${stock.quantity} units. ` +
                `You are trying to reduce by ${Math.abs(change.netChange)} units. ` +
                `This would result in negative stock (${newQuantity} units). ` +
                `Likely ${stock.billing_quantity + stock.customer_billing_quantity} units have already been billed.`
              );
            }
            
            if (newInwardQuantity < 0) {
              const product = await Product.findByPk(productId, { transaction: t });
              const productName = product ? product.product_name : productId;
              
              throw new Error(
                `Cannot reduce inward quantity for "${productName}". ` +
                `Current inward quantity: ${stock.inward_quantity} units. ` +
                `You are trying to reduce by ${Math.abs(change.netChange)} units. ` +
                `This would result in negative inward quantity (${newInwardQuantity} units).`
              );
            }
            
            // Apply the net change directly (no temporary negative values)
            stock.quantity = newQuantity;
            stock.inward_quantity = newInwardQuantity;
            
            await stock.save({ transaction: t });
            console.log(`  ✅ Stock updated successfully`);
            
          } else if (change.netChange > 0) {
            // Product doesn't have stock yet, create new stock record
            const product = await Product.findByPk(productId, { transaction: t });
            if (!product) {
              throw new Error(`Product with ID ${productId} does not exist`);
            }
            
            console.log(`Product ${productId}: Creating new stock with ${change.newQty} units`);
            await Stock.create(
              {
                branch_id: inward.branch_id,
                product_id: productId,
                unit: product.unit,
                cost_price: product.purchase_price,
                selling_price: product.selling_price,
                quantity: change.newQty,
                inward_quantity: change.newQty,
                billing_quantity: 0,
                customer_billing_quantity: 0,
              },
              { transaction: t }
            );
          }
        }

        // Step C: Delete old items
        await InwardItem.destroy({
          where: { inward_id: id },
          transaction: t,
        });

        // Step D: Create new items
        console.log("=== CREATING NEW INWARD ITEMS ===");
        let totalAmount = 0;
        let totalQuantity = 0;
        const itemsToCreate = [];

        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];

          // Validate product exists
          const product = await Product.findByPk(item.product_id, { transaction: t });
          if (!product) {
            throw new Error(`Product with ID ${item.product_id} does not exist`);
          }

          // Auto-generate batch_number if not provided
          const batchNumber = item.batch_number || `BATCH-${String(i + 1).padStart(3, "0")}`;

          const quantity = item.quantity || 0;
          const unitPrice = item.unit_price || 0;
          const totalPrice = item.total_price || quantity * unitPrice;

          totalAmount += totalPrice;
          totalQuantity += quantity;

          const itemData = {
            inward_id: id,
            product_id: item.product_id,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            unit: item.unit || product.unit || "piece",
            batch_number: batchNumber,
          };
          
          // Add optional fields
          if (item.size) itemData.size = item.size;
          if (item.color) itemData.color = item.color;
          if (item.barcode) itemData.barcode = item.barcode;
          if (item.expiry_date) itemData.expiry_date = item.expiry_date;
          
          itemsToCreate.push(itemData);
        }

        await InwardItem.bulkCreate(itemsToCreate, { transaction: t });

        // Step E: Update inward totals
        await inward.update(
          {
            total_amount: totalAmount,
            total_quantity: totalQuantity,
          },
          { transaction: t }
        );
      }

      console.log("=== UPDATE INWARD WITH ITEMS COMPLETE ===");

      // Return updated inward with items
      return await Inward.findByPk(id, {
        include: [
          { 
            model: InwardItem, 
            as: "items",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "product_name", "product_code"],
              },
            ],
          },
          {
            model: Branch,
            as: "branch",
            attributes: ["id", "branch_name", "branch_code"],
          },
        ],
        transaction: t,
      });
    });
  },

  // ✅ Delete Inward with Items (soft delete)
  async deleteInwardWithItems(id, user) {
    return await sequelize.transaction(async (t) => {
      const inward = await Inward.findByPk(id, { transaction: t });
      if (!inward) return null;

      // soft delete inward
      await inward.update(
        {
          is_active: false,
          deleted_by: user.id || null,
          deleted_by_name: user.username || user.name || null,
          deleted_by_email: user.email || null,
        },
        { transaction: t }
      );

      // soft delete inward items (if InwardItem has is_active field)
      // await InwardItem.update(
      //   { is_active: false },
      //   { where: { inward_id: id }, transaction: t }
      // );

      return { message: "Inward and its items soft deleted successfully" };
    });
  },
};

export default inwardService;
