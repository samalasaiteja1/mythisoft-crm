import { projectsAPI } from '../services/api';

export async function uploadRequirementsDocument(projectId, file, name) {
  if (!projectId || !file) return null;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', name || file.name || 'Requirements Document');
  const { data } = await projectsAPI.uploadRequirementsDocument(projectId, fd);
  return data;
}

export async function uploadCustomerRequirementsDocument(projectId, file, name) {
  if (!projectId || !file) return null;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', name || file.name || 'Customer Requirements Document');
  const { data } = await projectsAPI.uploadCustomerRequirementsDocument(projectId, fd);
  return data;
}

export async function uploadDeliveryDocument(projectId, file, name) {
  if (!projectId || !file) return null;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', name || file.name || 'Project Delivery Document');
  const { data } = await projectsAPI.uploadDeliveryDocument(projectId, fd);
  return data;
}
