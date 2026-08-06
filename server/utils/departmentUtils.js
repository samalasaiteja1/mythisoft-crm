export function normalizeDepartmentName(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function buildDepartmentNameQuery(name, currentId = null) {
  const normalized = normalizeDepartmentName(name);
  const query = {
    name: { $regex: `^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  };
  if (currentId) {
    query._id = { $ne: currentId };
  }
  return query;
}
