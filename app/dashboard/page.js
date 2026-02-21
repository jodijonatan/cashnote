"use client";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  LogOut,
  ArrowRightLeft,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { transactionAPI, authAPI } from "../../lib/api";
import AIAdvisor from "../../components/AIAdvisor";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    totalTransactions: 0,
    comparison: {
      incomeChange: 0,
      expenseChange: 0,
      balanceChange: 0,
    },
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    console.log("=== Dashboard useEffect ===");
    const token = authAPI.getToken();
    console.log("Dashboard token check:", token);

    if (!token) {
      console.log("No token found, redirecting to login...");
      router.push("/login");
      return;
    }

    console.log("Token found, fetching dashboard data...");
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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
      setError("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (change) => {
    const isPositive = change >= 0;
    const color = isPositive ? "text-green-600" : "text-red-600";
    const sign = isPositive ? "+" : "";

    return (
      <span className={color}>
        {sign}
        {change.toFixed(1)}%
      </span>
    );
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-12">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-11">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">
              Cash Note
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/targets")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
            >
              <Target className="w-4 h-4" />
              Targets
            </button>
            <button
              onClick={() => router.push("/transactions")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transaksi
            </button>
            <button
              onClick={() => {
                authAPI.removeToken();
                router.push("/login");
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight transition-all">
            Halo, Mahasiswa! 👋
          </h1>
          <p className="text-gray-500 font-medium">
            Ini adalah ringkasan finansialmu bulan ini.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-black text-white rounded-2xl shadow-sm">
            <p className="text-sm opacity-70">Total Saldo</p>
            <h2 className="text-3xl font-mono mt-2">
              {formatCurrency(summary?.balance || 0)}
            </h2>
            <div className="mt-2 text-sm">
              {/* PERBAIKAN: Tambahkan optional chaining (?.) */}
              {summary?.comparison?.balanceChange !== 0 && (
                <span
                  className={
                    summary?.comparison?.balanceChange >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {summary?.comparison?.balanceChange >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(summary?.comparison?.balanceChange || 0).toFixed(1)}
                  % dari bulan lalu
                </span>
              )}
            </div>
          </div>

          <StatCard
            label="Pemasukan"
            value={formatCurrency(summary?.income || 0)}
            type="income"
            icon={<ArrowUpRight />}
            // PERBAIKAN: Tambahkan optional chaining
            change={summary?.comparison?.incomeChange}
          />

          <StatCard
            label="Pengeluaran"
            value={formatCurrency(summary?.expense || 0)}
            type="expense"
            icon={<ArrowDownRight />}
            // PERBAIKAN: Tambahkan optional chaining
            change={summary?.comparison?.expenseChange}
          />
        </div>

        {/* Chart Section */}
        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-gray-900">
              Analisis Arus Kas
            </h3>
            <select className="bg-gray-50 border-none text-sm font-bold text-gray-600 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500">
              <option>Bulan Ini</option>
              <option>Bulan Lalu</option>
            </select>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={undefined}
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      {/* AI Advisor Component */}
      <AIAdvisor />
    </div>
  );
}

// Sub-komponen Card untuk Statistik
function StatCard({ label, value, type, icon, change }) {
  const isIncome = type === "income";
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <h2
        className={`text-2xl font-bold tracking-tight ${isIncome ? "text-gray-900" : "text-gray-900"}`}
      >
        {isIncome ? "" : "-"}
        {value}
      </h2>
      {change !== undefined && (
        <div className="mt-2 text-sm">
          <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}% dari bulan
            lalu
          </span>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse space-y-8">
      <div className="h-10 bg-gray-200 rounded-xl w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-[32px]" />
        ))}
      </div>
      <div className="h-[400px] bg-gray-200 rounded-[32px]" />
    </div>
  );
}
