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

// GET target summary
export async function GET(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.userId;

    const targets = await prisma.financialTarget.findMany({
      where: { userId },
    });

    const totalTargets = targets.length;
    const completedTargets = targets.filter(
      (t) => t.currentAmount / t.targetAmount >= 100,
    ).length;
    const totalTargetAmount = targets.reduce(
      (sum, t) => sum + t.targetAmount,
      0,
    );
    const totalCurrentAmount = targets.reduce(
      (sum, t) => sum + t.currentAmount,
      0,
    );
    const overallProgress =
      totalTargetAmount > 0
        ? (totalCurrentAmount / totalTargetAmount) * 100
        : 0;

    return NextResponse.json({
      totalTargets,
      completedTargets,
      activeTargets: totalTargets - completedTargets,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress: parseFloat(overallProgress.toFixed(1)),
    });
  } catch (error) {
    console.error("Target summary error:", error);
    return NextResponse.json(
      { error: "Failed to get target summary" },
      { status: 500 },
    );
  }
}
