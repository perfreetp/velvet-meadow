// 后端 API 封装；角色通过 x-role 头切换（演示环境）
const ROLE_KEY = 'lighting-role';

export function getRole() {
  return localStorage.getItem(ROLE_KEY) || 'planner';
}
export function setRole(role) {
  localStorage.setItem(ROLE_KEY, role);
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-role': getRole(),
      ...(options.headers || {}),
    },
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `请求失败 ${res.status}`);
  return data;
}

export const api = {
  listPlans: () => request('/api/plans'),
  getPlan: (id) => request(`/api/plans/${id}`),
  createPlan: (payload) => request('/api/plans', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlan: (id, payload) => request(`/api/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePlan: (id) => request(`/api/plans/${id}`, { method: 'DELETE' }),
  transition: (id, to) => request(`/api/plans/${id}/transition`, { method: 'POST', body: JSON.stringify({ to }) }),

  listReviews: (id) => request(`/api/plans/${id}/reviews`),
  addReview: (id, payload) => request(`/api/plans/${id}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),

  listAnnotations: (id) => request(`/api/plans/${id}/annotations`),
  addAnnotation: (id, payload) => request(`/api/plans/${id}/annotations`, { method: 'POST', body: JSON.stringify(payload) }),

  getStats: (id) => request(`/api/plans/${id}/stats`),
  putStats: (id, payload) => request(`/api/plans/${id}/stats`, { method: 'PUT', body: JSON.stringify(payload) }),
};

export const STATUS_META = {
  draft: { label: '草稿', tone: '#8a8f99' },
  submitted: { label: '送审', tone: '#d9921f' },
  published: { label: '公示', tone: '#2f8f4e' },
};
