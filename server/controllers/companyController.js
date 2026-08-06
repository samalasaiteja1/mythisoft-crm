import Company from '../models/Company.js';
import Contact from '../models/Contact.js';
import Deal from '../models/Deal.js';
import { asyncHandler } from '../utils/helpers.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';

export const getCompanies = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { industry: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Company.countDocuments(query);
  const companies = await Company.find(query)
    .populate('assignedTo', 'firstName lastName')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ companies, total, pages: Math.ceil(total / limit) });
});

export const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id).populate('assignedTo', 'firstName lastName email');
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  const [contacts, deals] = await Promise.all([
    Contact.find({ company: company._id }),
    Deal.find({ company: company._id }).populate('assignedTo', 'firstName lastName'),
  ]);
  res.json({ company, contacts, deals });
});

export const createCompany = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/companies');
    data.logo = result.url;
  }
  const company = await Company.create(data);
  res.status(201).json(company);
});

export const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  Object.assign(company, req.body);
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/companies');
    company.logo = result.url;
  }
  await company.save();
  res.json(company);
});

export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  await company.deleteOne();
  res.json({ message: 'Company removed' });
});
