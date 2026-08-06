import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import { createCrudController } from '../utils/crudFactory.js';

const ctrl = createCrudController(Payment, {
  module: 'payment',
  populate: ['invoice', 'customer', 'createdBy'],
  searchFields: ['paymentNumber', 'transactionId'],
});

export const { getAll, getOne, create, update, remove } = ctrl;
