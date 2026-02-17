const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Middleware to authenticate user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = { id: decoded.userId };
    next();
  });
};

  try {
    const { question } = req.body;
    const userId = req.user.userId;

    if (!genAI) {
      return res.status(500).json({ 
        error: "Gemini API not configured. Please add GEMINI_API_KEY to environment variables." 
      });
    }

    // Get user's financial data
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50, // Last 50 transactions
    });

    // Calculate financial metrics
    const totalIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;
    const avgExpense = totalExpense / (transactions.filter(t => t.type === "expense").length || 1);

    // Get recent transactions for context
    const recentTransactions = transactions.slice(0, 10).map(t => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date
    }));

    // Create context for Gemini
    const context = `
      User Financial Profile:
      - Total Income: Rp ${totalIncome.toLocaleString('id-ID')}
      - Total Expenses: Rp ${totalExpense.toLocaleString('id-ID')}
      - Current Balance: Rp ${balance.toLocaleString('id-ID')}
      - Average Transaction: Rp ${avgExpense.toLocaleString('id-ID')}
      
      Recent Transactions:
      ${recentTransactions.map(t => 
        `- ${t.description} (${t.type}): Rp ${t.amount.toLocaleString('id-ID')} [${t.category}]`
      ).join('\n')}
      
      User Question: ${question}
      
      Please provide financial advice in Bahasa Indonesia. Be specific, practical, and consider the user's actual spending patterns.
      Keep the response concise but comprehensive (max 150 words).
    `;

    // Get Gemini response
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(context);
    const response = await result.response;
    const advice = response.text();

    res.json({
      advice: advice.trim(),
      context: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length
      }
    });

  } catch (error) {
    console.error("AI Advisor Error:", error);
    res.status(500).json({ 
      error: "Failed to get financial advice",
      details: error.message 
    });
  }
});

// Analyze spending patterns
router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!genAI) {
      return res.status(500).json({ 
        error: "Gemini API not configured. Please add GEMINI_API_KEY to environment variables." 
      });
    }

    // Get last 30 days of transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await prisma.transaction.findMany({
      where: { 
        userId,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: "desc" }
    });

    // Group by category
    const expensesByCategory = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Create analysis context
    const context = `
      Analyze this user's spending patterns over the last 30 days:
      
      Total Expenses: Rp ${Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0).toLocaleString('id-ID')}
      
      Spending by Category:
      ${Object.entries(expensesByCategory).map(([category, amount]) => 
        `- ${category}: Rp ${amount.toLocaleString('id-ID')}`
      ).join('\n')}
      
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
      totalExpenses: Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0)
    });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ 
      error: "Failed to analyze spending patterns",
      details: error.message 
    });
  }
});

  
  if (questionLower.includes('saran') || questionLower.includes('advice')) {
    if (context.balance < 0) {
      return `Kamu mengalami defisit Rp ${Math.abs(context.balance).toLocaleString('id-ID')} bulan ini. Fokus untuk mengurangi pengeluaran di ${context.topExpenseCategory} dan cari cara untuk menambah pendapatan.`;
    } else if (context.savingsRate < 10) {
      return `Tingkat tabunganmu rendah (${context.savingsRate.toFixed(1)}%). Coba alokasikan 10-20% pendapatan untuk tabungan darurat.`;
    } else {
      return `Keuanganmu cukup sehat dengan tingkat tabungan ${context.savingsRate.toFixed(1)}%. Pertahankan kebiasaan baik ini dan pertimbangkan untuk menetapkan target keuangan spesifik.`;
    }
  }
  
  // Default response
  return `Berdasarkan data keuangan bulan ${context.month}: Total pendapatan Rp ${context.totalIncome.toLocaleString('id-ID')}, pengeluaran Rp ${context.totalExpense.toLocaleString('id-ID')}, dengan sisa Rp ${context.balance.toLocaleString('id-ID')}. Ada yang bisa saya bantu lebih spesifik?`;
}

module.exports = router;
