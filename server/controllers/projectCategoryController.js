import Project from '../models/Project.js';
import Deal from '../models/Deal.js';
import ProjectCategory from '../models/ProjectCategory.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from './authController.js';

const populateQuery = (query) => query.populate('createdBy', 'firstName lastName');

export const getAll = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 50 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await ProjectCategory.countDocuments(query);
  const items = await populateQuery(
    ProjectCategory.find(query)
      .sort('name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
  );
  res.json({ items, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
});

export const getOptions = asyncHandler(async (req, res) => {
  const items = await ProjectCategory.find({ status: 'active' })
    .sort('name')
    .select('name code description');
  res.json({ items });
});

export const getOne = asyncHandler(async (req, res) => {
  const item = await populateQuery(ProjectCategory.findById(req.params.id));
  if (!item) {
    res.status(404);
    throw new Error('Project category not found');
  }
  res.json(item);
});

export const create = asyncHandler(async (req, res) => {
  const { name, code, description, status } = req.body;
  if (!name?.trim()) {
    res.status(400);
    throw new Error('Category name is required');
  }
  const item = await ProjectCategory.create({
    name: name.trim(),
    code: code?.trim() || undefined,
    description: description?.trim() || undefined,
    status: status || 'active',
    createdBy: req.user._id,
  });
  try {
    await logActivity(req.user._id, 'settings', `Created project category: ${item.name}`, { type: 'project_category', id: item._id });
  } catch { /* ignore */ }
  res.status(201).json(await populateQuery(ProjectCategory.findById(item._id)));
});

export const update = asyncHandler(async (req, res) => {
  const { name, code, description, status } = req.body;
  const updates = {};
  if (name !== undefined) {
    if (!name?.trim()) {
      res.status(400);
      throw new Error('Category name is required');
    }
    updates.name = name.trim();
  }
  if (code !== undefined) updates.code = code?.trim() || undefined;
  if (description !== undefined) updates.description = description?.trim() || undefined;
  if (status !== undefined) updates.status = status;

  const item = await populateQuery(
    ProjectCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  );
  if (!item) {
    res.status(404);
    throw new Error('Project category not found');
  }
  try {
    await logActivity(req.user._id, 'settings', `Updated project category: ${item.name}`, { type: 'project_category', id: item._id });
  } catch { /* ignore */ }
  res.json(item);
});

export const remove = asyncHandler(async (req, res) => {
  const item = await ProjectCategory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Project category not found');
  }

  const [projectCount, dealCount] = await Promise.all([
    Project.countDocuments({ category: item._id }),
    Deal.countDocuments({ 'projectRequirements.category': item._id }),
  ]);

  if (projectCount || dealCount) {
    res.status(400);
    throw new Error('Cannot delete — category is in use. Deactivate it instead.');
  }

  await item.deleteOne();
  res.json({ message: 'Deleted successfully' });
});
