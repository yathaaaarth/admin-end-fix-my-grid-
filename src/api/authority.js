import client from './client';

export async function login(email, password) {
  const { data } = await client.post('/api/auth/login/', { email, password });
  return data;
}

export async function adminRegister({ email, password, firstName, lastName }) {
  const { data } = await client.post('/api/auth/admin-register/', {
    email,
    password,
    first_name: firstName,
    last_name: lastName,
  });
  return data;
}

export async function getStats() {
  const { data } = await client.get('/api/authority/stats/');
  return data;
}

export async function getIssues(params = {}) {
  const { data } = await client.get('/api/authority/issues/', { params });
  return data;
}

export async function getIssue(id) {
  const { data } = await client.get(`/api/authority/issues/${id}/`);
  return data;
}

export async function transitionIssue(id, newStatus) {
  const { data } = await client.post(`/api/authority/issues/${id}/transition/`, {
    new_status: newStatus,
  });
  return data;
}

export async function resolveIssue(id, imageFile, notes = '') {
  const form = new FormData();
  form.append('image', imageFile);
  if (notes) form.append('notes', notes);
  const { data } = await client.post(`/api/authority/issues/${id}/resolve/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function assignIssue(id, userId) {
  const { data } = await client.post(`/api/authority/issues/${id}/assign/`, {
    user_id: userId,
  });
  return data;
}

export async function addIssueNote(id, text) {
  const { data } = await client.post(`/api/authority/issues/${id}/notes/`, {
    text,
  });
  return data;
}

export async function getStaff() {
  const { data } = await client.get('/api/authority/staff/');
  return data;
}

export async function requestCitizenVerification(id) {
  const { data } = await client.post(`/api/authority/issues/${id}/request-verification/`);
  return data;
}

