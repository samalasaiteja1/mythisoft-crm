import Role from '../models/Role.js';

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('department', 'name').sort({ createdAt: -1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, department, description, permissions, status } = req.body;
    const role = await Role.create({
      name,
      department,
      description,
      permissions,
      status
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { name, department, description, permissions, status } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, department, description, permissions, status },
      { new: true, runValidators: true }
    );
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
