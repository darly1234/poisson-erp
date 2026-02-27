const API_URL = process.env.NODE_ENV === 'production' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem('access_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Envia cookie do refresh token
  });

  if (res.status === 401) {
    throw new Error('Não autorizado (401). Faça login novamente.');
  }

  if (!res.ok) {
    let errorMsg = 'Erro na requisição';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch (e) {
      // Se não for JSON, tenta pegar texto
      try { errorMsg = await res.text() || errorMsg; } catch (e2) { }
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

export const api = {
  getRecords: () => fetchWithAuth('/records'),
  createRecord: (data) => fetchWithAuth('/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateRecord: (id, data) => fetchWithAuth(`/records/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }),
  deleteRecord: (id) => fetchWithAuth(`/records/${id}`, { method: 'DELETE' }),

  getMetadata: () => fetchWithAuth('/metadata').catch(() => null),
  saveMetadata: (data) => {
    const body = data?.fieldBank ? data : { tabs: data };
    return fetchWithAuth('/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  },

  getFilters: () => fetchWithAuth('/filters').catch(() => []),
  createFilter: (filter) => fetchWithAuth('/filters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filter) }),
  updateFilter: (id, filter) => fetchWithAuth(`/filters/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filter) }),
  deleteFilter: (id) => fetchWithAuth(`/filters/${id}`, { method: 'DELETE' }),

  exportExcel: () => window.open(`${API_URL}/backup/export`, '_blank'),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchWithAuth('/backup/import', { method: 'POST', body: formData });
  },
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('file', file);
    return fetchWithAuth('/upload', { method: 'POST', body: formData });
  },

  // Webhooks & n8n
  sendMessage: (data) => fetchWithAuth('/webhooks/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getMessageHistory: (recordId) => fetchWithAuth(`/webhooks/history/${recordId}`),
  getSettings: () => fetchWithAuth('/webhooks/settings'),
  saveSettings: (key, value) => fetchWithAuth('/webhooks/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })
};