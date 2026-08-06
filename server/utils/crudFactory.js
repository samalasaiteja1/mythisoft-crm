import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from '../controllers/authController.js';

export const createCrudController = (Model, options = {}) => {
  const {
    module = '',
    populate = [],
    searchFields = ['name'],
    defaultSort = '-createdAt',
    beforeCreate,
    afterCreate,
  } = options;

  const populateQuery = (query) => {
    populate.forEach((p) => { query = query.populate(p); });
    return query;
  };

  return {
    getAll: asyncHandler(async (req, res) => {
      const { search, status, page = 1, limit = 20, ...filters } = req.query;
      const query = { ...filters };
      if (status) query.status = status;
      if (search && searchFields.length) {
        query.$or = searchFields.map((f) => ({ [f]: { $regex: search, $options: 'i' } }));
      }
      const total = await Model.countDocuments(query);
      let q = Model.find(query).sort(defaultSort).skip((page - 1) * limit).limit(Number(limit));
      q = populateQuery(q);
      const items = await q;
      res.json({ items, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
    }),

    getOne: asyncHandler(async (req, res) => {
      let q = Model.findById(req.params.id);
      q = populateQuery(q);
      const item = await q;
      if (!item) {
        res.status(404);
        throw new Error(`${module || 'Record'} not found`);
      }
      res.json(item);
    }),

    create: asyncHandler(async (req, res) => {
      const data = beforeCreate ? beforeCreate(req) : { ...req.body, createdBy: req.user._id };
      const item = await Model.create(data);
      if (afterCreate) await afterCreate(item, req);
      if (module) {
        try {
          await logActivity(req.user._id, module, `Created ${module}: ${item.name || item.title || item._id}`, { type: module, id: item._id });
        } catch {
          // Activity log failure should not block record creation
        }
      }
      let q = Model.findById(item._id);
      q = populateQuery(q);
      res.status(201).json(await q);
    }),

    update: asyncHandler(async (req, res) => {
      let q = Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      q = populateQuery(q);
      const item = await q;
      if (!item) {
        res.status(404);
        throw new Error(`${module || 'Record'} not found`);
      }
      if (module) {
        try {
          await logActivity(req.user._id, module, `Updated ${module}: ${item.name || item.title || item._id}`, { type: module, id: item._id });
        } catch {
          // Activity log failure should not block record update
        }
      }
      res.json(item);
    }),

    remove: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) {
        res.status(404);
        throw new Error(`${module || 'Record'} not found`);
      }
      await item.deleteOne();
      res.json({ message: 'Deleted successfully' });
    }),
  };
};
