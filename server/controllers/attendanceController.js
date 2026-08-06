import Attendance from '../models/Attendance.js';
import { createCrudController } from '../utils/crudFactory.js';
import { asyncHandler } from '../utils/helpers.js';

const ctrl = createCrudController(Attendance, {
  module: 'attendance',
  populate: ['user', 'markedBy'],
  searchFields: ['notes', 'status'],
  beforeCreate: (req) => ({
    ...req.body,
    markedBy: req.user._id,
  }),
});

export const { getAll, getOne, create, update, remove } = ctrl;

export const getAttendanceStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [presentToday, absentToday, onLeaveToday, lateToday] = await Promise.all([
    Attendance.countDocuments({ date: { $gte: today }, status: 'present' }),
    Attendance.countDocuments({ date: { $gte: today }, status: 'absent' }),
    Attendance.countDocuments({ date: { $gte: today }, status: 'on_leave' }),
    Attendance.countDocuments({ date: { $gte: today }, status: 'late' }),
  ]);
  res.json({ presentToday, absentToday, onLeaveToday, lateToday });
});
