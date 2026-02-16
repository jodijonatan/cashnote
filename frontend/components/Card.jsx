import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

export const Card = ({ title, value, type }) => {
  // Konfigurasi gaya berdasarkan tipe data
  const config = {
    income: {
      icon: <ArrowUpRight className="w-5 h-5" />,
      colorClass: "text-emerald-600 bg-emerald-50",
      borderClass: "hover:border-emerald-200",
    },
    expense: {
      icon: <ArrowDownRight className="w-5 h-5" />,
      colorClass: "text-rose-600 bg-rose-50",
      borderClass: "hover:border-rose-200",
    },
    default: {
      icon: <Wallet className="w-5 h-5" />,
      colorClass: "text-blue-600 bg-blue-50",
      borderClass: "hover:border-blue-200",
    },
  };

  const style = config[type] || config.default;

  return (
    <div
      className={`group p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${style.borderClass}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-2xl transition-transform duration-500 group-hover:rotate-12 ${style.colorClass}`}
        >
          {style.icon}
        </div>
        <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
          Live Status
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {value}
          </h3>
          {type === "income" && (
            <span className="text-xs font-medium text-emerald-500">+2.5%</span>
          )}
        </div>
      </div>

      {/* Dekorasi halus untuk kesan mewah */}
      <div className="absolute top-0 right-0 -mt-1 -mr-1 w-24 h-24 bg-gradient-to-br from-gray-50 to-transparent opacity-50 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};
