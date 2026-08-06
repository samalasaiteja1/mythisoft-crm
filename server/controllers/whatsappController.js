import WhatsAppMessage from '../models/WhatsAppMessage.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from './authController.js';

export const getWhatsAppMessages = asyncHandler(async (req, res) => {
  const { customer, lead, search } = req.query;
  const query = {};
  if (customer) query.customer = customer;
  if (lead) query.lead = lead;
  if (search) {
    query.$or = [
      { phone: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }
  const messages = await WhatsAppMessage.find(query)
    .populate('customer', 'firstName lastName phone')
    .populate('lead', 'firstName lastName phone')
    .populate('sentBy', 'firstName lastName')
    .sort('-createdAt')
    .limit(100);
  res.json(messages);
});

export const sendWhatsAppMessage = asyncHandler(async (req, res) => {
  const { phone, message, customer, lead, template } = req.body;
  if (!phone || !message) {
    res.status(400);
    throw new Error('Phone and message are required');
  }
  const record = await WhatsAppMessage.create({
    phone,
    message,
    customer: customer || undefined,
    lead: lead || undefined,
    template,
    direction: 'outbound',
    status: 'sent',
    sentBy: req.user._id,
  });
  await logActivity(req.user._id, 'whatsapp', `WhatsApp to ${phone}`, { type: 'whatsapp', id: record._id });
  res.status(201).json(record);
});

export const getWhatsAppTemplates = asyncHandler(async (req, res) => {
  res.json([
    { id: 'follow_up', label: 'Follow-up Reminder', body: 'Hi {{name}}, following up on our recent conversation. Please let us know if you have any questions.' },
    { id: 'meeting', label: 'Meeting Confirmation', body: 'Hi {{name}}, your meeting is confirmed for {{date}}. We look forward to speaking with you.' },
    { id: 'quotation', label: 'Quotation Sent', body: 'Hi {{name}}, we have sent your quotation. Please review and let us know your feedback.' },
    { id: 'thank_you', label: 'Thank You', body: 'Thank you {{name}} for choosing MYTHISOFT. We appreciate your business!' },
  ]);
});
