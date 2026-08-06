import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const PLACEHOLDER_VALUES = new Set([
  '',
  'demo',
  'your_cloud_name',
  'your_api_key',
  'your_api_secret',
]);

export function getCloudinaryConfigFromEnv() {
  const urlValue = String(process.env.CLOUDINARY_URL || '').trim();
  if (urlValue.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(urlValue);
      const cloud = parsed.host;
      const key = parsed.username;
      const secret = parsed.password;
      if (cloud && key && secret) {
        return { cloud_name: cloud, api_key: key, api_secret: secret };
      }
    } catch {
      // fall back to explicit environment variables below
    }
  }

  return {
    cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key: String(process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: String(process.env.CLOUDINARY_API_SECRET || '').trim(),
  };
}

export function isCloudinaryConfigured() {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfigFromEnv();
  if (!cloud_name || !api_key || !api_secret) return false;
  if (PLACEHOLDER_VALUES.has(cloud_name) || PLACEHOLDER_VALUES.has(api_key) || PLACEHOLDER_VALUES.has(api_secret)) {
    return false;
  }
  return true;
}

function publicUploadUrl(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `/api/uploads/${normalized}`;
}

export async function uploadToLocal(buffer, folder, originalname = 'file') {
  const safeFolder = String(folder || 'files').replace(/[^a-zA-Z0-9/_-]/g, '_');
  const dir = path.join(UPLOADS_ROOT, safeFolder);
  await fs.promises.mkdir(dir, { recursive: true });

  const ext = path.extname(originalname || '') || '';
  const base = path.basename(originalname || 'file', ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${base || 'file'}${ext}`;
  const filePath = path.join(dir, filename);
  await fs.promises.writeFile(filePath, buffer);

  const relative = `${safeFolder}/${filename}`;
  return { url: publicUploadUrl(relative), publicId: relative };
}
