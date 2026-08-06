import { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Phone, MapPin, Globe, CheckCircle, Shield, Briefcase } from 'lucide-react';

const faqs = [
  { q: 'How do I add a new lead?', a: 'Navigate to Leads from the sidebar, click "Add Lead", fill in the details, and save. You can assign leads to team members and track their status through the pipeline.' },
  { q: 'How does the deal pipeline work?', a: 'The Deals page shows a Kanban board with stages: Prospecting, Qualification, Proposal, Negotiation, Closed Won, and Closed Lost. Drag and drop deals between stages to update their progress.' },
  { q: 'Can I convert a lead to a customer?', a: 'Yes! On the Leads page, click the convert icon (arrow) next to any lead. This creates a new customer record and marks the lead as "Won".' },
  { q: 'How do I manage user roles?', a: 'Admins can manage users from the Users page (sidebar). Add users with roles: Manager, Sales, Support, or Viewer. Edit details, assign teams, or delete users. Sales and other roles cannot access this page.' },
  { q: 'What is the difference between Admin and Sales?', a: 'Admin runs the system — user/team management, company settings, and API keys. Sales focuses on selling — leads, customers, deals, tasks, and communications. Both can use the full CRM modules; only Admin sees Users and system settings.' },
  { q: 'How do I upload images?', a: 'Image uploads (avatars, company logos) are handled via Cloudinary. Configure your Cloudinary credentials in the server .env file.' },
  { q: 'How do I generate reports?', a: 'Visit the Reports page for sales reports, lead conversion analytics, customer growth charts, and revenue dashboards.' },
];

const adminFeatures = [
  'Users page — add, edit, delete users and teams',
  'Company settings — name, logo, timezone, currency',
  'API keys — create and revoke integrations',
  'Full CRM — dashboard, leads, customers, deals, tasks',
  'Reports, communications, notifications',
];

const salesFeatures = [
  'Dashboard — leads, customers, revenue overview',
  'Leads — add, update status, convert to customer',
  'Customers, contacts, companies, deals (Kanban)',
  'Tasks, communications (email/SMS), reports',
  'Settings — own profile and password only',
];

const salesCannot = [
  { action: 'See Users menu', sales: false, admin: true },
  { action: 'Create / delete users', sales: false, admin: true },
  { action: 'Manage teams', sales: false, admin: true },
  { action: 'API keys', sales: false, admin: true },
  { action: 'Company settings', sales: false, admin: true },
];
const services = [
  'Custom Software Development', 'Enterprise Application Development', 'CRM Solutions',
  'Cloud-Based Business Applications', 'AI & Machine Learning', 'IoT Solutions',
  'Mobile Application Development', 'Cybersecurity Services', 'Digital Transformation',
];

const industries = [
  'Manufacturing', 'Healthcare', 'Education', 'Retail & E-commerce',
  'Banking & Financial Services', 'Logistics & Supply Chain', 'Real Estate',
  'Telecommunications', 'Government & Public Sector', 'SMEs',
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-white">Help & Support</h1><p className="text-gray-400 mt-1">Get help and learn about MYTHISOFT</p></div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-8">
          <img src="/logo.png" alt="MYTHISOFT" className="w-48 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-white">MYTHISOFT INNOVATION PRIVATE LIMITED</h2>
            <p className="text-myth-accent text-sm tracking-widest uppercase mt-1">Innovating Today, Empowering Tomorrow.</p>
            <p className="text-gray-300 text-sm mt-4 leading-relaxed">
              Mythisoft Innovation Private Limited is a technology-driven company committed to delivering innovative digital solutions, smart electronic products, and advanced technology services to businesses and consumers worldwide.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="flex items-center gap-2 text-sm text-gray-400"><Mail size={14} className="text-myth-accent" />info@mythisoft.com</span>
              <span className="flex items-center gap-2 text-sm text-gray-400"><Phone size={14} className="text-myth-accent" />+91 40 1234 5678</span>
              <span className="flex items-center gap-2 text-sm text-gray-400"><MapPin size={14} className="text-myth-accent" />Hyderabad, Telangana, India</span>
              <span className="flex items-center gap-2 text-sm text-gray-400"><Globe size={14} className="text-myth-accent" />mythisoft.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-red-400" />
            <h3 className="text-lg font-semibold text-white">Admin — System Owner</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Boss + IT — runs the system and the team. Everything Sales can do, plus user management and configuration.</p>
          <div className="space-y-2">
            {adminFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle size={14} className="text-green-400 shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Sales — Sales Representative</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Sales rep — uses CRM to sell and follow up. No access to Users or system settings.</p>
          <div className="space-y-2">
            {salesFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle size={14} className="text-myth-accent shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-myth-border">
          <h3 className="text-lg font-semibold text-white">Admin vs Sales — Quick Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-myth-surface/50">
              <tr>
                <th className="table-header text-left">Action</th>
                <th className="table-header text-center">Sales</th>
                <th className="table-header text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-myth-border">
              {salesCannot.map((row) => (
                <tr key={row.action}>
                  <td className="table-cell text-gray-300">{row.action}</td>
                  <td className="table-cell text-center">{row.sales ? '✅' : '❌'}</td>
                  <td className="table-cell text-center">{row.admin ? '✅' : '❌'}</td>
                </tr>
              ))}
              <tr>
                <td className="table-cell text-gray-300">Dashboard, Leads, Deals, Tasks</td>
                <td className="table-cell text-center">✅</td>
                <td className="table-cell text-center">✅</td>
              </tr>
              <tr>
                <td className="table-cell text-gray-300">Own profile settings</td>
                <td className="table-cell text-center">✅</td>
                <td className="table-cell text-center">✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Our Services</h3>
          <div className="grid grid-cols-1 gap-2">
            {services.map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle size={14} className="text-myth-accent shrink-0" /> {s}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Industries We Serve</h3>
          <div className="flex flex-wrap gap-2">
            {industries.map((i) => (
              <span key={i} className="badge bg-myth-accent/10 text-myth-accent">{i}</span>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-white mt-6 mb-3">Why Choose Us</h3>
          <div className="space-y-2">
            {['Innovative Technology Solutions', 'Experienced Development Team', 'Customer-Centric Approach', 'Scalable and Secure Systems', 'End-to-End Project Delivery', 'Continuous Support & Maintenance'].map((w) => (
              <div key={w} className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle size={14} className="text-green-400 shrink-0" /> {w}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-myth-border rounded-lg overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full p-4 text-left hover:bg-myth-surface/50 transition-colors">
                <span className="text-sm font-medium text-white">{faq.q}</span>
                {openFaq === i ? <ChevronUp size={18} className="text-myth-accent" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {openFaq === i && <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Contact Support</h3>
        <p className="text-gray-400 text-sm mb-4">Need help? Our support team is here for you.</p>
        <div className="flex justify-center gap-4">
          <a href="mailto:support@mythisoft.com" className="btn-primary">Email Support</a>
          <a href="tel:+914012345678" className="btn-secondary">Call Us</a>
        </div>
      </div>
    </div>
  );
}
