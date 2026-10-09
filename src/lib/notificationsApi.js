import { request } from './recruiterApi'

// Shared by candidate and recruiter. Each user only receives their own notifications.
const unwrap = (payload) => payload?.data ?? payload ?? {}

export const notificationsApi = {
  async list(unreadOnly = false) {
    const data = unwrap(await request(`/notifications?pageSize=10${unreadOnly ? '&unreadOnly=true' : ''}`))
    const items = Array.isArray(data.items) ? data.items : []
    return { items, unreadCount: Number.isFinite(data.unreadCount) ? data.unreadCount : items.filter((item) => !item.read).length }
  },
  markRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
}
