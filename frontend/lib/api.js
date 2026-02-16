import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

// Interceptor untuk menyisipkan Token secara otomatis ke semua request
api.interceptors.request.use((config) => {
  // Pengecekan typeof window untuk memastikan kode berjalan di browser (Client Side)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  setToken: (token) => {
    console.log("Setting token:", token ? "SUCCESS" : "FAILED");
    localStorage.setItem("token", token);
  },
  removeToken: () => {
    console.log("Removing token...");
    localStorage.removeItem("token");
  },
  getToken: () => {
    const token = localStorage.getItem("token");
    console.log("Getting token:", token ? "EXISTS" : "NULL");
    return token;
  },
};

// Transaction API
export const transactionAPI = {
  // Mengambil semua transaksi dengan dukungan query params
  getTransactions: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/transactions${params ? `?${params}` : ""}`);
  },
  // Menambah transaksi baru
  addTransaction: (transactionData) =>
    api.post("/transactions", transactionData),
  /**
   * UPDATE TRANSAKSI
   * @param {string} id - ID Transaksi yang akan diubah
   * @param {object} transactionData - Data baru (amount, type, category, etc.)
   */
  updateTransaction: (id, transactionData) =>
    api.put(`/transactions/${id}`, transactionData),
  /**
   * DELETE TRANSAKSI
   * @param {string} id - ID Transaksi yang akan dihapus
   */
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

// AI API
export const aiAPI = {
  getFinancialAdvice: (question) => api.post("/ai/advisor", { question }),
};

export default api;
