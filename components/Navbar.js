"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  ArrowRightLeft,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { authAPI } from "../lib/api";

const NavItem = ({ onClick, icon: Icon, label, variant = "default" }) => {
  const variants = {
    default: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    primary: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
    danger: "text-rose-600 bg-rose-50 hover:bg-rose-100",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 md:py-2 text-sm font-semibold rounded-xl transition-all w-full md:w-auto ${variants[variant]}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    authAPI.removeToken();
    router.push("/login");
  };

  const navigateTo = (path) => {
    router.push(path);
    setIsOpen(false); // Tutup menu setelah klik di mobile
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigateTo("/dashboard")}
        >
          <div className="bg-indigo-600 p-2 rounded-xl">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">
            Cash Note
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          <NavItem
            icon={Target}
            label="Targets"
            variant="primary"
            onClick={() => navigateTo("/targets")}
          />
          <NavItem
            icon={ArrowRightLeft}
            label="Transaksi"
            onClick={() => navigateTo("/transactions")}
          />
          <NavItem
            icon={LogOut}
            label="Keluar"
            variant="danger"
            onClick={handleLogout}
          />
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 p-4 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          <NavItem
            icon={Target}
            label="Targets"
            variant="primary"
            onClick={() => navigateTo("/targets")}
          />
          <NavItem
            icon={ArrowRightLeft}
            label="Transaksi"
            onClick={() => navigateTo("/transactions")}
          />
          <NavItem
            icon={LogOut}
            label="Keluar"
            variant="danger"
            onClick={handleLogout}
          />
        </div>
      )}
    </nav>
  );
}
