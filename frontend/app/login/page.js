"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "../../lib/api";
import { Chrome } from "lucide-react";
import { Mail, Lock, Loader2, ArrowRight, LayoutDashboard } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("=== Login Page useEffect ===");

    // Check for existing token first
    const existingToken = authAPI.getToken();
    console.log("Existing token:", existingToken);

    if (existingToken) {
      console.log("Redirecting to dashboard with existing token...");
      router.push("/dashboard");
      return;
    }

    // Check for Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const error = urlParams.get("error");

    console.log("URL params - Token:", token, "Error:", error);
    console.log("Current URL:", window.location.href);

    if (token) {
      console.log("Processing OAuth token...");
      // Store token and redirect
      authAPI.setToken(token);
      console.log("Token stored, verifying...");

      // Verify token stored
      const storedToken = authAPI.getToken();
      console.log(
        "Stored token verification:",
        storedToken ? "SUCCESS" : "FAILED",
      );

      // Clear URL params to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log("URL cleaned, redirecting to dashboard...");
      router.push("/dashboard");
      return;
    }

    if (error) {
      console.log("OAuth Error:", error);
      setError("Login dengan Google gagal. Silakan coba lagi.");
      // Clear error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [router]);

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login(formData);
      authAPI.setToken(response.data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[100px] opacity-60" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Selamat Datang Kembali
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          Belum punya akun?{" "}
          <a
            href="/register"
            className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors"
          >
            Daftar gratis sekarang
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-10 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 sm:rounded-[32px] sm:px-12">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Alamat Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="block text-sm font-bold text-gray-700">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                >
                  Lupa password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-indigo-100"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Masuk ke Dashboard{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-medium">
                  Atau masuk dengan
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full inline-flex justify-center py-3 px-4 rounded-2xl border border-gray-100 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                />
                Google
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; 2026 Cashnote. Keamanan data kamu adalah prioritas kami.
        </p>
      </div>
    </div>
  );
}
