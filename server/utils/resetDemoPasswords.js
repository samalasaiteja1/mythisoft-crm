/**
 * Reset demo account passwords without wiping the database.
 * Usage: node utils/resetDemoPasswords.js
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();
await connectDB();

const DEMO_ACCOUNTS = [
  { email: 'admin@mythisoft.com', password: 'admin123', label: 'Admin' },
  { email: 'manager@mythisoft.com', password: 'manager123', label: 'Sales Manager (Priya Sharma)' },
  { email: 'tech.manager@mythisoft.com', password: 'manager123', label: 'Tech Manager (Vikram Nair)' },
  { email: 'support.manager@mythisoft.com', password: 'manager123', label: 'Support Manager' },
  { email: 'rajesh@mythisoft.com', password: 'sales123', label: 'Sales (Rajesh)' },
  { email: 'technical@mythisoft.com', password: 'tech123', label: 'Technical (Kiran)' },
  { email: 'support@mythisoft.com', password: 'support123', label: 'Support' },
  { email: 'customer@mythisoft.com', password: 'customer123', label: 'Customer portal' },
];

for (const account of DEMO_ACCOUNTS) {
  const user = await User.findOne({ email: account.email });
  if (!user) {
    console.log(`SKIP (not found): ${account.email}`);
    continue;
  }
  user.password = account.password;
  user.isActive = true;
  await user.save();
  const check = await User.findOne({ email: account.email }).select('+password');
  const ok = check ? await check.matchPassword(account.password) : false;
  console.log(`OK ${account.label}: ${account.email} / ${account.password} (verify: ${ok})`);
}

console.log('\nDemo passwords reset. Try logging in again.');
process.exit(0);
