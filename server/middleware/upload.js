import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { isCloudinaryConfigured, uploadToLocal } from '../utils/fileStorage.js';

const memoryStorage = multer.memoryStorage();

const imageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const documentMimes = [
  ...imageMimes,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (imageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

export const documentUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (documentMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Use PDF, Word, Excel, image, or text files.'), false);
    }
  },
});

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });

export const uploadBufferToCloudinary = async (buffer, folder = 'mythisoft-crm', options = {}) => {
  const originalname = options.originalname || 'file';
  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(buffer, folder);
    } catch (err) {
      console.warn('Cloudinary upload failed, using local storage:', err.message);
    }
  }
  return uploadToLocal(buffer, folder, originalname);
};
