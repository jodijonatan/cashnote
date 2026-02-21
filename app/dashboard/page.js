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
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { transactionAPI, authAPI } from "../../lib/api";
import Navbar from "../../components/Navbar";
import AIAdvisor from "../../components/AIAdvisor";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const currentDate = new Date();
      const filters = {
        startDate: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        )
          .toISOString()
          .split("T")[0],
        endDate: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        )
          .toISOString()
          .split("T")[0],
      };

      const [summaryRes, chartRes] = await Promise.all([
        transactionAPI.getSummary(filters),
        transactionAPI.getChartData(filters),
      ]);

      setSummary(summaryRes.data);
      setChartData(chartRes.data);
    } catch (err) {
      console.error("Gagal memuat data dashboard", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        authAPI.removeToken();
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-12">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Halo, Mahasiswa! 👋
          </h1>
          <p className="text-gray-500 font-medium">
            Ini adalah ringkasan finansialmu bulan ini.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-black text-white rounded-[32px] shadow-sm">
            <p className="text-sm opacity-70">Total Saldo</p>
            <h2 className="text-3xl font-mono mt-2">
              {formatCurrency(summary?.balance || 0)}
            </h2>
            <div className="mt-2 text-sm">
              <TrendIndicator
                change={summary?.comparison?.balanceChange}
                isDark
              />
            </div>
          </div>

          <StatCard
            label="Pemasukan"
            value={formatCurrency(summary?.income || 0)}
            type="income"
            icon={<ArrowUpRight />}
            change={summary?.comparison?.incomeChange}
          />

          <StatCard
            label="Pengeluaran"
            value={formatCurrency(summary?.expense || 0)}
            type="expense"
            icon={<ArrowDownRight />}
            change={summary?.comparison?.expenseChange}
          />
        </div>

        {/* Chart Section */}
        <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-[32px] shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h3 className="text-lg font-bold text-gray-900">
              Analisis Arus Kas
            </h3>
            <select className="bg-gray-50 border-none text-sm font-bold text-gray-600 rounded-xl px-4 py-2">
              <option>Bulan Ini</option>
              <option>Bulan Lalu</option>
            </select>
          </div>

          <div className="h-[300px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
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
      <AIAdvisor />
    </div>
  );
}

// Sub-komponen agar kode utama tidak gemuk
function StatCard({ label, value, type, icon, change }) {
  const isIncome = type === "income";
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <h2 className="text-2xl font-bold text-gray-900">
        {!isIncome && value !== "Rp 0" ? "-" : ""}
        {value}
      </h2>
      <TrendIndicator change={change} />
    </div>
  );
}

function TrendIndicator({ change, isDark = false }) {
  if (change === undefined || change === 0) return null;
  const isPositive = change >= 0;
  const colorClass = isDark
    ? isPositive
      ? "text-green-400"
      : "text-red-400"
    : isPositive
      ? "text-green-600"
      : "text-red-600";

  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(1)}% dari bulan lalu
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse space-y-8">
      <div className="h-20 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-[32px]" />
        ))}
      </div>
      <div className="h-[400px] bg-gray-200 rounded-[32px]" />
    </div>
  );
}
