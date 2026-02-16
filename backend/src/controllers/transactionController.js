// backend/src/controllers/transactionController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getTransactions = async (req, res) => {
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
};

const addTransaction = async (req, res) => {
  const { amount, type, category, description, date } = req.body;
  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      type,
      category,
      description,
      date: new Date(date),
      userId: req.user.id,
    },
  });
  res.status(201).json(transaction);
};

module.exports = { getTransactions, addTransaction };
