// src/middleware/validate.js
import { ZodError } from "zod";

/**
 * Generic validator middleware for Express using Zod schema
 * @param {Object} schemas - Zod schemas for validation
 * @param {ZodSchema} [schemas.body]
 * @param {ZodSchema} [schemas.query]
 * @param {ZodSchema} [schemas.params]
 * @returns {Function} Express middleware
 */
export const validate = (schemas = {}) => {
  return (req, res, next) => {
    try {
      console.log(req.body);
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        req.queryParams = schemas.query.parse(req.query);
      }

      if (schemas.params) {
        console.log("Params: ", req.params);
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          message: "Validation Error",
          errors: err.errors,
        });
      }

      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
};
