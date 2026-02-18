"use client";
import { useState, useEffect } from "react";
import { targetAPI } from "../lib/api";
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  Edit,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

export default function FinancialTargets() {
  const [targets, setTargets] = useState([]);
  const [summary, setSummary] = useState({
    totalTargets: 0,
    completedTargets: 0,
    activeTargets: 0,
    totalTargetAmount: 0,
    totalCurrentAmount: 0,
    overallProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    category: "general",
    deadline: ""
  });
  const [editingTarget, setEditingTarget] = useState(null);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const [targetsResponse, summaryResponse] = await Promise.all([
        targetAPI.getTargets(),
        targetAPI.getSummary()
      ]);
      
      setTargets(targetsResponse.data);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error("Failed to fetch targets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTarget) {
        await targetAPI.updateTarget(editingTarget.id, formData);
      } else {
        await targetAPI.createTarget(formData);
      }
      
      setShowForm(false);
      setEditingTarget(null);
      setFormData({
        title: "",
        targetAmount: "",
        category: "general",
        deadline: ""
      });
      fetchTargets();
    } catch (error) {
      console.error("Failed to save target:", error);
    }
  };

  const handleEdit = (target) => {
    setEditingTarget(target);
    setFormData({
      title: target.title,
      targetAmount: target.targetAmount.toString(),
      category: target.category,
      deadline: target.deadline ? new Date(target.deadline).toISOString().split('T')[0] : ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah kamu yakin ingin menghapus target ini?")) {
      try {
        await targetAPI.deleteTarget(id);
        fetchTargets();
      } catch (error) {
        console.error("Failed to delete target:", error);
      }
    }
  };

  const handleAddProgress = async (id, amount) => {
    try {
      await targetAPI.updateProgress(id, amount);
      fetchTargets();
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-50";
      case "paused": return "text-yellow-600 bg-yellow-50";
      default: return "text-blue-600 bg-blue-50";
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Target Keuangan
          </h1>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">
                Total: {summary.totalTargets}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">
                Selesai: {summary.completedTargets}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-gray-600">
                Progress: {summary.overallProgress}%
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Target Baru
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTarget ? "Edit Target" : "Target Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Target
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="contoh: Dana Darurat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Target (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="100000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="general">Umum</option>
                  <option value="savings">Tabungan</option>
                  <option value="investment">Investasi</option>
                  <option value="emergency_fund">Dana Darurat</option>
                  <option value="education">Pendidikan</option>
                  <option value="vacation">Liburan</option>
                  <option value="gadget">Gadget</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline (Opsional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  {editingTarget ? "Update" : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTarget(null);
                    setFormData({
                      title: "",
                      targetAmount: "",
                      category: "general",
                      deadline: ""
                    });
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targets.map((target) => (
          <div
            key={target.id}
            className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  {target.title}
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(target.status)}`}>
                  {target.status === "completed" ? "Selesai" : 
                   target.status === "paused" ? "Ditunda" : "Aktif"}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(target)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(target.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span className="font-medium">
                  {target.progress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getProgressColor(target.progress)}`}
                  style={{ width: `${Math.min(target.progress, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Terkumpul:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(target.currentAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(target.targetAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sisa:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(Math.max(0, target.targetAmount - target.currentAmount))}
                </span>
              </div>
            </div>

            {/* Deadline */}
            {target.deadline && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Calendar className="w-4 h-4" />
                <span>
                  {target.daysLeft !== null ? (
                    target.isOverdue ? (
                      <span className="text-red-600">
                        Terlambat {Math.abs(target.daysLeft)} hari
                      </span>
                    ) : target.daysLeft <= 7 ? (
                      <span className="text-yellow-600">
                        {target.daysLeft} hari lagi
                      </span>
                    ) : (
                      <span>
                        {target.daysLeft} hari lagi
                      </span>
                    )
                  ) : (
                    "Tanpa deadline"
                  )}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Tambah jumlah"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const amount = parseFloat(e.target.value);
                    if (amount > 0) {
                      handleAddProgress(target.id, amount);
                      e.target.value = '';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = e.target.previousElementSibling;
                  const amount = parseFloat(input.value);
                  if (amount > 0) {
                    handleAddProgress(target.id, amount);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
              >
                <DollarSign className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {targets.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada target
          </h3>
          <p className="text-gray-600 mb-6">
            Mulai menetapkan target keuangan untuk mencapai tujuan finansialmu.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Target Pertama
          </button>
        </div>
      )}
    </div>
  );
}
