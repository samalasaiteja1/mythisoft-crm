/**
 * Adds sample projects/tasks for code review testing (does not wipe the database).
 * Run: node utils/seedCodeReviewSamples.js
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import StaffRole from '../models/StaffRole.js';

dotenv.config();
await connectDB();

const admin = await User.findOne({ email: 'admin@mythisoft.com' });
const techManager = await User.findOne({ email: 'tech.manager@mythisoft.com' });
const technicalUser = await User.findOne({ email: 'technical@mythisoft.com' });
const deepakTech = await User.findOne({ email: 'deepak.tech@mythisoft.com' });
const customer = await Customer.findOne().sort('createdAt');
const devTeam = await StaffRole.findOne({ code: 'tech1000' }) || await StaffRole.findOne({ teamGroup: 'technical' });

if (!admin || !techManager || !technicalUser || !customer) {
  console.error('Missing base users/customer. Run full seed first: npm run seed');
  process.exit(1);
}

const assignees = [technicalUser._id, deepakTech?._id].filter(Boolean);

const existingReviewCount = await Project.countDocuments({ status: 'code_review' });
if (existingReviewCount < 2) {
  await Project.create({
    name: 'Sample — CRM Dashboard (Code Review)',
    customer: customer._id,
    status: 'code_review',
    workflowStage: 'development',
    budget: 450000,
    manager: techManager._id,
    assignedTo: assignees,
    createdBy: admin._id,
    description: 'Sample project for admin code review form testing.',
  });
  await Project.create({
    name: 'Sample — Payment API (Code Review)',
    customer: customer._id,
    status: 'code_review',
    workflowStage: 'development',
    budget: 320000,
    manager: techManager._id,
    assignedTo: assignees,
    createdBy: admin._id,
    description: 'Second sample project in code review status.',
  });
  console.log('Created 2 sample projects in code_review status.');
} else {
  console.log(`Skipped projects (${existingReviewCount} already in code_review).`);
}

const reviewProjects = await Project.find({ status: 'code_review' }).limit(2);
const testingCount = await Project.countDocuments({ status: 'testing' });
if (testingCount === 0 && reviewProjects[0]) {
  await Project.findByIdAndUpdate(reviewProjects[0]._id, { status: 'testing', workflowStage: 'testing' });
  console.log('Moved one project to testing for testing-form demo.');
}

const projectForTasks = reviewProjects[0] || await Project.findOne({ status: 'code_review' });
if (projectForTasks) {
  const taskTitles = [
    'Sample task — dashboard widgets (code review)',
    'Sample task — payment API (code review)',
  ];
  for (const title of taskTitles) {
    const exists = await Task.findOne({ title });
    if (exists) continue;
    await Task.create({
      title,
      description: 'Sample dev task submitted for code review.',
      taskType: 'Development',
      priority: 'high',
      status: 'in_progress',
      workStatus: 'code_review',
      devStage: 'code_review',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      assignedTo: technicalUser._id,
      createdBy: techManager._id,
      staffRole: devTeam?._id,
      relatedTo: { type: 'project', id: projectForTasks._id },
      codeReview: { status: 'pending' },
    });
  }
  console.log('Ensured sample code-review tasks exist.');
}

console.log('');
console.log('Code review samples ready.');
console.log('  Admin login:     admin@mythisoft.com / admin123');
console.log('  Open:            /projects/status/code_review');
console.log('  Tech person:     /technical/code-review');
process.exit(0);
