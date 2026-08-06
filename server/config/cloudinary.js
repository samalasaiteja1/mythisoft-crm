import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryConfigFromEnv, isCloudinaryConfigured } from '../utils/fileStorage.js';

if (isCloudinaryConfigured()) {
  const config = getCloudinaryConfigFromEnv();
  cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
  });
}

export default cloudinary;
