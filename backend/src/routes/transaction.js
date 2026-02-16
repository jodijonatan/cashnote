const express = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// Middleware to authenticate user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }
      req.user = { id: decoded.userId };
      next();
    },
  );
};

// Get all transactions for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { category, type, startDate, endDate } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        type: type || undefined,
        category: category || undefined,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      orderBy: { date: "desc" },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new transaction
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;

    if (!amount || !type || !category) {
      return res
        .status(400)
        .json({ error: "Amount, type, and category are required" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: date ? new Date(date) : new Date(),
        userId: req.user.id,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Add transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get transaction summary
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate
            ? new Date(startDate)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: endDate ? new Date(endDate) : new Date(),
        },
      },
    });

    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    res.json({
      income,
      expense,
      balance,
      totalTransactions: transactions.length,
    });
  } catch (error) {
    console.error("Get summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get transactions grouped by date for chart
router.get("/chart", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate
            ? new Date(startDate)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: endDate ? new Date(endDate) : new Date(),
        },
      },
      orderBy: { date: "asc" },
    });

    // Group transactions by date
    const groupedData = transactions.reduce((acc, transaction) => {
      const date = transaction.date.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }

      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }

      return acc;
    }, {});

    const chartData = Object.values(groupedData).map((item) => ({
      name: new Date(item.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
      income: item.income,
      expense: item.expense,
      balance: item.income - item.expense,
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Get chart data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update transaction
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, description, date } = req.body;

    if (!amount || !type || !category) {
      return res
        .status(400)
        .json({ error: "Amount, type, and category are required" });
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: date ? new Date(date) : existingTransaction.date,
      },
    });

    res.json(transaction);
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete transaction
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
