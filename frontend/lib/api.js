import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  setToken: (token) => localStorage.setItem("token", token),
  removeToken: () => localStorage.removeItem("token"),
  getToken: () => localStorage.getItem("token"),
};

// Transaction API
export const transactionAPI = {
  getTransactions: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/transactions${params ? `?${params}` : ""}`);
  },
  addTransaction: (transactionData) =>
    api.post("/transactions", transactionData),
  getSummary: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/transactions/summary${params ? `?${params}` : ""}`);
  },
  getChartData: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/transactions/chart${params ? `?${params}` : ""}`);
  },
};

export default api;
