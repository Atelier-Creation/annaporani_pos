import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://blr1.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'blr1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || 'DO801CYUJYUAD9ANYGFQ',
    secretAccessKey: process.env.DO_SPACES_SECRET || 'dMoUOlwk5nFvNe7gGP71RoXgsMMdXLCBwGnRnGfxhXU',
  },
  forcePathStyle: false,
});

const BUCKET = process.env.DO_SPACES_BUCKET || 'flexculture';
const CDN_BASE = process.env.DO_SPACES_CDN || 'https://flexculture.blr1.cdn.digitaloceanspaces.com';

const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp, gif) are allowed'), false);
  }
};

// Multer upload for product images → stored in "products/" folder
export const uploadProductImage = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `products/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});

// Helper: get CDN URL from the S3 location
export const getCdnUrl = (location) => {
  if (!location) return null;
  // Replace bucket endpoint with CDN base
  const key = location.replace(`https://${BUCKET}.blr1.digitaloceanspaces.com/`, '');
  return `${CDN_BASE}/${key}`;
};

export { s3Client, BUCKET, CDN_BASE };
