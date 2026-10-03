import api from './api';

export async function getAchievements() { return (await api.get('/achievements')).data.data; }
export async function getNotifications(page = 1) { return (await api.get('/notifications', { params: { page } })).data; }
export async function markNotificationRead(id) { return api.put(`/notifications/${id}/read`); }
export async function markAllNotificationsRead() { return api.put('/notifications/read-all'); }
export async function deleteNotification(id) { return api.delete(`/notifications/${id}`); }