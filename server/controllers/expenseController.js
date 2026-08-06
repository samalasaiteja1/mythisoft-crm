import Expense from '../models/Expense.js';
import { createCrudController } from '../utils/crudFactory.js';
import { asyncHandler } from '../utils/helpers.js';

const ctrl = createCrudController(Expense, {
  module: 'expense',
  populate: ['createdBy', 'approvedBy'],
  searchFields: ['title', 'category'],
});

export const { getAll, getOne, create, update, remove } = ctrl;

export const approveExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approvedBy: req.user._id },
    { new: true }
  ).populate('createdBy', 'firstName lastName');
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }
  res.json(expense);
});
