import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from './authController.js';
import { getInvoiceFilterByRole, getCustomerRefId } from '../utils/roleFilters.js';

const populateFields = ['customer', 'project', 'quotation', 'createdBy'];

const populateQuery = (query) => {
  populateFields.forEach((p) => { query = query.populate(p); });
  return query;
};

const assertCustomerInvoiceAccess = (req, invoice) => {
  if (req.user.role !== 'customer') return true;
  const customerId = getCustomerRefId(req.user);
  return customerId && invoice?.customer && String(invoice.customer._id || invoice.customer) === customerId;
};

export const getAll = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20, ...filters } = req.query;
  const query = { ...filters, ...getInvoiceFilterByRole(req.user.role, req.user) };
  if (status) query.status = status;
  if (search) {
    query.$or = ['invoiceNumber', 'notes'].map((f) => ({ [f]: { $regex: search, $options: 'i' } }));
  }
  const total = await Invoice.countDocuments(query);
  let q = Invoice.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
  q = populateQuery(q);
  const items = await q;
  res.json({ items, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
});

export const getOne = asyncHandler(async (req, res) => {
  let q = Invoice.findById(req.params.id);
  q = populateQuery(q);
  const item = await q;
  if (!item || !assertCustomerInvoiceAccess(req, item)) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  res.json(item);
});

export const create = asyncHandler(async (req, res) => {
  if (req.user.role === 'customer') {
    res.status(403);
    throw new Error('Customers cannot create invoices');
  }
  const item = await Invoice.create({ ...req.body, createdBy: req.user._id });
  await logActivity(req.user._id, 'invoice', `Created invoice: ${item.invoiceNumber || item._id}`, { type: 'invoice', id: item._id });
  res.status(201).json(await populateQuery(Invoice.findById(item._id)));
});

export const update = asyncHandler(async (req, res) => {
  if (req.user.role === 'customer') {
    res.status(403);
    throw new Error('Customers cannot update invoices');
  }
  let q = Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  q = populateQuery(q);
  const item = await q;
  if (!item) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  res.json(item);
});

export const remove = asyncHandler(async (req, res) => {
  if (req.user.role === 'customer') {
    res.status(403);
    throw new Error('Customers cannot delete invoices');
  }
  const item = await Invoice.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  await item.deleteOne();
  res.json({ message: 'Deleted successfully' });
});

export const sendInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status: 'sent', sentAt: new Date() },
    { new: true }
  ).populate('customer', 'firstName lastName email');
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  await logActivity(req.user._id, 'invoice', `Invoice sent: ${invoice.invoiceNumber}`, { type: 'invoice', id: invoice._id });
  res.json(invoice);
});

export const recordPayment = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice || !assertCustomerInvoiceAccess(req, invoice)) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  if (req.user.role === 'customer') {
    res.status(403);
    throw new Error('Contact support to record payments');
  }
  const payment = await Payment.create({
    invoice: invoice._id,
    customer: invoice.customer,
    amount: req.body.amount,
    method: req.body.method,
    status: 'completed',
    transactionId: req.body.transactionId,
    paidAt: new Date(),
    createdBy: req.user._id,
  });
  const newPaid = (invoice.amountPaid || 0) + payment.amount;
  const status = newPaid >= invoice.total ? 'paid' : 'partially_paid';
  await Invoice.findByIdAndUpdate(invoice._id, {
    amountPaid: newPaid,
    status,
    paidAt: status === 'paid' ? new Date() : invoice.paidAt,
  });
  res.status(201).json(payment);
});
