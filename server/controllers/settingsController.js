import Settings from '../models/Settings.js';
import { asyncHandler } from '../utils/helpers.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';

const MANAGER_FIELDS = [
  'companyName', 'companyTagline', 'companyEmail', 'companyPhone',
  'companyAddress', 'companyWebsite', 'timezone', 'currency', 'dateFormat',
];

function sanitizeSettings(settings, role) {
  const doc = settings.toObject();
  delete doc.__v;

  if (role === 'admin') {
    if (doc.apiKeys) {
      doc.apiKeys = doc.apiKeys.map(({ name, createdAt, isActive, _id }) => ({
        _id, name, createdAt, isActive,
      }));
    }
    return doc;
  }

  if (role === 'manager') {
    const subset = {};
    for (const key of MANAGER_FIELDS) {
      if (doc[key] !== undefined) subset[key] = doc[key];
    }
    subset.companyLogo = doc.companyLogo;
    return subset;
  }

  return null;
}

export const getSettings = asyncHandler(async (req, res) => {
  const { role } = req.user;
  if (!['admin', 'manager'].includes(role)) {
    return res.status(403).json({ message: 'Not authorized to view system settings' });
  }

  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(sanitizeSettings(settings, role));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { role } = req.user;
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});

  if (role === 'admin') {
    const { apiKeys, integrations, emailConfig, smsConfig, ...safe } = req.body;
    Object.assign(settings, safe);
  } else if (role === 'manager') {
    for (const key of MANAGER_FIELDS) {
      if (req.body[key] !== undefined) settings[key] = req.body[key];
    }
  } else {
    return res.status(403).json({ message: 'Not authorized to update system settings' });
  }

  if (req.file && ['admin', 'manager'].includes(role)) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/settings');
    settings.companyLogo = result.url;
  }

  await settings.save();
  res.json(sanitizeSettings(settings, role));
});

export const addApiKey = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  const crypto = await import('crypto');
  const key = `myth_${crypto.randomBytes(24).toString('hex')}`;
  settings.apiKeys.push({ name: req.body.name, key });
  await settings.save();
  res.status(201).json({ name: req.body.name, key });
});

export const revokeApiKey = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne();
  const apiKey = settings.apiKeys.id(req.params.keyId);
  if (apiKey) apiKey.isActive = false;
  await settings.save();
  res.json({ message: 'API key revoked' });
});
