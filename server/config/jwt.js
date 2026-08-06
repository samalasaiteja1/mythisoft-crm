import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'mythisoft-crm-secret';
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
