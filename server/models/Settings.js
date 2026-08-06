import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'MYTHISOFT INNOVATION PRIVATE LIMITED' },
    companyTagline: { type: String, default: 'Innovating Today, Empowering Tomorrow.' },
    companyEmail: String,
    companyPhone: String,
    companyAddress: String,
    companyWebsite: String,
    companyLogo: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    emailConfig: {
      provider: String,
      host: String,
      port: Number,
      user: String,
      fromName: String,
    },
    smsConfig: {
      provider: String,
      apiKey: String,
      senderId: String,
    },
    apiKeys: [{
      name: String,
      key: String,
      createdAt: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true },
    }],
    dashboardConfig: {
      visibleTabs: {
        admin: { type: [String], default: ['dashboard', 'leads', 'followups', 'deals', 'customers', 'projects', 'tickets', 'reports', 'users', 'roles', 'settings', 'performance', 'calendar', 'documents', 'deployment', 'bugtracker', 'knowledgebase', 'notifications'] },
        manager: { type: [String], default: ['dashboard', 'leads', 'deals', 'followups', 'customers', 'projects', 'tickets', 'performance', 'reports', 'settings', 'calendar', 'documents', 'deployment', 'bugtracker', 'knowledgebase', 'notifications'] },
        sales: { type: [String], default: ['dashboard', 'leads', 'followups', 'deals', 'customers', 'calendar', 'reports', 'notifications'] },
        technical: { type: [String], default: ['dashboard', 'projects', 'tasks', 'documents', 'deployment', 'bugtracker', 'notifications'] },
        support: { type: [String], default: ['dashboard', 'tickets', 'followups', 'customers', 'knowledgebase', 'notifications'] },
        customer: { type: [String], default: ['dashboard', 'projects', 'tickets', 'calendar', 'invoices', 'documents', 'notifications'] },
      },
    },
    integrations: {
      slack: { enabled: Boolean, webhook: String },
      google: { enabled: Boolean, clientId: String },
      zapier: { enabled: Boolean, apiKey: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
