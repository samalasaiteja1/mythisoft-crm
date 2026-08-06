import jwt from 'jsonwebtoken';

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

/** Human-readable message for MongoDB E11000 duplicate key errors */
export function getDuplicateKeyMessage(err) {
  if (err?.code !== 11000) return null;
  const keyValue = err.keyValue || {};
  if (keyValue.email) {
    return `Email "${keyValue.email}" is already registered. Use a different email or edit the existing employee in Settings → Hired Staff.`;
  }
  if (keyValue.employeeId) {
    return `Employee ID "${keyValue.employeeId}" is already in use. Choose a different ID.`;
  }
  if (keyValue.username) {
    return 'That username is already taken.';
  }
  const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : null;
  if (field) {
    return `A user with this ${field.replace(/_/g, ' ')} already exists.`;
  }
  return 'This value is already in use.';
}

export function conflictError(message) {
  const err = new Error(message);
  err.statusCode = 409;
  return err;
}
