import responseHelper from './responseHelper.js';
import express from 'express';
import qs from 'qs';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import cors from 'cors';
import jsonErrorHandler from './errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "..", "public");

function registerMiddleware(app) {
  // Use qs for advanced query parsing
  app.set("query parser", str => qs.parse(str));

  // Built-in JSON & URL-encoded parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }));

  // Logger
  app.use(morgan("dev"));

  // Static files
  app.use("/public", express.static(publicPath));

  //  Serve uploads folder
  const uploadsPath = path.join(process.cwd(), "uploads");
  console.log("📂 Serving uploads from:", uploadsPath); // debug log
  app.use("/uploads", express.static(uploadsPath));

  // Custom response helper
  app.use(responseHelper);
}

function registerMiddlewareAtLast(app) {
  app.use(jsonErrorHandler);

  app.use((req, res) => {
    res.sendError("Route not found", 404);
  });
}

export { registerMiddleware, registerMiddlewareAtLast };