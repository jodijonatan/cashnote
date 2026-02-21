"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { transactionAPI, authAPI } from "../../lib/api";
import {
  Plus,
  Search,
  ArrowLeft,
  Calendar,
  Tag,
  PlusCircle,
  MinusCircle,
  X,
  History,
  MoreVertical,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Edit2,
} from "lucide-react";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // States for Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Semua");

  // States for Form Modal
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    type: "EXPENSE",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // State for Dropdown
  const [openMenuId, setOpenMenuId] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const router = useRouter();

  const categories = {
    EXPENSE: [
      "Makanan",
      "Transportasi",
      "Belanja",
      "Hiburan",
      "Kesehatan",
      "Pendidikan",
      "Lainnya",
    ],
    INCOME: ["Gaji", "Hadiah", "Investasi", "Freelance", "Lainnya"],
  };

  useEffect(() => {
    const token = authAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const response = await transactionAPI.getTransactions();
      setTransactions(response.data);
    } catch (err) {
      console.error("Gagal mengambil data transaksi", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        authAPI.removeToken();
        router.push("/login");
      }
      setError("Gagal mengambil data transaksi");
    } finally {
      setLoading(false);
    }
  };

  // --- Logic Search & Filter ---
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesTab =
          activeTab === "Semua" ||
          (activeTab === "Pemasukan" && t.type === "INCOME") ||
          (activeTab === "Pengeluaran" && t.type === "EXPENSE");

        const matchesSearch =
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.description &&
            t.description.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesTab && matchesSearch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, searchTerm, activeTab]);

  // --- Logic Actions ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      amount: "",
      type: "EXPENSE",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowForm(true);
  };

  const handleOpenEdit = (t) => {
    setIsEditing(true);
    setCurrentId(t.id);
    setFormData({
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description || "",
      date: t.date.split("T")[0],
    });
    setShowForm(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      try {
        const response = await transactionAPI.deleteTransaction(id);

        // Jika berhasil, update state lokal agar data hilang dari layar
        setTransactions(transactions.filter((t) => t.id !== id));
        alert("Transaksi berhasil dihapus!");
      } catch (err) {
        // Tampilkan pesan error asli dari backend
        const errMsg =
          err.response?.data?.message || "Gagal menghapus transaksi";
        console.error("Detail Error:", err.response);
        alert(errMsg);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (isEditing) {
        await transactionAPI.updateTransaction(currentId, formData); // Pastikan fungsi ini ada
      } else {
        await transactionAPI.addTransaction(formData);
      }
      setShowForm(false);
      fetchTransactions();
    } catch (err) {
      setError("Gagal menyimpan transaksi");
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Riwayat Transaksi
            </h1>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Transaksi Baru
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 mt-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kategori atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {["Semua", "Pemasukan", "Pengeluaran"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-dashed border-gray-200">
              <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">
                Tidak ada transaksi ditemukan
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Coba ubah kata kunci atau filter Anda.
              </p>
            </div>
          ) : (
            filteredTransactions.map((t) => (
              <div
                key={t.id}
                className="group bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between hover:shadow-md transition-all relative"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-2xl ${t.type === "INCOME" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                  >
                    {t.type === "INCOME" ? (
                      <ArrowUpCircle className="w-6 h-6" />
                    ) : (
                      <ArrowDownCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.category}</h4>
                    <div className="flex items-center gap-3 mt-0.5 text-xs font-medium text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{" "}
                        {new Date(t.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {t.description && (
                        <span className="flex items-center gap-1 border-l pl-3">
                          <Tag className="w-3 h-3" /> {t.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-lg font-extrabold tracking-tight ${t.type === "INCOME" ? "text-emerald-600" : "text-gray-900"}`}
                  >
                    {t.type === "INCOME" ? "+" : "-"} {formatCurrency(t.amount)}
                  </span>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === t.id ? null : t.id)
                      }
                      className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {openMenuId === t.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 border-t border-gray-50"
                        >
                          <Trash2 className="w-4 h-4" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modern Modal for Add/Update */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="bg-white w-full max-w-lg rounded-[32px] relative z-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-gray-900">
                {isEditing ? "Edit Transaksi" : "Catat Transaksi"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "EXPENSE", category: "" })
                  }
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${formData.type === "EXPENSE" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}
                >
                  <MinusCircle className="w-4 h-4" /> Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "INCOME", category: "" })
                  }
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${formData.type === "INCOME" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}
                >
                  <PlusCircle className="w-4 h-4" /> Pemasukan
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xl">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0"
                    required
                    autoFocus
                    className="w-full pl-14 pr-4 py-5 bg-gray-50 rounded-2xl border-none text-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                      Kategori
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      <option value="">Pilih</option>
                      {categories[formData.type].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="Contoh: Makan siang"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {submitLoading
                  ? "Memproses..."
                  : isEditing
                    ? "Perbarui Transaksi"
                    : "Simpan Transaksi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-10 bg-gray-200 rounded-xl w-48 mb-12" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}
