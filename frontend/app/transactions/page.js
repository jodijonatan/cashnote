"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "EXPENSE",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
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
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await transactionAPI.getTransactions();
      setTransactions(response.data);
    } catch (err) {
      setError("Gagal mengambil data transaksi");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await transactionAPI.addTransaction(formData);
      setFormData({
        amount: "",
        type: "EXPENSE",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowAddForm(false);
      fetchTransactions();
    } catch (err) {
      setError("Gagal menambah transaksi");
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
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Transaksi Baru
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
              placeholder="Cari transaksi atau kategori..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {["Semua", "Pemasukan", "Pengeluaran"].map((tab) => (
              <button
                key={tab}
                className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 whitespace-nowrap"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Belum ada aktivitas
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Mulai catat transaksi pertama Anda hari ini.
              </p>
            </div>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="group bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300"
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
                <div className="text-right flex items-center gap-4">
                  <span
                    className={`text-lg font-extrabold tracking-tight ${t.type === "INCOME" ? "text-emerald-600" : "text-gray-900"}`}
                  >
                    {t.type === "INCOME" ? "+" : "-"} {formatCurrency(t.amount)}
                  </span>
                  <button className="p-2 text-gray-300 hover:text-gray-600 rounded-full">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modern Modal for Adding Transaction */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAddForm(false)}
          />
          <div className="bg-white w-full max-w-lg rounded-[32px] relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-extrabold text-gray-900">
                Catat Transaksi
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none text-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.amount}
                    onChange={handleChange}
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
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.category}
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                    placeholder="Contoh: Makan siang bareng teman"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {submitLoading ? "Memproses..." : "Simpan Transaksi"}
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
