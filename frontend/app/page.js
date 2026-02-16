"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../lib/api";
import {
  ArrowRight,
  Wallet,
  PieChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = authAPI.getToken();
    if (token) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-blue-50/50 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Wallet className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">
            Cashnote
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#" className="hover:text-indigo-600 transition-colors">
            Fitur
          </a>
          <a href="#" className="hover:text-indigo-600 transition-colors">
            Tentang
          </a>
          <a
            href="/login"
            className="px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all"
          >
            Masuk
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-8 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>Smart Finance Manager v2.0</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500">
            Kendalikan Uangmu, <br />
            <span className="text-indigo-600">Bukan Sebaliknya.</span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-slate-500 mb-12 leading-relaxed">
            Cashnote membantu ribuan orang mengelola finansial dengan presisi.
            Catat pengeluaran, pantau anggaran, dan capai kebebasan finansial
            lebih cepat.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <a
              href="/register"
              className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 text-white font-bold transition-all hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 active:scale-95"
            >
              Mulai Sekarang Gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/login"
              className="flex h-14 items-center justify-center px-8 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
            >
              Lihat Demo
            </a>
          </div>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
          <FeatureCard
            icon={<PieChart className="w-6 h-6 text-indigo-600" />}
            title="Analitik Visual"
            desc="Grafik cantik yang memudahkanmu membaca pola pengeluaran bulanan."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
            title="Keamanan Utama"
            desc="Data terenkripsi penuh. Keamanan finansialmu adalah prioritas kami."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6 text-amber-600" />}
            title="Saran Pintar AI"
            desc="Dapatkan rekomendasi hemat berdasarkan gaya hidup unikmu."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      <p className="mt-4 font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">
        Cashnote
      </p>
    </div>
  );
}
