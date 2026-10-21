import { request } from './recruiterApi'

// Shared by candidate and recruiter. Each user only receives their own notifications.
const unwrap = (payload) => payload?.data ?? payload ?? {}

export const notificationsApi = {
  async list(unreadOnly = false) {
    const [payload, countPayload] = await Promise.all([
      request('/notifications?page=1&pageSize=10'),
      request('/notifications/unread-count'),
    ])
    const data = unwrap(payload)
    const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []
    const unreadCount = Number(unwrap(countPayload).unread ?? 0)
    return { items: unreadOnly ? items.filter((item) => !item.read && !item.readAt) : items, unreadCount }
  },
  markRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
}
