import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/prisma";
import { authenticateToken } from "@/lib/auth";

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
    const userId = auth.user.id;

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
