const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Get financial advice from Gemini
router.post("/advisor", protect, async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.userId;

    console.log("AI Advisor Request:", { question, userId });

    if (!genAI) {
      console.log("Gemini API not configured");
      return res.status(500).json({
        error:
          "Gemini API not configured. Please add GEMINI_API_KEY to environment variables.",
        details: "GEMINI_API_KEY is missing",
      });
    }

    if (!question || question.trim() === "") {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    // Get user's financial data
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50, // Last 50 transactions
    });

    console.log("Found transactions:", transactions.length);

    if (transactions.length === 0) {
      return res.json({
        advice:
          "Kamu belum memiliki data transaksi. Mulai dengan menambahkan transaksi untuk mendapatkan saran keuangan yang personal.",
        context: {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0,
        },
      });
    }

    // Calculate financial metrics
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;
    const avgExpense =
      totalExpense /
      (transactions.filter((t) => t.type === "expense").length || 1);

    // Get recent transactions for context
    const recentTransactions = transactions.slice(0, 10).map((t) => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
    }));

    // Create context for Gemini
    const context = `
      User Financial Profile:
      - Total Income: Rp ${totalIncome.toLocaleString("id-ID")}
      - Total Expenses: Rp ${totalExpense.toLocaleString("id-ID")}
      - Current Balance: Rp ${balance.toLocaleString("id-ID")}
      - Average Transaction: Rp ${avgExpense.toLocaleString("id-ID")}
      
      Recent Transactions:
      ${recentTransactions
        .map(
          (t) =>
            `- ${t.description} (${t.type}): Rp ${t.amount.toLocaleString("id-ID")} [${t.category}]`,
        )
        .join("\n")}
      
      User Question: ${question}
      
      Please provide financial advice in Bahasa Indonesia. Be specific, practical, and consider the user's actual spending patterns.
      Keep the response concise but comprehensive (max 150 words).
    `;

    console.log("Calling Gemini API...");

    // Get Gemini response
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(context);
    const response = await result.response;
    const advice = response.text();

    console.log("Gemini response received");

    res.json({
      advice: advice.trim(),
      context: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("AI Advisor Error:", error);

    // More specific error handling
    if (error.message.includes("API_KEY")) {
      return res.status(500).json({
        error: "Invalid Gemini API key. Please check your GEMINI_API_KEY.",
        details: error.message,
      });
    }

    if (error.message.includes("quota")) {
      return res.status(429).json({
        error: "API quota exceeded. Please try again later.",
        details: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to get financial advice",
      details: error.message,
    });
  }
});

// Analyze spending patterns
router.post("/analyze", protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!genAI) {
      return res.status(500).json({
        error:
          "Gemini API not configured. Please add GEMINI_API_KEY to environment variables.",
      });
    }

    // Get last 30 days of transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: "desc" },
    });

    // Group by category
    const expensesByCategory = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Create analysis context
    const context = `
      Analyze this user's spending patterns over the last 30 days:
      
      Total Expenses: Rp ${Object.values(expensesByCategory)
        .reduce((sum, amount) => sum + amount, 0)
        .toLocaleString("id-ID")}
      
      Spending by Category:
      ${Object.entries(expensesByCategory)
        .map(
          ([category, amount]) =>
            `- ${category}: Rp ${amount.toLocaleString("id-ID")}`,
        )
        .join("\n")}
      
      Please provide insights about:
      1. Top spending categories
      2. Potential areas for cost reduction
      3. Unusual spending patterns
      4. Recommendations for better budgeting
      
      Response in Bahasa Indonesia, max 120 words.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(context);
    const response = await result.response;
    const analysis = response.text();

    res.json({
      analysis: analysis.trim(),
      expensesByCategory,
      totalExpenses: Object.values(expensesByCategory).reduce(
        (sum, amount) => sum + amount,
        0,
      ),
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({
      error: "Failed to analyze spending patterns",
      details: error.message,
    });
  }
});

module.exports = router;
