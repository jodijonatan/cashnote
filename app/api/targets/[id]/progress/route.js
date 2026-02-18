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
    return { user: { userId: decoded.userId } };
  } catch (err) {
    return { error: "Invalid token", status: 403 };
  }
}

// POST - Update target progress (add amount)
export async function POST(request, { params }) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.userId;
    const { id } = params;
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 },
      );
    }

    // Check if target exists and belongs to user
    const target = await prisma.financialTarget.findFirst({
      where: { id, userId },
    });

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const updatedTarget = await prisma.financialTarget.update({
      where: { id },
      data: {
        currentAmount: {
          increment: parseFloat(amount),
        },
      },
    });

    return NextResponse.json(updatedTarget);
  } catch (error) {
    console.error("Update progress error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 },
    );
  }
}
