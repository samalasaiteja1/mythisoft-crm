import Document from '../models/Document.js';
import Project from '../models/Project.js';
import { asyncHandler } from '../utils/helpers.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';
import { logActivity } from './authController.js';
import { isTechnicalManager, getTechnicalManagerDocumentFilter } from '../utils/managerScope.js';
import { getCustomerRefId } from '../utils/roleFilters.js';

export const getDocuments = asyncHandler(async (req, res) => {
  const { folder, search, relatedType, relatedId, documentType } = req.query;
  const query = { isActive: true };
  if (folder) query.folder = folder;
  if (relatedType) query['relatedTo.type'] = relatedType;
  if (relatedId) query['relatedTo.id'] = relatedId;
  if (documentType) query.tags = documentType;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { folder: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }
  if (req.user.role === 'customer') {
    const customerId = getCustomerRefId(req.user);
    if (!customerId) {
      res.json([]);
      return;
    }
    const projectIds = await Project.find({ customer: customerId }).distinct('_id');
    const customerScope = {
      $or: [
        { 'relatedTo.type': 'customer', 'relatedTo.id': customerId },
        ...(projectIds.length ? [{ 'relatedTo.type': 'project', 'relatedTo.id': { $in: projectIds } }] : []),
        { folder: 'Delivery', 'relatedTo.id': { $in: projectIds } },
      ],
      tags: { $ne: 'customer-submission' },
    };
    if (query.$or) {
      query.$and = [{ $or: query.$or }, customerScope];
      delete query.$or;
    } else {
      Object.assign(query, customerScope);
    }
  } else if (isTechnicalManager(req.user)) {
    const scope = await getTechnicalManagerDocumentFilter(req.user._id);
    if (query.$or) {
      query.$and = [{ $or: query.$or }, scope];
      delete query.$or;
    } else {
      Object.assign(query, scope);
    }
  }
  const documents = await Document.find(query)
    .populate('uploadedBy', 'firstName lastName')
    .sort('-createdAt');
  res.json(documents);
});

export const createDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('File is required');
  }
  const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/documents', {
    originalname: req.file.originalname,
  });
  const doc = await Document.create({
    name: req.body.name || req.file.originalname,
    folder: req.body.folder || 'General',
    fileUrl: result.url,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    relatedTo: {
      type: req.body.relatedType || 'general',
      id: req.body.relatedId || undefined,
    },
    tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()) : [],
    notes: req.body.notes,
    uploadedBy: req.user._id,
  });
  await logActivity(req.user._id, 'document', `Uploaded: ${doc.name}`, {
    type: doc.relatedTo?.type && doc.relatedTo.type !== 'general' ? doc.relatedTo.type : 'document',
    id: doc.relatedTo?.id || doc._id,
  });
  res.status(201).json(doc);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) {
    res.status(404);
    throw new Error('Document not found');
  }
  doc.isActive = false;
  await doc.save();
  res.json({ message: 'Document removed' });
});
