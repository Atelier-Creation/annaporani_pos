import { z } from "zod";

export const createStockSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  // Dress Shop Specific Fields
  size: z.string().max(20, "Size cannot exceed 20 characters").optional(),
  color: z.string().max(50, "Color cannot exceed 50 characters").optional(),
  warehouse_id: z.string().uuid().optional(),
  batch_number: z.string().max(100).optional(),
  quantity: z.number().min(0),
  unit: z.string().max(50).default('piece'),
  cost_price: z.number().min(0),
  selling_price: z.number().min(0),
  mrp: z.number().min(0).optional(),

  received_date: z
    .preprocess(arg => {
      if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    }, z.date())
    .optional(),

  expiry_date: z
    .preprocess(arg => {
      if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    }, z.date())
    .optional(),

  barcode: z.string().max(100).optional(),
  sku: z.string().max(100).optional(),
  supplier: z.string().max(100).optional(),
  remarks: z.string().max(500).optional(),
  is_active: z.boolean().optional().default(true),
});

// Update schema for updates
export const updateStockSchema = createStockSchema.partial();
