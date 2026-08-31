import api from './api';

export const scanNotifications = () => api.post('/notifications/scan');

export const getNotifications = () => api.get('/notifications');

export const getUnreadCount = () => api.get('/notifications/unread-count');

export const markNotificationRead = (id) => api.patch(`/notifications/${encodeURIComponent(id)}/read`);

export const markAllNotificationsRead = () => api.patch('/notifications/read-all');