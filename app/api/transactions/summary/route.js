import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/prisma";

// Middleware to authenticate user
function authenticateToken(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return { error: "Access token required", status: 401 };
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );
    return { user: { id: decoded.userId } };
  } catch (err) {
    return { error: "Invalid token", status: 403 };
  }
}

// GET transaction summary
export async function GET(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause = {
      userId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    // Get current month data
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: whereClause,
    });

    const currentMonthIncome = currentMonthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpense = currentMonthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthBalance = currentMonthIncome - currentMonthExpense;

    // Get last month data for comparison
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const daysInMonth = currentEnd.getDate();

    const lastMonthStart = new Date(
      currentStart.getFullYear(),
      currentStart.getMonth() - 1,
      1,
    );
    const lastMonthEnd = new Date(
      currentStart.getFullYear(),
      currentStart.getMonth() - 1,
      daysInMonth,
    );

    const lastMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const lastMonthIncome = lastMonthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpense = lastMonthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthBalance = lastMonthIncome - lastMonthExpense;

    // Calculate percentage changes
    const incomeChange =
      lastMonthIncome > 0
        ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100
        : 0;

    const expenseChange =
      lastMonthExpense > 0
        ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100
        : 0;

    const balanceChange =
      lastMonthBalance !== 0
        ? ((currentMonthBalance - lastMonthBalance) /
            Math.abs(lastMonthBalance)) *
          100
        : 0;

    return NextResponse.json({
      income: currentMonthIncome,
      expense: currentMonthExpense,
      balance: currentMonthBalance,
      totalTransactions: currentMonthTransactions.length,
      comparison: {
        lastMonthIncome,
        lastMonthExpense,
        lastMonthBalance,
        incomeChange: parseFloat(incomeChange.toFixed(1)),
        expenseChange: parseFloat(expenseChange.toFixed(1)),
        balanceChange: parseFloat(balanceChange.toFixed(1)),
      },
    });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      { error: "Failed to get summary" },
      { status: 500 },
    );
  }
}
