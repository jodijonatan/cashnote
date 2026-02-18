import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
    return { user: { userId: decoded.userId } };
  } catch (err) {
    return { error: "Invalid token", status: 403 };
  }
}

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// POST - Get financial advice from Gemini
export async function POST(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { question } = await request.json();
    const userId = auth.user.userId;

    console.log("AI Advisor Request:", { question, userId });

    if (!genAI) {
      console.log("Gemini API not configured");
      return NextResponse.json(
        {
          error:
            "Gemini API not configured. Please add GEMINI_API_KEY to environment variables.",
          details: "GEMINI_API_KEY is missing",
        },
        { status: 500 },
      );
    }

    if (!question || question.trim() === "") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 },
      );
    }

    // Get user's financial data
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50, // Last 50 transactions
    });

    console.log("Found transactions:", transactions.length);

    if (transactions.length === 0) {
      return NextResponse.json({
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

    return NextResponse.json({
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
      return NextResponse.json(
        {
          error: "Invalid Gemini API key. Please check your GEMINI_API_KEY.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    if (error.message.includes("quota")) {
      return NextResponse.json(
        {
          error: "API quota exceeded. Please try again later.",
          details: error.message,
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to get financial advice",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
