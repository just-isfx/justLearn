import api from './api';

export const getAdminDashboard = async () => (await api.get('/admin/dashboard')).data.data;
export const getAdminUsers = async (page = 1) => (await api.get('/admin/users', { params: { page } })).data;
export const updateAdminUserRole = async (id, role) => (await api.put(`/admin/users/${id}/role`, { role })).data;
export const getAdminResource = async (resource, page = 1) => (await api.get(`/admin/${resource}`, { params: { page } })).data;
export const createAdminResource = async (resource, data) => (await api.post(`/admin/${resource}`, data)).data.data;
export const updateAdminResource = async (resource, id, data) => (await api.put(`/admin/${resource}/${id}`, data)).data.data;
export const deleteAdminResource = async (resource, id) => api.delete(`/admin/${resource}/${id}`);
