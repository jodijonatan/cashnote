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

// GET all transactions for a user
export async function GET(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: auth.user.id,
        type: type || undefined,
        category: category || undefined,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Add new transaction
export async function POST(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { amount, type, category, description, date } = await request.json();

    if (!amount || !type || !category) {
      return NextResponse.json(
        { error: "Amount, type, and category are required" },
        { status: 400 },
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: date ? new Date(date) : new Date(),
        userId: auth.user.id,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Add transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
