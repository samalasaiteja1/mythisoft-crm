import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { UPLOADS_ROOT } from './utils/fileStorage.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import followupRoutes from './routes/followupRoutes.js';
import projectCategoryRoutes from './routes/projectCategoryRoutes.js';
import staffRoleRoutes from './routes/staffRoleRoutes.js';
import workTeamRoutes from './routes/workTeamRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import milestoneRoutes from './routes/milestoneRoutes.js';

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/uploads', express.static(UPLOADS_ROOT));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', company: 'MYTHISOFT INNOVATION PRIVATE LIMITED', tagline: 'Innovating Today, Empowering Tomorrow.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/project-categories', projectCategoryRoutes);
app.use('/api/staff-roles', staffRoleRoutes);
app.use('/api/work-teams', workTeamRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/milestones', milestoneRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
