"use client";
import { useState } from "react";
import { aiAPI } from "../lib/api";
import {
  Brain,
  Send,
  Loader2,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
} from "lucide-react";

export default function AIAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "Bagaimana kondisi keuangan saya bulan ini?",
    "Di mana saja pengeluaran terbesar saya?",
    "Berapa sisa uang saya bulan ini?",
    "Berikan saran untuk menabung lebih baik",
    "Apakah pengeluaran saya sudah wajar?",
  ];

  const handleAsk = async (customQuestion = null) => {
    const questionToAsk = customQuestion || question;
    if (!questionToAsk.trim()) return;

    setLoading(true);
    setResponse("");
    setContext(null);

    try {
      const result = await aiAPI.getFinancialAdvice(questionToAsk);
      setResponse(result.data.response);
      setContext(result.data.context);
      setQuestion("");
    } catch (error) {
      console.error("AI Advisor Error:", error);
      setResponse("Maaf, terjadi kesalahan. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        title="Tanya AI tentang Keuanganku"
      >
        <Brain className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6" />
              <h2 className="text-xl font-bold">AI Financial Advisor</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-purple-100 text-sm mt-2">
            Tanyakan apa saja tentang kondisi keuangan Anda
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Questions */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Pertanyaan Cepat:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleAsk(q)}
                  className="text-gray-500 text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Pertanyaan Kustom:
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik pertanyaan Anda..."
                className="text-gray-500 flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <button
                onClick={() => handleAsk()}
                disabled={loading || !question.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Kirim
              </button>
            </div>
          </div>

          {/* Response */}
          {response && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-800 leading-relaxed">{response}</p>

                  {/* Context Info */}
                  {context && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">
                            Pendapatan:{" "}
                            <strong>
                              Rp {context.totalIncome.toLocaleString("id-ID")}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-gray-600">
                            Pengeluaran:{" "}
                            <strong>
                              Rp {context.totalExpense.toLocaleString("id-ID")}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PiggyBank className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-600">
                            Sisa:{" "}
                            <strong>
                              Rp {context.balance.toLocaleString("id-ID")}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
