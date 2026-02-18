// [project]/lib/api.js

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
});

// Interceptor untuk menyisipkan Token secara otomatis ke semua request
api.interceptors.request.use((config) => {
  // Pengecekan typeof window untuk memastikan kode berjalan di browser (Client Side)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  setToken: (token) => {
    if (typeof window !== "undefined") {
      console.log("Setting token:", token ? "SUCCESS" : "FAILED");
      localStorage.setItem("token", token);
    }
  },
  removeToken: () => {
    if (typeof window !== "undefined") {
      console.log("Removing token...");
      localStorage.removeItem("token");
    }
  },
  getToken: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      console.log("Getting token:", token ? "EXISTS" : "NULL");
      return token;
    }
    return null;
  },
};

export const transactionAPI = {
  // Mengambil semua transaksi dengan dukungan query params
  getTransactions: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/transactions${params ? `?${params}` : ""}`);
  },
  // Menambah transaksi baru
  addTransaction: (transactionData) =>
    api.post("/transactions", transactionData),

  // UPDATE TRANSAKSI
  updateTransaction: (id, transactionData) =>
    api.put(`/transactions/${id}`, transactionData),

  // DELETE TRANSAKSI
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),

  // Mendapatkan ringkasan (Total In/Out)
  getSummary: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/transactions/summary${params ? `?${params}` : ""}`);
  },

  // Mendapatkan data untuk grafik
  getChartData: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/transactions/chart${params ? `?${params}` : ""}`);
  },
};

export const targetAPI = {
  getTargets: () => api.get("/targets"),
  createTarget: (targetData) => api.post("/targets", targetData),
  updateTarget: (id, targetData) => api.put(`/targets/${id}`, targetData),
  updateProgress: (id, amount) =>
    api.post(`/targets/${id}/progress`, { amount }),
  deleteTarget: (id) => api.delete(`/targets/${id}`),
  getSummary: () => api.get("/targets/summary"),
};

export const aiAPI = {
  getFinancialAdvice: (question) => api.post("/ai/advisor", { question }),
  analyzeSpending: () => api.post("/ai/analyze"),
};

export default api;
