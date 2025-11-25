import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: API_BASE });

export function setToken(token) { api.defaults.headers.common['Authorization'] = `Bearer ${token}` }
export default api;
