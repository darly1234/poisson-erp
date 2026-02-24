const BASE_URL = 'http://localhost:3001/api';

export const api = {
  getRecords: () => fetch(`${BASE_URL}/records`).then(r => r.json()),
  createRecord: (data) => fetch(`${BASE_URL}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateRecord: (id, data) => fetch(`${BASE_URL}/records/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).then(r => r.json()),
  deleteRecord: (id) => fetch(`${BASE_URL}/records/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getMetadata: () => fetch(`${BASE_URL}/metadata`).then(r => r.json()),
  saveMetadata: (data) => {
    const body = data?.fieldBank ? data : { tabs: data };
    return fetch(`${BASE_URL}/metadata`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
  },

  getFilters: () => fetch(`${BASE_URL}/filters`).then(r => r.json()),
  createFilter: (filter) => fetch(`${BASE_URL}/filters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filter) }).then(r => r.json()),
  updateFilter: (id, filter) => fetch(`${BASE_URL}/filters/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filter) }).then(r => r.json()),
  deleteFilter: (id) => fetch(`${BASE_URL}/filters/${id}`, { method: 'DELETE' }).then(r => r.json()),

  exportExcel: () => window.open(`${BASE_URL}/backup/export`, '_blank'),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE_URL}/backup/import`, { method: 'POST', body: formData }).then(r => r.json());
  }
};