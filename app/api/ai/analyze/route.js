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

// POST - Analyze spending patterns
export async function POST(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.userId;

    if (!genAI) {
      return NextResponse.json(
        {
          error:
            "Gemini API not configured. Please add GEMINI_API_KEY to environment variables.",
        },
        { status: 500 },
      );
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

    return NextResponse.json({
      analysis: analysis.trim(),
      expensesByCategory,
      totalExpenses: Object.values(expensesByCategory).reduce(
        (sum, amount) => sum + amount,
        0,
      ),
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze spending patterns",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
