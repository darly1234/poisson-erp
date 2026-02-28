const API_URL = process.env.NODE_ENV === 'production' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');

const fetchWithAuth = async (endpoint, options = {}, retries = 2) => {
  const token = sessionStorage.getItem('access_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  try {
    const url = new URL(`${API_URL}${endpoint}`, window.location.origin);
    if (token) url.searchParams.set('token', token);

    const res = await fetch(url.toString(), {
      ...options,
      headers,
      credentials: 'include'
    });


    if (!res.ok) {
      let errorMsg = 'Erro na requisição';
      try {
        const errorData = await res.json();
        const err = new Error(errorData.message || errorData.error || errorMsg);
        if (errorData.details) err.details = errorData.details;
        throw err;
      } catch (e) {
        if (e.details) throw e; // Repassa se já tiver detalhes
        try { errorMsg = await res.text() || errorMsg; } catch (e2) { }
      }
      throw new Error(errorMsg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    if (retries > 0 && err.name !== 'AbortError' && !err.message.includes('401')) {
      console.warn(`Tentativa de reconexão (${3 - retries})...`, err);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return fetchWithAuth(endpoint, options, retries - 1);
    }
    throw err;
  }
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
  deleteMessageHistory: (id) => fetchWithAuth(`/webhooks/history/${id}`, { method: 'DELETE' }),
  getSettings: () => fetchWithAuth('/webhooks/settings'),
  saveSettings: (key, value) => fetchWithAuth('/webhooks/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) }),

  // WordPress
  publishWordPress: (data) => fetchWithAuth('/wordpress/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  setWordPressStatus: (data) => fetchWithAuth('/wordpress/set-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
};