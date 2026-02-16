// frontend/src/app/dashboard/page.js
"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { transactionAPI, authAPI } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    totalTransactions: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = authAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current month's data
      const currentDate = new Date();
      const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );

      const filters = {
        startDate: firstDay.toISOString().split("T")[0],
        endDate: lastDay.toISOString().split("T")[0],
      };

      const [summaryData, chartResponse] = await Promise.all([
        transactionAPI.getSummary(filters),
        transactionAPI.getChartData(filters),
      ]);

      setSummary(summaryData.data);
      setChartData(chartResponse.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.removeToken();
    router.push("/login");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-2xl mt-8"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Halo, Mahasiswa! 👋
          </h1>
          <p className="text-gray-500">Berikut ringkasan dompetmu bulan ini.</p>
        </div>
        <div className="flex gap-4">
          <a
            href="/transactions"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Transaksi
          </a>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-black text-white rounded-2xl shadow-sm">
          <p className="text-sm opacity-70">Total Saldo</p>
          <h2 className="text-3xl font-mono mt-2">
            {formatCurrency(summary.balance)}
          </h2>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-2xl">
          <p className="text-sm text-gray-500 font-medium">Pemasukan</p>
          <h2 className="text-2xl text-green-600 mt-2">
            + {formatCurrency(summary.income)}
          </h2>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-2xl">
          <p className="text-sm text-gray-500 font-medium">Pengeluaran</p>
          <h2 className="text-2xl text-red-600 mt-2">
            - {formatCurrency(summary.expense)}
          </h2>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-gray-100 p-6 rounded-2xl h-80">
        <h3 className="font-semibold mb-4">Tren Keuangan</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `Rp${(value / 1000000).toFixed(1)}jt`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value, name) => [
                  formatCurrency(value),
                  name === "income"
                    ? "Pemasukan"
                    : name === "expense"
                      ? "Pengeluaran"
                      : "Saldo",
                ]}
              />
              <Legend
                formatter={(value) =>
                  value === "income"
                    ? "Pemasukan"
                    : value === "expense"
                      ? "Pengeluaran"
                      : "Saldo"
                }
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                name="income"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", r: 4 }}
                name="expense"
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#000"
                strokeWidth={2}
                dot={{ fill: "#000", r: 4 }}
                name="balance"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Belum ada data transaksi bulan ini</p>
          </div>
        )}
      </div>
    </div>
  );
}
