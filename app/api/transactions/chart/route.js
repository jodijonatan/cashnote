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

// GET transactions grouped by date for chart
export async function GET(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: auth.user.id,
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

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Get chart data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
