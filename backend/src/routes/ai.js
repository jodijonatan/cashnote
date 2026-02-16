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

// AI Financial Advisor endpoint
router.post('/advisor', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get user's transaction data for analysis
    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    });

    // Calculate financial metrics
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    // Group expenses by category
    const expensesByCategory = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Find top expense category
    const topCategory = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)[0];

    // Create context for AI
    const financialContext = {
      totalIncome: income,
      totalExpense: expense,
      balance: balance,
      savingsRate: income > 0 ? ((income - expense) / income * 100) : 0,
      topExpenseCategory: topCategory ? topCategory[0] : null,
      topExpenseAmount: topCategory ? topCategory[1] : 0,
      transactionCount: transactions.length,
      month: currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    };

    // AI Response logic (simplified - in production you'd use real AI API)
    let aiResponse = generateFinancialAdvice(question, financialContext);

    res.json({ 
      question,
      response: aiResponse,
      context: financialContext
    });

  } catch (error) {
    console.error('AI Advisor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple AI response generator (in production, integrate with OpenAI/Gemini)
function generateFinancialAdvice(question, context) {
  const questionLower = question.toLowerCase();
  
  // Advice patterns based on common questions
  if (questionLower.includes('sisa') || questionLower.includes('saldo')) {
    return `Berdasarkan data bulan ${context.month}, kamu memiliki sisa saldo Rp ${context.balance.toLocaleString('id-ID')}. ${context.balance > 0 ? 'Bagus! Kamu berhasil menabung.' : 'Kamu perlu mengurangi pengeluaran.'}`;
  }
  
  if (questionLower.includes('pengeluaran') || questionLower.includes('belanja')) {
    const topCategoryPercent = context.totalIncome > 0 ? (context.topExpenseAmount / context.totalIncome * 100) : 0;
    return `Pengeluaran terbesarmu bulan ini adalah ${context.topExpenseCategory} sebesar Rp ${context.topExpenseAmount.toLocaleString('id-ID')} (${topCategoryPercent.toFixed(1)}% dari pendapatan). ${topCategoryPercent > 30 ? 'Ini cukup besar! Pertimbangkan untuk mengurangi pengeluaran di kategori ini.' : 'Masih dalam batas wajar.'}`;
  }
  
  if (questionLower.includes('tabungan') || questionLower.includes('investasi')) {
    const savingsRate = context.savingsRate;
    if (savingsRate < 20) {
      return `Tingkat tabunganmu saat ini ${savingsRate.toFixed(1)}%. Disarankan untuk menabung minimal 20% pendapatan. Coba kurangi pengeluaran di ${context.topExpenseCategory} atau cari cara untuk meningkatkan pendapatan.`;
    } else if (savingsRate < 30) {
      return `Tingkat tabunganmu ${savingsRate.toFixed(1)}%. Cukup baik! Pertimbangkan untuk mengalokasikan sebagian tabungan ke investasi dengan return lebih tinggi.`;
    } else {
      return `Luar biasa! Tingkat tabunganmu ${savingsRate.toFixed(1)}%. Kamu bisa mempertimbangkan untuk diversifikasi investasi atau mencapai target keuangan jangka panjang.`;
    }
  }
  
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
