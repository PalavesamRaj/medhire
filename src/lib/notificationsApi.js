import { request } from './recruiterApi'

// Notification endpoints have appeared with both an array envelope and a
// named collection envelope. Normalize those response shapes at the boundary
// so a valid backend list is not rendered as an empty inbox.
const unwrap = (payload) => {
  let value = payload
  while (value && !Array.isArray(value) && value.data && typeof value.data === 'object') value = value.data
  return value ?? {}
}

const getItems = (payload) => {
  const data = unwrap(payload)
  if (Array.isArray(data)) return data
  for (const key of ['items', 'notifications', 'results']) {
    if (Array.isArray(data[key])) return data[key]
  }
  return []
}

const getUnreadCount = (payload) => {
  const data = unwrap(payload)
  const count = data.unread ?? data.unreadCount ?? data.count
  return Number.isFinite(Number(count)) ? Number(count) : undefined
}

export const notificationsApi = {
  async list(unreadOnly = false) {
    const [payload, countResult] = await Promise.all([
      request('/notifications?page=1&pageSize=10'),
      request('/notifications/unread-count').then((value) => ({ value }), (error) => ({ error })),
    ])
    const items = getItems(payload)
    const filteredItems = unreadOnly ? items.filter((item) => !item.read && !item.readAt) : items
    const unreadCount = getUnreadCount(countResult.value) ?? getUnreadCount(payload) ?? items.filter((item) => !item.read && !item.readAt).length
    return { items: filteredItems, unreadCount }
  },
  markRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
}
