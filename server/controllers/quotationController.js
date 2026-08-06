import Quotation from '../models/Quotation.js';
import { createCrudController } from '../utils/crudFactory.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from './authController.js';

const ctrl = createCrudController(Quotation, {
  module: 'quotation',
  populate: ['customer', 'lead', 'deal', 'createdBy', 'approvedBy'],
  searchFields: ['quotationNumber', 'title'],
});

export const { getAll, getOne, create, update, remove } = ctrl;

export const approveQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  ).populate('customer', 'firstName lastName email').populate('createdBy', 'firstName lastName');
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }
  await logActivity(req.user._id, 'quotation', `Quotation approved: ${quotation.quotationNumber}`, { type: 'quotation', id: quotation._id });
  res.json(quotation);
});

export const sendQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findByIdAndUpdate(
    req.params.id,
    { status: 'sent' },
    { new: true }
  ).populate('customer', 'firstName lastName email').populate('createdBy', 'firstName lastName');
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }
  await logActivity(req.user._id, 'quotation', `Quotation sent: ${quotation.quotationNumber}`, { type: 'quotation', id: quotation._id });
  res.json(quotation);
});
