import Department from '../models/Department.js';
import { createCrudController } from '../utils/crudFactory.js';
import { normalizeDepartmentName, buildDepartmentNameQuery } from '../utils/departmentUtils.js';

const wrapDepartmentController = () => {
  const ctrl = createCrudController(Department, {
    module: 'department',
    populate: ['manager', 'createdBy'],
    searchFields: ['name', 'description'],
  });

  return {
    ...ctrl,
    create: async (req, res, next) => {
      try {
        const rawName = req.body?.name;
        const name = normalizeDepartmentName(rawName);
        if (!name) {
          return res.status(400).json({ message: 'Department name is required' });
        }

        const existing = await Department.findOne(buildDepartmentNameQuery(name));
        if (existing) {
          return res.status(409).json({ message: `Department "${name}" already exists` });
        }

        req.body = { ...req.body, name };
        return ctrl.create(req, res, next);
      } catch (error) {
        next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const rawName = req.body?.name;
        if (rawName !== undefined) {
          const name = normalizeDepartmentName(rawName);
          if (!name) {
            return res.status(400).json({ message: 'Department name is required' });
          }

          const existing = await Department.findOne(buildDepartmentNameQuery(name, req.params.id));
          if (existing) {
            return res.status(409).json({ message: `Department "${name}" already exists` });
          }

          req.body = { ...req.body, name };
        }

        return ctrl.update(req, res, next);
      } catch (error) {
        next(error);
      }
    },
  };
};

const ctrl = wrapDepartmentController();
export const { getAll, getOne, create, update, remove } = ctrl;
