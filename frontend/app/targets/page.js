"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/api";
import FinancialTargets from "../../components/FinancialTargets";
import { ArrowLeft, Target } from "lucide-react";

export default function TargetsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = authAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  const handleLogout = () => {
    authAPI.removeToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Target className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">
              Cash Note - Targets
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => router.push("/transactions")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            >
              Transaksi
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
            >
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <FinancialTargets />
      </main>
    </div>
  );
}
