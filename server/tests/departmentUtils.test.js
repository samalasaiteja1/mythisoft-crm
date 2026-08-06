import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDepartmentName, buildDepartmentNameQuery } from '../utils/departmentUtils.js';

test('normalizeDepartmentName trims and collapses whitespace', () => {
  assert.equal(normalizeDepartmentName('  Support  '), 'Support');
  assert.equal(normalizeDepartmentName('Sales   Team'), 'Sales Team');
});

test('buildDepartmentNameQuery matches names case-insensitively and ignores the current record', () => {
  const query = buildDepartmentNameQuery('Support', 'abc123');
  assert.deepEqual(query, {
    name: { $regex: '^Support$', $options: 'i' },
    _id: { $ne: 'abc123' },
  });
});
