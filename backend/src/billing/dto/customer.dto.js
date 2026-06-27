import { z } from "zod";

export const createCustomerSchema = z.object({
    customer_name: z
        .string()
        .min(1, "Customer name is required")
        .max(100, "Customer name cannot exceed 100 characters"),
    customer_phone: z
        .string()
        .regex(/^[0-9]{10}$/, "Customer phone must be 10 digits"),
    customer_email: z
        .string()
        .email("Invalid email address")
        .max(100, "Email cannot exceed 100 characters")
        .optional(),
    address: z.string().max(500, "Address cannot exceed 500 characters").optional(),
    city: z.string().max(50, "City cannot exceed 50 characters").optional(),
    state: z.string().max(50, "State cannot exceed 50 characters").optional(),
    pincode: z.string().max(10, "Pincode cannot exceed 10 characters").optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    date_of_birth: z
        .string()
        .datetime("Date of birth must be a valid date")
        .optional(),
    anniversary_date: z
        .string()
        .datetime("Anniversary date must be a valid date")
        .optional(),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
    source: z.string().max(50, "Source cannot exceed 50 characters").optional(),
    is_active: z.boolean().optional().default(true),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const searchCustomerSchema = z.object({
    phone: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
});
